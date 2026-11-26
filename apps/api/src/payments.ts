import { BadRequestException, Body, ConflictException, Controller, Headers, Injectable, NotFoundException, Param, Post, Req, ServiceUnavailableException, UseGuards, type RawBodyRequest } from '@nestjs/common'
import type { Request } from 'express'
import { Prisma, type Order } from './generated/client'
import { z } from 'zod'
import { AdminGuard, AuthGuard, type AuthRequest, Mail } from './auth'
import { Db, note, origin, publicSlug, short, validate, verifyMac } from './core'
import { couponCode, couponDiscount } from './coupons'
import { Invitations } from './invitations'

const gatewayId = z.string().regex(/^[A-Za-z0-9_]{1,80}$/)
type GatewayOrder = { id: string; short_url?: string }
type GatewayPayment = { id: string; order_id: string; amount: number; currency: string; status: string }

@Injectable()
export class Payments {
  constructor(private readonly db: Db, private readonly mail: Mail) {}
  async gateway<T>(path: string, payload?: object): Promise<T> {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) throw new ServiceUnavailableException('Razorpay is unavailable.')
    const response = await fetch('https://api.razorpay.com/v1/' + path, {
      method: payload ? 'POST' : 'GET',
      headers: { Authorization: 'Basic ' + Buffer.from(RAZORPAY_KEY_ID + ':' + RAZORPAY_KEY_SECRET).toString('base64'), 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(8000),
    }).catch(() => { throw new ServiceUnavailableException('Razorpay could not be reached.') })
    if (!response.ok) throw new ServiceUnavailableException('Razorpay rejected the request.')
    return response.json() as Promise<T>
  }
  async prepare(id: string, method: Order['method'], promo?: string) {
    return this.db.$transaction(async tx => {
      const invitation = await tx.invitation.findUniqueOrThrow({ where: { id }, include: { order: true, templateVersion: { include: { template: true } } } })
      if (invitation.order) {
        if (invitation.order.method !== method || invitation.order.status !== 'PENDING') throw new ConflictException('An order already exists.')
        if (promo && invitation.order.couponCode !== promo) throw new ConflictException('This order already has a fixed checkout amount.')
        return invitation.order
      }
      const updated = await tx.invitation.updateMany({ where: { id, status: 'DRAFT', events: { some: {} }, finalEventAt: { gt: new Date() } }, data: { status: 'PAYMENT_PENDING' } })
      if (!updated.count) throw new ConflictException('This invitation is no longer available for checkout.')
      const { regularPrice, offerPrice } = invitation.templateVersion.template
      let discount = 0
      if (promo) {
        await tx.$queryRaw`SELECT code FROM coupons WHERE code = ${promo} FOR UPDATE`
        const coupon = await tx.coupon.findUnique({ where: { code: promo } })
        const now = new Date()
        if (!coupon || !coupon.active || coupon.startsAt > now || coupon.endsAt <= now || offerPrice < coupon.minimumOrder) {
          throw new BadRequestException('This coupon is unavailable for your order.')
        }
        const reservations = { couponCode: promo, status: { in: ['PENDING', 'SUCCESS'] as ('PENDING' | 'SUCCESS')[] } }
        const total = coupon.usageLimit === null ? 0 : await tx.order.count({ where: reservations })
        const userTotal = await tx.order.count({ where: { ...reservations, invitation: { ownerId: invitation.ownerId } } })
        if ((coupon.usageLimit !== null && total >= coupon.usageLimit) || userTotal >= coupon.perUserLimit) {
          throw new ConflictException('This coupon has reached its usage limit.')
        }
        discount = couponDiscount(offerPrice, coupon)
        if (!discount) throw new BadRequestException('This coupon does not reduce the current price.')
      }
      return tx.order.create({ data: { invitationId: id, method, source: invitation.source, regularPrice, offerPrice, couponCode: promo, discount, amount: offerPrice - discount } })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted })
  }
  async start(id: string, method: 'ONLINE' | 'LINK', actorId?: string, promo?: string) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw new ServiceUnavailableException('Razorpay is unavailable.')
    const order = await this.prepare(id, method, promo)
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${order.id} FOR UPDATE`
      const current = await tx.order.findUniqueOrThrow({ where: { id: order.id } })
      if (current.status !== 'PENDING') throw new ConflictException('This order is already closed.')
      if (method === 'ONLINE') {
        const gatewayOrderId = current.gatewayOrderId || (await this.gateway<GatewayOrder>('orders', { amount: current.amount, currency: current.currency, receipt: current.id })).id
        if (!current.gatewayOrderId) await tx.order.update({ where: { id: current.id }, data: { gatewayOrderId } })
        return { id: current.id, gatewayOrderId, amount: current.amount, currency: current.currency, key: process.env.RAZORPAY_KEY_ID }
      }
      if (current.paymentLinkUrl) return { url: current.paymentLinkUrl }
      const link = await this.gateway<GatewayOrder>('payment_links', { amount: current.amount, currency: current.currency, reference_id: current.id, accept_partial: false, description: 'InviteIdeas invitation' })
      await tx.order.update({ where: { id: current.id }, data: { paymentLinkId: link.id, paymentLinkUrl: link.short_url } })
      if (actorId) await tx.activityLog.create({ data: { actorId, targetId: current.id, action: 'PAYMENT_LINK_CREATED', detail: { linkId: link.id } } })
      return { url: link.short_url }
    }, { timeout: 12_000 })
  }
  async confirmOnline(order: Order, id: string, link = false) {
    const payment = await this.gateway<GatewayPayment>('payments/' + validate(gatewayId, id))
    if (payment.id !== id || payment.status !== 'captured' || payment.amount !== order.amount || payment.currency !== order.currency || (!link && payment.order_id !== order.gatewayOrderId)) {
      throw new ConflictException('Payment capture could not be confirmed.')
    }
    return this.activate(order, { gatewayPaymentId: id })
  }
  async activate(order: Order, data: Prisma.OrderUpdateManyMutationInput, actorId?: string) {
    const result = await this.db.$transaction(async tx => {
      const changed = await tx.order.updateMany({ where: { id: order.id, status: 'PENDING' }, data: { ...data, status: 'SUCCESS', paidAt: new Date() } })
      const invitation = await tx.invitation.findUniqueOrThrow({ where: { id: order.invitationId }, include: { owner: { select: { email: true } }, order: true } })
      if (!changed.count) {
        if (invitation.order?.status === 'SUCCESS' && invitation.slug && (!data.gatewayPaymentId || invitation.order.gatewayPaymentId === data.gatewayPaymentId)) return { slug: invitation.slug, email: invitation.owner.email, created: false }
        throw new ConflictException('The order is already closed.')
      }
      if (invitation.status !== 'PAYMENT_PENDING') throw new ConflictException('The invitation cannot be activated.')
      const slug = publicSlug(invitation.title, invitation.id)
      await tx.invitation.update({ where: { id: invitation.id }, data: { slug, status: invitation.finalEventAt > new Date() ? 'ACTIVE' : 'LOCKED' } })
      if (actorId) await tx.activityLog.create({ data: { actorId, targetId: order.id, action: 'OFFLINE_PAYMENT_VERIFIED', detail: { reference: String(data.offlineReference), notes: String(data.offlineNotes || '') } } })
      return { slug, email: invitation.owner.email, created: true }
    })
    if (result.created && this.mail.available) {
      await this.mail.send(result.email, 'Your InviteIdeas invitation is live', origin() + '/invite/' + result.slug).catch(() => console.error('Invitation activation email could not be delivered.'))
    }
    return { slug: result.slug }
  }
}

@Controller()
export class PaymentController {
  constructor(private readonly db: Db, private readonly invitations: Invitations, private readonly payments: Payments) {}

  @UseGuards(AuthGuard)
  @Post('invitations/:id/checkout')
  async checkout(@Req() req: AuthRequest, @Param('id') id: string, @Body() body: unknown) {
    await this.invitations.own(id, req.account)
    const input = validate(z.object({ code: couponCode.optional() }), body || {})
    return this.payments.start(id, 'ONLINE', undefined, input.code)
  }

  @UseGuards(AuthGuard)
  @Post('invitations/:id/confirm')
  async confirm(@Req() req: AuthRequest, @Param('id') id: string, @Body() raw: unknown) {
    const input = validate(z.object({ razorpay_payment_id: gatewayId, razorpay_signature: z.string().max(64) }), raw)
    const { order } = await this.invitations.own(id, req.account)
    if (!order?.gatewayOrderId || !verifyMac(process.env.RAZORPAY_KEY_SECRET, order.gatewayOrderId + '|' + input.razorpay_payment_id, input.razorpay_signature)) throw new BadRequestException('Invalid payment signature.')
    return this.payments.confirmOnline(order, input.razorpay_payment_id)
  }

  @Post('payments/webhook')
  async webhook(@Req() req: RawBodyRequest<Request>, @Headers('x-razorpay-signature') signature: string) {
    if (!req.rawBody || !verifyMac(process.env.RAZORPAY_WEBHOOK_SECRET, req.rawBody, signature)) throw new BadRequestException('Invalid webhook signature.')
    const event = req.body
    const payment = event.payload?.payment?.entity
    if (event.event === 'payment.captured' && typeof payment?.order_id === 'string' && typeof payment.id === 'string') {
      const order = await this.db.order.findUnique({ where: { gatewayOrderId: payment.order_id } })
      if (order) await this.payments.confirmOnline(order, payment.id)
    }
    if (event.event === 'payment_link.paid') {
      const link = event.payload?.payment_link?.entity
      if (typeof link?.id !== 'string' || typeof payment?.id !== 'string' || link.status !== 'paid') throw new BadRequestException('Invalid payment link payload.')
      const order = await this.db.order.findUnique({ where: { paymentLinkId: link.id } })
      if (order && link.reference_id === order.id && link.amount_paid === order.amount && link.currency === order.currency) await this.payments.confirmOnline(order, payment.id, true)
    }
    return { ok: true }
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Post('admin/invitations/:id/payment-link')
  async link(@Req() req: AuthRequest, @Param('id') id: string) {
    const invitation = await this.invitations.own(id, req.account)
    if (invitation.source !== 'ADMIN') throw new NotFoundException()
    return this.payments.start(id, 'LINK', req.account.id)
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Post('admin/invitations/:id/offline-payment')
  async offline(@Req() req: AuthRequest, @Param('id') id: string, @Body() raw: unknown) {
    const invitation = await this.invitations.own(id, req.account)
    if (invitation.source !== 'ADMIN') throw new NotFoundException()
    const input = validate(z.object({ type: z.enum(['Cash', 'UPI', 'Bank transfer', 'Other']), reference: short.max(160), notes: note }), raw)
    const order = await this.payments.prepare(id, 'OFFLINE')
    return this.payments.activate(order, { offlineReference: input.type + ': ' + input.reference, offlineNotes: input.notes }, req.account.id)
  }
}
