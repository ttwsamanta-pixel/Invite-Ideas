import { BadRequestException, Body, ConflictException, Controller, Get, Injectable, NotFoundException, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common'
import type { Request, Response } from 'express'
import { mkdir, writeFile, unlink, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { toFile } from 'qrcode'
import sharp from 'sharp'
import { z } from 'zod'
import { AuthGuard, type Account, type AuthRequest } from './auth'
import { assertEditable, Db, digest, email, finalEvent, invitationBody, note, origin, short, slug, storage, token, validate } from './core'

const include = { events: { orderBy: { startsAt: 'asc' as const } }, templateVersion: { include: { template: true } }, order: true, gallery: true, music: true, _count: { select: { responses: true, views: true } } } as const

@Injectable()
export class Invitations {
  constructor(private readonly db: Db) {}
  async own(id: string, account: Account) {
    const invitation = await this.db.invitation.findFirst({ where: { id, ...(account.role === 'ADMIN' ? {} : { ownerId: account.id }) }, include })
    if (!invitation) throw new NotFoundException()
    return this.present(invitation)
  }
  present<T extends { status: string; finalEventAt: Date }>(invitation: T) {
    return { ...invitation, status: invitation.status === 'ACTIVE' && invitation.finalEventAt <= new Date() ? 'LOCKED' : invitation.status }
  }
  async list(ownerId: string) {
    return (await this.db.invitation.findMany({ where: { ownerId }, take: 100, orderBy: { createdAt: 'desc' }, include })).map(item => this.present(item))
  }
  async create(raw: unknown, ownerId: string, source: 'CUSTOMER' | 'ADMIN') {
    const input = validate(invitationBody.extend({ template: slug }), raw)
    const { template, events, ...fields } = input
    const version = await this.db.templateVersion.findFirst({ where: { templateId: template, template: { active: true } }, orderBy: { number: 'desc' } })
    if (!version) throw new NotFoundException('Template unavailable.')
    const finalEventAt = finalEvent(events)
    if (finalEventAt <= new Date()) throw new BadRequestException('Enter a future final event date and time.')
    await this.checkMusic(fields.musicId)
    return this.db.invitation.create({ data: { ...fields, ownerId, source, templateVersionId: version.id, finalEventAt, previewToken: token(), events: { create: events } }, include })
  }
  async edit(id: string, account: Account, raw: unknown) {
    const current = await this.own(id, account)
    assertEditable(current)
    const { events, ...fields } = validate(invitationBody, raw)
    const finalEventAt = finalEvent(events)
    if (finalEventAt <= new Date()) throw new BadRequestException('Enter a future final event date and time.')
    if (fields.musicId !== current.musicId) await this.checkMusic(fields.musicId)
    return this.db.$transaction(async tx => {
      const result = await tx.invitation.updateMany({
        where: { id, updatedAt: current.updatedAt, status: { in: ['DRAFT', 'ACTIVE'] }, finalEventAt: { gt: new Date() } },
        data: { ...fields, finalEventAt },
      })
      if (!result.count) throw new ConflictException('The invitation changed. Reload and try again.')
      await tx.event.deleteMany({ where: { invitationId: id } })
      await tx.event.createMany({ data: events.map(event => ({ ...event, invitationId: id })) })
      return tx.invitation.findUniqueOrThrow({ where: { id }, include })
    })
  }
  async checkMusic(id: string | null) {
    if (id && !(await this.db.musicTrack.findFirst({ where: { id, active: true } }))) throw new BadRequestException('This track is unavailable.')
  }
  async eventPage(slug: string) {
    const invitation = await this.db.invitation.findFirst({ where: { slug, status: { in: ['ACTIVE', 'LOCKED'] } }, include })
    if (!invitation) throw new NotFoundException()
    return invitation
  }
  publicFields(invitation: Awaited<ReturnType<Invitations['eventPage']>>) {
    const { title, names, language, timezone, story, family, rsvpEnabled, finalEventAt, events, gallery, music, templateVersion } = invitation
    return { id: invitation.slug ? invitation.slug : invitation.id, title, names, language, timezone, story, family, rsvpEnabled, finalEventAt, events, gallery: gallery.map(asset => ({ id: asset.id, url: '/api/public/media/' + asset.id })), music: music ? { name: music.name, file: music.file } : null, config: templateVersion.config }
  }
}
@Controller()
export class InvitationsController {
  constructor(private readonly db: Db, private readonly invitations: Invitations) {}
  @Get('health')
  health() { return { ok: true } }

  @Get('templates')
  async templates() {
    return this.db.template.findMany({ where: { active: true, versions: { some: {} } }, include: { category: true, versions: { orderBy: { number: 'desc' }, take: 1 } }, orderBy: [{ featured: 'desc' }, { name: 'asc' }] })
  }
  @Get('categories')
  categories() { return this.db.category.findMany({ orderBy: { name: 'asc' } }) }

  @Get('music')
  music() { return this.db.musicTrack.findMany({ where: { active: true }, select: { id: true, name: true, artist: true } }) }

  @UseGuards(AuthGuard)
  @Get('invitations')
  list(@Req() req: AuthRequest) { return this.invitations.list(req.account.id) }

  @UseGuards(AuthGuard)
  @Post('invitations')
  create(@Req() req: AuthRequest, @Body() raw: unknown) { return this.invitations.create(raw, req.account.id, 'CUSTOMER') }

  @UseGuards(AuthGuard)
  @Get('invitations/:id')
  get(@Req() req: AuthRequest, @Param('id') id: string) { return this.invitations.own(id, req.account) }

  @UseGuards(AuthGuard)
  @Patch('invitations/:id')
  edit(@Req() req: AuthRequest, @Param('id') id: string, @Body() raw: unknown) { return this.invitations.edit(id, req.account, raw) }

  @UseGuards(AuthGuard)
  @Get('preview/:token')
  async preview(@Req() req: AuthRequest, @Param('token') previewToken: string) {
    const invitation = await this.db.invitation.findFirst({ where: { previewToken }, select: { id: true } })
    if (!invitation) throw new NotFoundException()
    const own = await this.invitations.own(invitation.id, req.account)
    return { ...this.invitations.publicFields(own as Awaited<ReturnType<Invitations['eventPage']>>), id: own.id, order: own.order, checkoutPrice: own.templateVersion.template.offerPrice }
  }

  @Get('public/invite/:slug')
  async publicPage(@Param('slug') slug: string) { return this.invitations.publicFields(await this.invitations.eventPage(slug)) }

  @Post('public/invite/:slug/view')
  async view(@Param('slug') slug: string) {
    const { id } = await this.invitations.eventPage(slug)
    await this.db.view.create({ data: { invitationId: id } })
    return { ok: true }
  }

  @Post('public/invite/:slug/rsvp')
  async rsvp(@Param('slug') slug: string, @Body() raw: unknown) {
    const invitation = await this.invitations.eventPage(slug)
    if (!invitation.rsvpEnabled || invitation.finalEventAt <= new Date()) throw new ConflictException('RSVP is closed.')
    const data = validate(z.object({ name: short, email, attending: z.boolean(), party: z.number().int().min(1).max(12), message: note }), raw)
    await this.db.rsvp.create({ data: { ...data, party: data.attending ? data.party : 0, invitationId: invitation.id } }).catch(error => {
      if (error.code === 'P2002') throw new ConflictException('A response already exists for this address.')
      throw error
    })
    return { ok: true }
  }

  @UseGuards(AuthGuard)
  @Get('invitations/:id/guests')
  async guests(@Req() req: AuthRequest, @Param('id') id: string) {
    await this.invitations.own(id, req.account)
    const [guests, responses] = await Promise.all([
      this.db.guest.findMany({ where: { invitationId: id }, take: 500, orderBy: { name: 'asc' } }),
      this.db.rsvp.findMany({ where: { invitationId: id }, take: 500, orderBy: { createdAt: 'desc' } }),
    ])
    return { guests, responses }
  }

  @UseGuards(AuthGuard)
  @Post('invitations/:id/guests')
  async addGuest(@Req() req: AuthRequest, @Param('id') id: string, @Body() raw: unknown) {
    await this.invitations.own(id, req.account)
    const data = validate(z.object({ name: short, email }), raw)
    return this.db.guest.upsert({ where: { invitationId_email: { invitationId: id, email: data.email } }, create: { ...data, invitationId: id }, update: { name: data.name } })
  }

  @UseGuards(AuthGuard)
  @Get('invitations/:id/qr')
  async qr(@Req() req: AuthRequest, @Param('id') id: string, @Res() res: Response) {
    const invitation = await this.invitations.own(id, req.account)
    if (!invitation.slug || invitation.order?.status !== 'SUCCESS' || !['ACTIVE', 'LOCKED'].includes(invitation.status)) throw new NotFoundException()
    const directory = join(storage(), 'qr')
    await mkdir(directory, { recursive: true })
    const filename = join(directory, invitation.id + '.png')
    if (!(await stat(filename).catch(() => null))) await toFile(filename, origin() + '/invite/' + invitation.slug, { width: 512, margin: 2 })
    res.download(filename, invitation.slug + '.png')
  }

  @UseGuards(AuthGuard)
  @Post('invitations/:id/gallery')
  async upload(@Req() req: AuthRequest, @Param('id') id: string, @Body() raw: unknown) {
    const current = await this.invitations.own(id, req.account)
    assertEditable(current)
    if (current.gallery.length >= 20) throw new ConflictException('The gallery supports up to 20 photos.')
    const input = validate(z.object({ data: z.string().max(7_000_000).regex(/^[A-Za-z0-9+/]+={0,2}$/), type: z.enum(['image/jpeg', 'image/png', 'image/webp']) }), raw)
    const buffer = Buffer.from(input.data, 'base64')
    if (buffer.length > 5_000_000) throw new BadRequestException('Choose an image smaller than 5 MB.')
    const image = sharp(buffer, { limitInputPixels: 25_000_000 })
    const metadata = await image.metadata().catch(() => null)
    if (!metadata || 'image/' + metadata.format !== input.type || !metadata.width || !metadata.height || (metadata.pages || 1) > 1) throw new BadRequestException('Choose a valid JPEG, PNG or WebP image.')
    const { data, info } = await image.rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true }).catch(() => { throw new BadRequestException('The image could not be decoded.') })
    const directory = join(storage(), 'gallery')
    const file = token() + '.webp'
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, file), data, { flag: 'wx' })
    return this.db.$transaction(async tx => {
      const changed = await tx.invitation.updateMany({ where: { id, updatedAt: current.updatedAt, finalEventAt: { gt: new Date() }, status: { in: ['DRAFT', 'ACTIVE'] } }, data: { updatedAt: new Date() } })
      if (!changed.count) throw new ConflictException('Reload the invitation before uploading.')
      return tx.mediaAsset.create({ data: { invitationId: id, file, width: info.width, height: info.height }, select: { id: true, width: true, height: true } })
    }).catch(async error => { await unlink(join(directory, file)).catch(() => undefined); throw error })
  }

  @Get('public/media/:id')
  async publicMedia(@Req() req: Request, @Param('id') id: string, @Res() res: Response) {
    const asset = await this.db.mediaAsset.findUnique({ where: { id }, include: { invitation: { select: { status: true, ownerId: true } } } })
    if (!asset) throw new NotFoundException()
    if (!['ACTIVE', 'LOCKED'].includes(asset.invitation.status)) {
      const session = req.cookies.refresh && await this.db.session.findUnique({ where: { hash: digest(req.cookies.refresh) }, include: { user: true } })
      if (!session || session.expires <= new Date() || (session.userId !== asset.invitation.ownerId && session.user.role !== 'ADMIN')) throw new NotFoundException()
    }
    res.setHeader('Cache-Control', 'private, no-store')
    res.type('webp').sendFile(join(storage(), 'gallery', asset.file))
  }
}
