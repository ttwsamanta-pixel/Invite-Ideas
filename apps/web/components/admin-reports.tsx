'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../lib/client'
import { money } from '../lib/data'

type Total = { source: string; method: string; _sum: { amount: number | null }; _count: number }
export function AdminReports() {
  const [rows, setRows] = useState<Total[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  async function load(query = '') {
    setBusy(true); setError('')
    try { setRows(await api<Total[]>('/admin/reports' + query)) }
    catch (failure) { setError((failure as Error).message) }
    finally { setBusy(false) }
  }
  useEffect(() => { void load() }, [])
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams()
    for (const [name, value] of new FormData(event.currentTarget)) if (value) params.set(name, String(value))
    void load(params.size ? '?' + params : '')
  }
  const types = { ONLINE: 'Razorpay Checkout', LINK: 'Razorpay Payment Link', OFFLINE: 'Offline' }
  return <section className="panel stack"><h2>Sales report</h2><p>Paid orders grouped by sale source and payment method. Dates use India Standard Time.</p>
    <form className="inline" onSubmit={filter}><label>From<input name="from" type="date" /></label><label>Through<input name="to" type="date" /></label><button className="button small" disabled={busy}>Apply date range</button></form>
    {error && <p className="error" role="alert">{error}</p>}
    {busy ? <p role="status">Loading report…</p> : rows.length ? <div className="table-wrap"><table>
      <thead><tr><th>Source</th><th>Payment method</th><th>Paid orders</th><th>Collected</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.source + row.method}><td>{row.source === 'ADMIN' ? 'Admin-assisted' : 'Self-service'}</td><td>{types[row.method as keyof typeof types]}</td><td>{row._count}</td><td>{money(row._sum.amount || 0)}</td></tr>)}</tbody>
    </table></div> : <p>No paid orders in this period.</p>}
  </section>
}
