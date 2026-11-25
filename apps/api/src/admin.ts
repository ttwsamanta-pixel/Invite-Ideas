import { Body, Controller, Get, Post, UseGuards, Req, Param, Patch, Query, BadRequestException } from '@nestjs/common'
import { z } from 'zod'
import { AdminGuard, AuthGuard, AuthService, Mail, type AuthRequest } from './auth'
import { Db, email, note, short, slug, secureUrl, validate, weddingField, weddingLayout, weddingTheme } from './core'
import { Invitations } from './invitations'

const imagePath = z.string().regex(/^\/images\/(?:wedding\/)?[a-z0-9-]+\.webp$/)
const configSchema = z.object({ theme: weddingTheme, layout: weddingLayout.optional(), opening: z.literal('envelope').optional(), fields: z.array(weddingField).max(10).refine(items => new Set(items.map(item => item.key)).size === items.length).optional(), language: z.enum(['en', 'bn', 'hi']).optional(), place: short.optional(), events: z.array(short).min(1).max(20).optional(), names: short, image: imagePath, sections: z.array(z.enum(['events', 'countdown', 'gallery', 'story', 'family', 'rsvp', 'music'])).max(7) })
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
      this.db.user.findMany({ where: { role: 'CUSTOMER' }, orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, name: true, email: true, verifiedAt: true, createdAt: true } }),
      this.db.invitation.findMany({ take: 100, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, source: true, status: true, slug: true, finalEventAt: true, owner: { select: { name: true } } } }),
      this.db.order.findMany({ take: 100, orderBy: { createdAt: 'desc' }, include: { invitation: { select: { title: true, owner: { select: { name: true, email: true } }, templateVersion: { select: { template: { select: { image: true, category: { select: { name: true } } } } } } } } } }),
      this.db.activityLog.findMany({ take: 50, orderBy: { createdAt: 'desc' }, include: { actor: { select: { name: true } } } }),
      this.db.order.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true }, _count: true }),
    ])
    return { users, invitations: invitations.map(invitation => this.invitations.present(invitation)), orders, logs, totals }
  }

  @Get('overview')
  async overview(@Query() query: unknown) {
    const { days } = validate(z.object({ days: z.enum(['7', '30', '90']).default('30') }), query)
    const now = new Date()
    const day = 86_400_000
    const offset = 19_800_000
    const today = Math.floor((now.getTime() + offset) / day) * day - offset
    const start = new Date(today - (Number(days) - 1) * day)
    const end = new Date(today + day)
    const date = { gte: start, lt: end }
    const [customers, states, expired, pending, rsvp, paid, daily] = await Promise.all([
      this.db.user.count({ where: { role: 'CUSTOMER' } }),
      this.db.invitation.groupBy({ by: ['status'], _count: true }),
      this.db.invitation.count({ where: { status: 'ACTIVE', finalEventAt: { lte: now } } }),
      this.db.order.count({ where: { status: 'PENDING' } }),
      this.db.rsvp.count({ where: { createdAt: date } }),
      this.db.order.groupBy({ by: ['method'], where: { status: 'SUCCESS', paidAt: date }, _sum: { amount: true } }),
      this.db.$queryRaw<{ date: string; revenue: bigint; orders: bigint }[]>`
        SELECT DATE_FORMAT(DATE_ADD(paidAt, INTERVAL 330 MINUTE), '%Y-%m-%d') AS date,
          SUM(amount) AS revenue, COUNT(*) AS orders
        FROM orders WHERE status = 'SUCCESS' AND paidAt >= ${start} AND paidAt < ${end}
        GROUP BY date ORDER BY date
      `,
    ])
    const status: Record<string, number> = { ACTIVE: 0, DRAFT: 0, PAYMENT_PENDING: 0, LOCKED: 0, ARCHIVED: 0 }
    for (const row of states) status[row.status] = row._count
    status.ACTIVE -= expired
    status.LOCKED += expired
    const offline = paid.find(row => row.method === 'OFFLINE')?._sum.amount ?? 0
    const revenue = paid.reduce((total, row) => total + (row._sum.amount ?? 0), 0)
    const series = Array.from({ length: Number(days) }, (_, index) => {
      const date = new Date(start.getTime() + offset + index * day).toISOString().slice(0, 10)
      const row = daily.find(entry => entry.date === date)
      return { date, revenue: Number(row?.revenue ?? 0), orders: Number(row?.orders ?? 0) }
    })
    return { customers, status, pending, rsvp, revenue, offline, online: revenue - offline, series }
  }

  @Get('reports')
  report(@Query() raw: unknown) {
    const dates = validate(z.object({ from: z.iso.date().optional(), to: z.iso.date().optional() }), raw)
    if (dates.from && dates.to && dates.from > dates.to) throw new BadRequestException('The start must be on or before the end date.')
    const paidAt = {
      gte: dates.from ? new Date(dates.from + 'T00:00:00+05:30') : undefined,
      lt: dates.to ? new Date(Date.parse(dates.to + 'T00:00:00+05:30') + 86_400_000) : undefined,
    }
    return this.db.order.groupBy({ by: ['source', 'method'], where: { status: 'SUCCESS', paidAt }, _sum: { amount: true }, _count: true })
  }

  @Post('invitations/:id/archive')
  async archive(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.db.$transaction(async tx => {
      const changed = await tx.invitation.updateMany({
        where: { id, status: { in: ['ACTIVE', 'LOCKED'] }, finalEventAt: { lte: new Date() } },
        data: { status: 'ARCHIVED' },
      })
      if (!changed.count) throw new BadRequestException('Only invitations with a completed final event can be archived.')
      await tx.activityLog.create({ data: audit(req.account.id, 'INVITATION_ARCHIVED', id) })
      return { ok: true }
    })
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
