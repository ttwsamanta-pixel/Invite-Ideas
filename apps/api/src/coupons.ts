import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { z } from 'zod'
import { AdminGuard, AuthGuard, type AuthRequest } from './auth'
import { Db, validate } from './core'

export const couponCode = z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,32}$/)
const paise = z.number().int().nonnegative().max(10_000_000)
const couponDetails = z.object({
  code: couponCode,
  type: z.enum(['FIXED', 'PERCENT']),
  value: z.number().int().positive().max(10_000_000),
  minimumOrder: paise,
  maximumDiscount: paise.positive().nullable(),
  startsAt: z.iso.datetime({ offset: true }).transform(value => new Date(value)),
  endsAt: z.iso.datetime({ offset: true }).transform(value => new Date(value)),
  usageLimit: z.number().int().positive().max(100_000).nullable(),
  perUserLimit: z.number().int().positive().max(1000),
  active: z.boolean(),
}).refine(input => input.endsAt > input.startsAt, 'The end time must follow the start time.')
  .refine(input => input.type !== 'PERCENT' || input.value <= 100, 'A percentage cannot exceed 100.')

export function couponDiscount(amount: number, coupon: { type: string; value: number; maximumDiscount: number | null }) {
  const discount = coupon.type === 'PERCENT' ? Math.floor(amount * coupon.value / 100) : coupon.value
  return Math.min(discount, coupon.maximumDiscount ?? amount, Math.max(0, amount - 100))
}

@Controller('admin/coupons')
@UseGuards(AuthGuard, AdminGuard)
export class CouponController {
  constructor(private readonly db: Db) {}

  @Get()
  list() { return this.db.coupon.findMany({ take: 100, orderBy: { startsAt: 'desc' } }) }

  @Post()
  save(@Body() raw: unknown, @Req() req: AuthRequest) {
    const data = validate(couponDetails, raw)
    return this.db.$transaction([
      this.db.coupon.upsert({ where: { code: data.code }, create: data, update: data }),
      this.db.activityLog.create({ data: { actorId: req.account.id, action: 'COUPON_SAVED', targetId: data.code, detail: { active: data.active } } }),
    ])
  }
}
