import { BadRequestException, ConflictException } from '@nestjs/common'
export { Db } from './database'
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { resolve } from 'node:path'
import { z } from 'zod'

export const origin = () => process.env.APP_ORIGIN || 'http://localhost:3000'
export const storage = () => resolve(process.env.STORAGE_DIR || '../../storage')
export const token = () => randomBytes(32).toString('hex')
export const digest = (value: string) => createHash('sha256').update(value).digest('hex')
export function verifyMac(secret: string | undefined, message: string | Buffer, signature: unknown) {
  if (!secret || typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false
  return timingSafeEqual(createHmac('sha256', secret).update(message).digest(), Buffer.from(signature, 'hex'))
}
export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data)
  if (!parsed.success) throw new BadRequestException(parsed.error.issues.map(issue => issue.path.join('.') + ': ' + issue.message))
  return parsed.data
}
export const short = z.string().trim().min(1).max(180)
export const email = z.email().max(190).transform(value => value.toLowerCase())
export const password = z.string().min(12).max(128)
export const note = z.string().trim().max(4000).default('')
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(75)
export const secureUrl = z.url({ protocol: /^https$/ }).max(190)
const detailKey = z.string().regex(/^[a-z][a-z0-9-]{0,30}$/)
export const weddingField = z.object({ key: detailKey, label: short, example: z.string().max(500).optional() })
export const weddingLayout = z.enum(['frame', 'split', 'cover'])
export const weddingTheme = z.enum(['ruby', 'rose', 'night', 'marigold', 'teal', 'green', 'midnight', 'sage', 'ochre', 'jade', 'scarlet', 'coastal', 'plum'])
export const weddingDetails = z.record(detailKey, z.string().trim().max(500)).refine(fields => Object.keys(fields).length <= 10)
export function selectWeddingDetails(config: unknown, values: Record<string, string>) {
  const fields = z.object({ fields: z.array(weddingField).max(10) }).safeParse(config)
  return Object.fromEntries((fields.success ? fields.data.fields : []).flatMap(({ key }) => Object.hasOwn(values, key) && values[key] ? [[key, values[key]]] : []))
}

export const invitationBody = z.object({
  title: short, names: short, language: z.enum(['en', 'bn', 'hi']),
  timezone: z.string().max(100).refine(zone => {
    try { new Intl.DateTimeFormat('en', { timeZone: zone }); return true } catch { return false }
  }).default('Asia/Kolkata'),
  story: note, family: note, details: weddingDetails.optional(), rsvpEnabled: z.boolean().default(true), musicId: z.uuid().nullable().default(null),
  events: z.array(z.object({
    name: short, startsAt: z.iso.datetime({ offset: true }).transform(value => new Date(value)),
    venue: short, mapUrl: secureUrl.optional(), description: note,
  })).min(1).max(20),
})
export function finalEvent(events: { startsAt: Date }[]) {
  return new Date(Math.max(...events.map(event => event.startsAt.getTime())))
}
export function assertEditable(invitation: { status: string; finalEventAt: Date }, now = new Date()) {
  if (invitation.finalEventAt <= now || !['DRAFT', 'ACTIVE'].includes(invitation.status)) {
    throw new ConflictException('This invitation is locked or awaiting payment.')
  }
}
export function publicSlug(title: string, id: string) {
  const stem = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').slice(0, 60).replace(/^-|-$/g, '')
  return (stem || 'celebration') + '-' + id.replaceAll('-', '')
}
