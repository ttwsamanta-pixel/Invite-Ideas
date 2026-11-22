import { Body, Controller, Get, Post, UseGuards, Req, Param, Patch, BadRequestException } from '@nestjs/common'
import { z } from 'zod'
import { AdminGuard, AuthGuard, AuthService, Mail, type AuthRequest } from './auth'
import { Db, email, note, short, slug, secureUrl, validate } from './core'
import { Invitations } from './invitations'

const imagePath = z.string().regex(/^\/images\/[a-z0-9-]+\.webp$/)
const configSchema = z.object({ theme: z.enum(['ruby', 'rose', 'night', 'marigold']), names: short, image: imagePath, sections: z.array(z.enum(['events', 'countdown', 'gallery', 'story', 'family', 'rsvp', 'music'])).max(7) })
const priceSchema = z.object({
  regularPrice: z.number().int().min(100).max(10_000_000),
  offerPrice: z.number().int().min(100).max(10_000_000),
}).refine(prices => prices.offerPrice <= prices.regularPrice)
const audit = (actorId: string, action: string, targetId: string) => ({ actorId, action, targetId, detail: {} })

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly db: Db, private readonly invitations: Invitations, private readonly auth: AuthService, private readonly mail: Mail) {}

  @Get()
  async dashboard() {
    const [users, invitations, orders, logs, totals] = await Promise.all([
      this.db.user.findMany({ where: { role: 'CUSTOMER' }, orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, name: true, email: true, verifiedAt: true } }),
      this.db.invitation.findMany({ take: 100, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, source: true, status: true, slug: true, finalEventAt: true, owner: { select: { name: true } } } }),
      this.db.order.findMany({ take: 100, orderBy: { createdAt: 'desc' }, include: { invitation: { select: { title: true } } } }),
      this.db.activityLog.findMany({ take: 50, orderBy: { createdAt: 'desc' }, include: { actor: { select: { name: true } } } }),
      this.db.order.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true }, _count: true }),
    ])
    return { users, invitations: invitations.map(invitation => this.invitations.present(invitation)), orders, logs, totals }
  }

  @Post('customers')
  async createCustomer(@Req() req: AuthRequest, @Body() raw: unknown) {
    const input = validate(z.object({ name: short, email }), raw)
    return this.db.$transaction(async tx => {
      const customer = await tx.user.upsert({ where: { email: input.email }, create: input, update: {}, select: { id: true, email: true, name: true, role: true } })
      if (customer.role !== 'CUSTOMER') throw new BadRequestException('A customer account is required.')
      await tx.activityLog.create({ data: audit(req.account.id, 'CUSTOMER_ASSISTED', customer.id) })
      return customer
    })
  }

  @Post('customers/:id/activation')
  async activation(@Param('id') id: string) {
    if (!this.mail.available) throw new BadRequestException('Email delivery is unavailable.')
    const customer = await this.db.user.findFirst({ where: { id, role: 'CUSTOMER' } })
    if (!customer) throw new BadRequestException('Customer unavailable.')
    if (customer.verifiedAt) await this.mail.send(customer.email, 'Your InviteIdeas account', 'Sign in from the InviteIdeas home page to access your invitation.')
    else await this.auth.emailToken(customer, 'verify')
    return { ok: true }
  }

  @Post('invitations')
  async createInvitation(@Body() raw: unknown) {
    const { ownerId } = validate(z.object({ ownerId: z.uuid() }), raw)
    const customer = await this.db.user.findFirst({ where: { id: ownerId, role: 'CUSTOMER' } })
    if (!customer) throw new BadRequestException('Customer unavailable.')
    return this.invitations.create(raw, ownerId, 'ADMIN')
  }

  @Post('categories')
  category(@Req() req: AuthRequest, @Body() raw: unknown) {
    const data = validate(z.object({ slug, name: short }), raw)
    return this.db.$transaction([
      this.db.category.upsert({ where: { slug: data.slug }, create: data, update: { name: data.name } }),
      this.db.activityLog.create({ data: audit(req.account.id, 'CATEGORY_SAVED', data.slug) }),
    ])
  }

  @Post('templates')
  createTemplate(@Req() req: AuthRequest, @Body() raw: unknown) {
    const data = validate(z.object({
      slug, name: short, description: note, image: imagePath, style: short, categoryId: slug,
      classification: z.enum(['Basic', 'Standard', 'Premium', 'Luxury']), badge: short.optional(),
      regularPrice: z.number(), offerPrice: z.number(), config: configSchema,
    }), raw)
    validate(priceSchema, data)
    const { config, ...template } = data
    return this.db.$transaction([
      this.db.template.create({ data: { ...template, versions: { create: { number: 1, config } } } }),
      this.db.activityLog.create({ data: audit(req.account.id, 'TEMPLATE_CREATED', template.slug) }),
    ])
  }

  @Patch('templates/:slug')
  updateTemplate(@Req() req: AuthRequest, @Param('slug') id: string, @Body() raw: unknown) {
    const fields = validate(z.object({ regularPrice: z.number(), offerPrice: z.number(), featured: z.boolean(), active: z.boolean() }), raw)
    validate(priceSchema, fields)
    return this.db.$transaction([
      this.db.template.update({ where: { slug: id }, data: fields }),
      this.db.activityLog.create({ data: audit(req.account.id, 'TEMPLATE_UPDATED', id) }),
    ])
  }

  @Get('templates')
  templates() { return this.db.template.findMany({ include: { versions: { orderBy: { number: 'desc' }, take: 1 } } }) }

  @Post('templates/:slug/versions')
  version(@Req() req: AuthRequest, @Param('slug') id: string, @Body() raw: unknown) {
    const config = validate(configSchema, raw)
    return this.db.$transaction(async tx => {
      const latest = await tx.templateVersion.findFirstOrThrow({ where: { templateId: id }, orderBy: { number: 'desc' } })
      const version = await tx.templateVersion.create({ data: { templateId: id, number: latest.number + 1, config } })
      await tx.activityLog.create({ data: audit(req.account.id, 'TEMPLATE_VERSION_CREATED', version.id) })
      return version
    })
  }

  @Post('music')
  music(@Req() req: AuthRequest, @Body() raw: unknown) {
    const data = validate(z.object({ name: short, artist: short, license: short, file: secureUrl }), raw)
    return this.db.$transaction(async tx => {
      const track = await tx.musicTrack.create({ data })
      await tx.activityLog.create({ data: audit(req.account.id, 'MUSIC_ADDED', track.id) })
      return track
    })
  }
}
