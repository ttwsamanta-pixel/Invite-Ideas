'use client'
import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../lib/client'
import { money, type Template } from '../lib/data'

type Customer = { id: string; name: string; email: string; verifiedAt?: string }
type AdminData = {
  users: Customer[]
  invitations: { id: string; title: string; status: string; source: string; slug?: string; owner: { name: string } }[]
  orders: { id: string; invitation: { title: string }; amount: number; status: string; method: string; paymentLinkUrl?: string }[]
  logs: { id: string; action: string; createdAt: string; actor: { name: string } }[]
  totals: { _sum: { amount: number | null }; _count: number }
}
export function Admin() {
  const [data, setData] = useState<AdminData>()
  const [templates, setTemplates] = useState<Template[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    Promise.all([api<AdminData>('/admin'), api<Template[]>('/admin/templates')]).then(([items, designs]) => { setData(items); setTemplates(designs) }).catch(failure => setError(failure.message))
  }, [])
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true); setError(''); setMessage('')
    try {
      await action()
      const [items, designs] = await Promise.all([api<AdminData>('/admin'), api<Template[]>('/admin/templates')])
      setData(items); setTemplates(designs); setMessage(success)
    } catch (failure) { setError((failure as Error).message) } finally { setBusy(false) }
  }
  function form(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    return new FormData(event.currentTarget)
  }
  return <section className="wrap content stack"><div className="inline"><h1>Admin</h1><Link href="/dashboard" className="button outline">My Invitations</Link></div>
    {error && <p role="alert" className="error">{error}</p>}{message && <p role="status" className="success">{message}</p>}
    {!data && !error && <p role="status">Loading admin panel…</p>}
    {data && <>
      <section className="panel stack"><h2>Overview</h2><p>{data.totals._count} paid orders · {money(data.totals._sum.amount || 0)} collected</p></section>
      <section className="panel stack"><h2>Customers</h2>
        <form className="inline" onSubmit={event => { const fields = form(event); void run(() => api('/admin/customers', 'POST', Object.fromEntries(fields)), 'Customer saved.') }}>
          <label>Full name<input required name="name" /></label><label>Email address<input required name="email" type="email" /></label><button className="button small" disabled={busy}>Save customer</button>
        </form>
        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead><tbody>{data.users.map(customer => <tr key={customer.id}><td>{customer.name}</td><td>{customer.email}</td><td className="inline">
          <Link className="button outline small" href={'/editor/new?owner=' + customer.id}>Create invitation</Link>
          <button className="button outline small" disabled={busy} onClick={() => run(() => api('/admin/customers/' + customer.id + '/activation', 'POST'), 'Account email sent.')}>{customer.verifiedAt ? 'Send sign-in email' : 'Send activation email'}</button>
        </td></tr>)}</tbody></table></div>
      </section>
      <section className="panel stack"><h2>Invitations and payments</h2>
        {data.invitations.map(item => <div className="stack" key={item.id}><div className="inline"><strong>{item.title}</strong><span>{item.owner.name} · {item.status}</span>{item.slug && <Link href={'/invite/' + item.slug}>Public invitation</Link>}
          {['DRAFT', 'ACTIVE', 'PAYMENT_PENDING'].includes(item.status) && <Link className="button outline small" href={'/editor/new?edit=' + item.id}>Edit</Link>}
          {item.source === 'ADMIN' && ['DRAFT', 'PAYMENT_PENDING'].includes(item.status) && <button className="button outline small" disabled={busy} onClick={() => run(() => api('/admin/invitations/' + item.id + '/payment-link', 'POST'), 'Payment link is available under Orders.')}>Create payment link</button>}</div>
          {item.source === 'ADMIN' && item.status === 'DRAFT' && <details><summary>Record a verified offline payment</summary>
            <form className="inline" onSubmit={event => { const fields = form(event); void run(() => api('/admin/invitations/' + item.id + '/offline-payment', 'POST', Object.fromEntries(fields)), 'Offline payment recorded and invitation activated.') }}>
              <label>Method<select name="type">{['Cash', 'UPI', 'Bank transfer', 'Other'].map(type => <option key={type}>{type}</option>)}</select></label>
              <label>Reference<input name="reference" required maxLength={150} /></label><label>Notes<input name="notes" /></label><button className="button small" disabled={busy}>Verify payment</button>
            </form></details>}
        </div>)}
        <h3>Orders</h3>
        <div className="table-wrap"><table><thead><tr><th>Invitation</th><th>Amount</th><th>Status</th><th>Method</th></tr></thead><tbody>{data.orders.map(item => <tr key={item.id}>
          <td>{item.invitation.title}</td><td>{money(item.amount)}</td><td>{item.status}</td><td>{item.method} {item.paymentLinkUrl && <a href={item.paymentLinkUrl} target="_blank" rel="noreferrer">Open payment link</a>}</td>
        </tr>)}</tbody></table></div>
      </section>
      <section className="panel stack"><h2>Catalog</h2>
        <form className="inline" onSubmit={event => { const fields = form(event); void run(() => api('/admin/categories', 'POST', Object.fromEntries(fields)), 'Category saved.') }}>
          <label>Category slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label><label>Category name<input name="name" required /></label><button className="button small" disabled={busy}>Save category</button>
        </form>
        {templates.map(template => <details key={template.slug}><summary>{template.name} · {money(template.offerPrice)}</summary>
          <form className="inline" onSubmit={event => { const fields = form(event); void run(() => api('/admin/templates/' + template.slug, 'PATCH', {
            regularPrice: Math.round(Number(fields.get('regular')) * 100), offerPrice: Math.round(Number(fields.get('offer')) * 100), featured: fields.get('featured') === 'on', active: fields.get('active') === 'on',
          }), 'Template updated.') }}>
            <label>Regular price (₹)<input name="regular" type="number" min="1" step="0.01" defaultValue={template.regularPrice / 100} required /></label><label>Offer price (₹)<input name="offer" type="number" min="1" step="0.01" defaultValue={template.offerPrice / 100} required /></label>
            <label className="checkbox"><input type="checkbox" name="featured" defaultChecked={template.featured} /> Featured</label><label className="checkbox"><input type="checkbox" name="active" defaultChecked={template.active} /> Active</label><button className="button small" disabled={busy}>Save pricing</button>
          </form>
          <form className="stack" onSubmit={event => { const fields = form(event); void run(() => api('/admin/templates/' + template.slug + '/versions', 'POST', JSON.parse(String(fields.get('config')))), 'New template version published.') }}>
            <label>Version configuration (JSON)<textarea name="config" required defaultValue={JSON.stringify(template.versions[0]?.config, null, 2)} /></label><button className="button small" disabled={busy}>Publish new version</button>
          </form>
        </details>)}
        <details><summary>Create a new template</summary><form className="stack" onSubmit={event => {
          const fields = form(event)
          void run(() => api('/admin/templates', 'POST', JSON.parse(String(fields.get('template')))), 'Template created.')
        }}>
          <label>Template definition (JSON)<textarea name="template" required defaultValue={JSON.stringify({
            slug: 'new-design', name: 'New design', description: '', image: '/images/bengali.webp', style: 'Traditional', categoryId: 'bengali-wedding', classification: 'Standard', regularPrice: 149900, offerPrice: 129900,
            config: { theme: 'ruby', names: 'Sample Names', image: '/images/bengali.webp', sections: ['events', 'countdown', 'rsvp'] },
          }, null, 2)} /></label><button className="button small" disabled={busy}>Create template</button></form></details>
      </section>
      <section className="panel stack"><h2>Music library</h2><form className="inline" onSubmit={event => { const fields = form(event); void run(() => api('/admin/music', 'POST', Object.fromEntries(fields)), 'Licensed track added.') }}>
        <label>Track name<input name="name" required /></label><label>Artist<input name="artist" required /></label><label>License reference<input name="license" required /></label><label>HTTPS audio URL<input name="file" type="url" required /></label><button className="button small" disabled={busy}>Add track</button>
      </form></section>
      <section className="panel stack"><h2>Recent activity</h2>{data.logs.map(log => <p key={log.id}>{new Date(log.createdAt).toLocaleString('en-IN')} · {log.actor.name} · {log.action.replaceAll('_', ' ').toLowerCase()}</p>)}</section>
    </>}
  </section>
}
