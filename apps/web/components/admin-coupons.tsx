'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../lib/client'

const defaultCoupon = { code: '', type: 'PERCENT', value: 10, minimumOrder: 0, maximumDiscount: null as number | null,
  startsAt: '', endsAt: '', usageLimit: null as number | null, perUserLimit: 1, active: true }
type Coupon = typeof defaultCoupon
export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [value, setValue] = useState(JSON.stringify(defaultCoupon, null, 2))
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { api<Coupon[]>('/admin/coupons').then(setCoupons).catch(failure => setError(failure.message)) }, [])
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(''); setMessage(''); setBusy(true)
    try {
      await api('/admin/coupons', 'POST', JSON.parse(value))
      setCoupons(await api<Coupon[]>('/admin/coupons'))
      setMessage('Coupon saved.')
    } catch (failure) { setError((failure as Error).message) } finally { setBusy(false) }
  }
  return <section className="panel stack"><h2>Coupons</h2>
    <p>Fixed amounts and spending thresholds use paise. Use ISO timestamps with a timezone offset for start and end times.</p>
    {error && <p className="error" role="alert">{error}</p>}{message && <p className="success" role="status">{message}</p>}
    <div className="inline">{coupons.map(coupon => <button className="button outline small" key={coupon.code} onClick={() => setValue(JSON.stringify(coupon, null, 2))}>{coupon.code}</button>)}
      <button className="button outline small" onClick={() => setValue(JSON.stringify(defaultCoupon, null, 2))}>New coupon</button></div>
    <form className="stack" onSubmit={save}><label>Coupon configuration (JSON)<textarea rows={10} value={value} onChange={e => setValue(e.target.value)} required /></label>
      <button className="button small" disabled={busy}>Save coupon</button></form>
  </section>
}
