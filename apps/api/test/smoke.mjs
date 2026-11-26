import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const origin = process.env.SMOKE_ORIGIN || 'http://localhost:3000'
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
assert(email && password, 'Set ADMIN_EMAIL and ADMIN_PASSWORD for a disposable seeded database.')
let cookies = ''
async function request(path, method = 'GET', data, expected = 200, authenticated = true) {
  const response = await fetch(origin + '/api' + path, {
    method,
    headers: { Origin: origin, ...(authenticated && cookies ? { Cookie: cookies } : {}), ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: data === undefined ? undefined : JSON.stringify(data),
  })
  assert.equal(response.status, expected, path + ': ' + (response.status === expected ? '' : await response.text()))
  const setCookies = response.headers.getSetCookie()
  if (setCookies.length && authenticated) cookies = setCookies.map(value => value.split(';')[0]).join('; ')
  return response.headers.get('content-type')?.includes('application/json') ? response.json() : response
}
const suffix = randomUUID().slice(0, 8)
assert((await request('/templates')).some(item => item.slug === 'bengali-traditions'))
await request('/auth/login', 'POST', { email, password }, 201)
const account = await request('/auth/me')
assert.equal(account.role, 'ADMIN')
await request('/auth/refresh', 'POST', undefined, 201)
const customer = await request('/admin/customers', 'POST', { name: 'Smoke Customer', email: 'smoke-' + suffix + '@example.test' }, 201)
const payload = {
  title: 'Bengali Wedding ' + suffix, names: 'অরিন্দম ও মৌপিয়া', template: 'bengali-traditions', language: 'bn',
  events: [{ name: 'বিবাহ', startsAt: new Date(Date.now() + 86_400_000).toISOString(), venue: 'Kolkata' }],
}
const draft = await request('/invitations', 'POST', payload, 201)
assert.equal(draft.ownerId, account.id)
assert.equal(draft.slug, null)
await request('/invitations/' + draft.id + '/qr', 'GET', undefined, 404)
await request('/preview/' + draft.previewToken, 'GET', undefined, 401, false)
assert.equal((await request('/preview/' + draft.previewToken)).names, payload.names)
const draftPhoto = await request('/invitations/' + draft.id + '/gallery', 'POST', {
  type: 'image/webp',
  data: (await readFile(new URL('../../web/public/images/bengali.webp', import.meta.url))).toString('base64'),
}, 201)
await request('/public/media/' + draftPhoto.id, 'GET', undefined, 404, false)
assert((await request('/public/media/' + draftPhoto.id)).headers.get('content-type')?.includes('image/webp'))

const assisted = await request('/admin/invitations', 'POST', { ...payload, ownerId: customer.id }, 201)
assert.equal(assisted.ownerId, customer.id)
await request('/payments/webhook', 'POST', { event: 'payment.captured' }, 400, false)
const { slug } = await request('/admin/invitations/' + assisted.id + '/offline-payment', 'POST', { type: 'UPI', reference: 'smoke-' + suffix }, 201)
assert.equal((await request('/public/invite/' + slug, 'GET', undefined, 200, false)).names, payload.names)
const qr = await request('/invitations/' + assisted.id + '/qr')
assert(qr.headers.get('content-type')?.includes('image/png'))
const qrBytes = new Uint8Array(await qr.arrayBuffer())
assert.deepEqual(Array.from(qrBytes.slice(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10])
await request('/public/invite/' + slug + '/view', 'POST', undefined, 201, false)
await request('/public/invite/' + slug + '/rsvp', 'POST', { name: 'Guest', email: 'guest@example.test', attending: true, party: 2 }, 201, false)
const active = await request('/invitations/' + assisted.id)
assert.equal(active.order.status, 'SUCCESS')
assert.equal(active._count.views, 1)
assert.equal(active._count.responses, 1)
assert((await request('/admin')).logs.some(entry => entry.action === 'OFFLINE_PAYMENT_VERIFIED' && entry.targetId === active.order.id))
const imported = await request('/invitations/' + assisted.id + '/guests/import', 'POST', [
  { name: 'Guest', email: 'guest@example.test' }, { name: 'Guest', email: 'guest@example.test' },
], 201)
assert.equal(imported.added, 1)
assert((await request('/admin/reports')).some(row => row.source === 'ADMIN' && row.method === 'OFFLINE' && row._count >= 1))
await request('/admin/invitations/' + assisted.id + '/archive', 'POST', undefined, 400)
const article = { slug: 'smoke-' + suffix, category: 'Wedding', title: 'Smoke test article', description: 'A temporary test article.', body: 'An article for a disposable environment.', published: false }
await request('/admin/blog', 'POST', article, 201)
assert(!(await request('/blog', 'GET', undefined, 200, false)).some(post => post.slug === article.slug))
await request('/admin/blog', 'POST', { ...article, published: true }, 201)
assert.equal((await request('/blog/' + article.slug, 'GET', undefined, 200, false)).body, article.body)
await request('/admin/blog', 'POST', article, 201)
if (process.env.DATABASE_URL) {
  const { Db } = (await import('../dist/database.js')).default
  const { Mail } = (await import('../dist/auth.js')).default
  const { Payments } = (await import('../dist/payments.js')).default
  const batchPayload = { ...payload, title: 'Batch Royal ' + suffix, names: 'Riya & Ajay', details: { 'groom-name': 'Ajay', 'bride-name': 'Riya' } }
  const requestId = randomUUID()
  const batchDraft = await request('/invitations/drafts', 'POST', { template: 'royal-indian-wedding', requestId }, 201)
  assert.equal(batchDraft.slug, null)
  assert.equal(batchDraft.events.length, 0)
  assert.equal((await request('/invitations/drafts', 'POST', { template: 'royal-indian-wedding', requestId }, 201)).id, batchDraft.id)
  const bengaliBatch = await request('/admin/invitations', 'POST', { ...payload, template: 'bengali-heritage-wedding', ownerId: customer.id }, 201)
  await request('/invitations/' + batchDraft.id, 'PATCH', batchPayload)
  const royalPreview = await request('/preview/' + batchDraft.previewToken)
  assert.equal(royalPreview.templateId, 'royal-indian-wedding')
  assert.equal(royalPreview.config.componentKey, 'RoyalIndianWedding')
  assert.equal(royalPreview.details['groom-name'], 'Ajay')
  const bengaliPreview = await request('/preview/' + bengaliBatch.previewToken)
  assert.equal(bengaliPreview.config.componentKey, 'BengaliHeritageWedding')
  assert.equal(bengaliPreview.names, payload.names)
  const bengaliPublic = await request('/admin/invitations/' + bengaliBatch.id + '/offline-payment', 'POST', { type: 'UPI', reference: 'batch-' + suffix }, 201)
  const publicBengali = await fetch(origin + '/invite/' + bengaliPublic.slug)
  assert.equal(publicBengali.status, 200)
  assert.match(await publicBengali.text(), /class="invite bengali"/)
  const db = new Db()
  try {
    const code = 'TEST-' + suffix.toUpperCase()
    await request('/admin/coupons', 'POST', {
      code, type: 'PERCENT', value: 10, minimumOrder: 0, maximumDiscount: 10000, active: true,
      startsAt: new Date(Date.now() - 60_000).toISOString(), endsAt: new Date(Date.now() + 60_000).toISOString(), usageLimit: 1, perUserLimit: 1,
    }, 201)
    const nextDraft = await request('/invitations', 'POST', payload, 201)
    const payments = new Payments(db, new Mail())
    const royalOrder = await payments.prepare(batchDraft.id, 'ONLINE')
    assert.equal(royalOrder.amount, 99900)
    const batchGatewayOrder = await db.order.update({ where: { id: royalOrder.id }, data: { gatewayOrderId: 'order_batch' + suffix } })
    const batchPaymentId = 'pay_batch' + suffix
    payments.gateway = async () => ({ id: batchPaymentId, status: 'captured', order_id: batchGatewayOrder.gatewayOrderId, amount: royalOrder.amount, currency: 'INR' })
    const batchPublished = await payments.confirmOnline(batchGatewayOrder, batchPaymentId)
    const publicRoyal = await fetch(origin + '/invite/' + batchPublished.slug)
    assert.equal(publicRoyal.status, 200)
    assert.match(await publicRoyal.text(), /class="invite royal"/)
    assert.equal((await request('/public/invite/' + batchPublished.slug, 'GET', undefined, 200, false)).templateVersionNumber, 1)

    const attempts = await Promise.allSettled([payments.prepare(draft.id, 'ONLINE', code), payments.prepare(nextDraft.id, 'ONLINE', code)])
    const claims = attempts.filter(result => result.status === 'fulfilled')
    assert.equal(claims.length, 1)
    const order = claims[0].value
    assert.equal(order.discount, 10000)
    assert.equal(order.amount, order.offerPrice - order.discount)
    const gatewayOrderId = 'order_test' + suffix
    const gatewayPaymentId = 'pay_test' + suffix
    const gatewayOrder = await db.order.update({ where: { id: order.id }, data: { gatewayOrderId } })
    payments.gateway = async () => ({ id: gatewayPaymentId, status: 'authorized', order_id: gatewayOrderId, amount: order.amount, currency: 'INR' })
    await assert.rejects(payments.confirmOnline(gatewayOrder, gatewayPaymentId))
    payments.gateway = async () => ({ id: gatewayPaymentId, status: 'captured', order_id: gatewayOrderId, amount: order.amount, currency: 'INR' })
    const published = await payments.confirmOnline(gatewayOrder, gatewayPaymentId)
    assert.deepEqual(await payments.confirmOnline(gatewayOrder, gatewayPaymentId), published)

    await db.invitation.update({ where: { id: assisted.id }, data: { finalEventAt: new Date(Date.now() - 1000) } })
    await request('/invitations/' + assisted.id, 'PATCH', payload, 409)
    await request('/admin/invitations/' + assisted.id + '/archive', 'POST', undefined, 201)
    assert.equal((await request('/invitations/' + assisted.id)).status, 'ARCHIVED')
    await request('/public/invite/' + slug, 'GET', undefined, 200, false)
  } finally { await db.$disconnect() }
}
await request('/auth/logout', 'POST', undefined, 201)
await request('/auth/me', 'GET', undefined, 401)
console.log('MySQL workflow passed: catalog, authentication, drafts, private media, offline activation, QR, RSVP, guest import, reports, blog and audit logs.')
