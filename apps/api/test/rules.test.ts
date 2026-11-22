import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import { couponDiscount } from '../src/coupons'
import { assertEditable, finalEvent, invitationBody, publicSlug, verifyMac } from '../src/core'

test('the final event is calculated by instant across timezone offsets', () => {
  const parsed = invitationBody.parse({
    title: 'Wedding', names: 'Arindam & Moupia', language: 'bn',
    events: [
      { name: 'Reception', startsAt: '2027-12-16T18:30:00+05:30', venue: 'Kolkata' },
      { name: 'Wedding', startsAt: '2027-12-15T19:00:00+05:30', venue: 'Kolkata' },
    ],
  })
  assert.equal(finalEvent(parsed.events).toISOString(), '2027-12-16T13:00:00.000Z')
})

test('editing stops at the exact final event time', () => {
  const finalEventAt = new Date('2027-12-16T13:00:00.000Z')
  assert.doesNotThrow(() => assertEditable({ status: 'ACTIVE', finalEventAt }, new Date(finalEventAt.getTime() - 1)))
  assert.throws(() => assertEditable({ status: 'ACTIVE', finalEventAt }, finalEventAt))
  assert.throws(() => assertEditable({ status: 'ARCHIVED', finalEventAt }, new Date(0)))
})

test('payment verification checks both the signature and the exact body', () => {
  const body = Buffer.from('{"event":"payment.captured"}')
  const secret = 'razorpay-test-secret'
  const signature = createHmac('sha256', secret).update(body).digest('hex')
  assert.equal(verifyMac(secret, body, signature), true)
  assert.equal(verifyMac(secret, Buffer.concat([body, Buffer.from(' ')]), signature), false)
  assert.equal(verifyMac(undefined, body, signature), false)
  assert.equal(verifyMac(secret, body, 'invalid'), false)
})

test('public links work for Unicode titles and stay collision resistant', () => {
  assert.match(publicSlug('শুভ বিবাহ', '04c6e004-fdec-49d4-9117-58eb73410d38'), /^celebration-[a-f0-9]{32}$/)
  assert.notEqual(publicSlug('Wedding', '123'), publicSlug('Wedding', '124'))
})

test('map links accept HTTPS and reject script URLs', () => {
  const input = { title: 'Wedding', names: 'Couple', language: 'hi', events: [{ name: 'Wedding', startsAt: '2027-12-16T18:30:00+05:30', venue: 'Kolkata', mapUrl: 'javascript:alert(1)' }] }
  assert.equal(invitationBody.safeParse(input).success, false)
  input.events[0].mapUrl = 'https://maps.google.com/'
  assert.equal(invitationBody.safeParse(input).success, true)
})

test('coupon discounts respect maximum discounts and minimum payable amounts', () => {
  assert.equal(couponDiscount(149900, { type: 'PERCENT', value: 10, maximumDiscount: null }), 14990)
  assert.equal(couponDiscount(149900, { type: 'PERCENT', value: 10, maximumDiscount: 10000 }), 10000)
  assert.equal(couponDiscount(79900, { type: 'FIXED', value: 100000, maximumDiscount: null }), 79800)
})