'use client'
import Link from 'next/link'
import { AdminContent } from './admin-content'
import { AdminCoupons } from './admin-coupons'
import { AdminReports } from './admin-reports'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api, HttpError } from '../lib/client'
import { AdminOverview, AdminWorkspace, OrderTable, type AdminData, type Section } from './admin-workspace'
import { money, type Template } from '../lib/data'

export function Admin() {
  const router = useRouter()
  const [section, setSection] = useState<Section>('Dashboard')
  const [account, setAccount] = useState<{ name: string; email: string }>()
  function select(next: Section) {
    setSection(next)
    setMessage('')
    window.scrollTo({ top: 0 })
  }
  const [data, setData] = useState<AdminData>()
  const [templates, setTemplates] = useState<Template[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    Promise.all([api<AdminData>('/admin'), api<Template[]>('/admin/templates'), api<{ name: string; email: string }>('/auth/me')])
      .then(([items, designs, profile]) => {
        if (active) { setData(items); setTemplates(designs); setAccount(profile) }
      })
      .catch(failure => {
        if (!active) return
        if (failure instanceof HttpError && failure.status === 401) router.replace('/login')
        else setError(failure instanceof HttpError && failure.status === 403 ? 'This workspace requires an admin account.' : failure.message)
      })
    return () => { active = false }
  }, [router])
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
  return <AdminWorkspace section={section} select={select} data={data} templates={templates} account={account}>
    {section !== 'Dashboard' && <div className="aw-heading"><h1>{section}</h1></div>}
    {error && <p role="alert" className="error">{error}</p>}{message && <p role="status" className="success">{message}</p>}
    {!data && !error && <p role="status">Loading admin panel…</p>}
    {data && <>
      {section === 'Dashboard' && <AdminOverview name={account?.name} data={data} select={select} />}
      {section === 'Reports' && <AdminReports />}
      <div className="aw-module">
      {section === 'Customers' && <section className="panel stack"><h2>Customers</h2>
        <form id="aw-add-customer" className="inline" onSubmit={event => { const fields = form(event); void run(() => api('/admin/customers', 'POST', Object.fromEntries(fields)), 'Customer saved.') }}>
          <label>Full name<input required name="name" /></label><label>Email address<input required name="email" type="email" /></label><button className="button small" disabled={busy}>Save customer</button>
        </form>
        <div className="table-wrap" id="aw-customer-list"><table><thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead><tbody>{data.users.map(customer => <tr key={customer.id} id={'aw-item-' + customer.id}><td>{customer.name}</td><td>{customer.email}</td><td className="inline">
          <Link className="button outline small" href={'/editor/new?owner=' + customer.id}>Create invitation</Link>
          <button className="button outline small" disabled={busy} onClick={() => run(() => api('/admin/customers/' + customer.id + '/activation', 'POST'), 'Account email sent.')}>{customer.verifiedAt ? 'Send sign-in email' : 'Send activation email'}</button>
        </td></tr>)}</tbody></table></div>
      </section>}
      {(section === 'Invitations' || section === 'Payments' || section === 'Payment Links') && <section className="panel stack"><h2>{section === 'Invitations' ? 'Invitation records' : section === 'Payment Links' ? 'Admin-assisted invitations' : 'Manage payments'}</h2>
        {section === 'Payment Links' && <p>Choose an admin-assisted draft to create a payment link.</p>}
        {data.invitations.filter(item => section === 'Invitations' || item.source === 'ADMIN').map(item => <div className="aw-invitation-row stack" key={item.id} id={'aw-item-' + item.id}><div className="inline"><strong>{item.title}</strong><span>{item.owner.name} · {item.status}</span>{item.slug && <Link href={'/invite/' + item.slug}>Public invitation</Link>}
          {['DRAFT', 'ACTIVE'].includes(item.status) && <Link className="button outline small" href={'/editor/new?edit=' + item.id}>Edit</Link>}
{item.status === 'LOCKED' && <button className="button outline small" disabled={busy} onClick={() => run(() => api('/admin/invitations/' + item.id + '/archive', 'POST'), 'Invitation archived.')}>Archive</button>}{item.source === 'ADMIN' && ['DRAFT', 'PAYMENT_PENDING'].includes(item.status) && <button className="button outline small" disabled={busy} onClick={() => run(() => api('/admin/invitations/' + item.id + '/payment-link', 'POST'), 'Payment link is available under Orders.')}>Create payment link</button>}</div>
          {item.source === 'ADMIN' && item.status === 'DRAFT' && <details><summary>Record a verified offline payment</summary>
            <form className="inline" onSubmit={event => { const fields = form(event); void run(() => api('/admin/invitations/' + item.id + '/offline-payment', 'POST', Object.fromEntries(fields)), 'Offline payment recorded and invitation activated.') }}>
              <label>Method<select name="type">{['Cash', 'UPI', 'Bank transfer', 'Other'].map(type => <option key={type}>{type}</option>)}</select></label>
              <label>Reference<input name="reference" required maxLength={150} /></label><label>Notes<input name="notes" /></label><button className="button small" disabled={busy}>Verify payment</button>
            </form></details>}
        </div>)}
        {section === 'Payment Links' && <OrderTable orders={data.orders.filter(order => order.method === 'LINK')} />}
        {section === 'Payments' && <OrderTable orders={data.orders} />}
      </section>}
      {section === 'Orders' && <section className="panel stack"><h2>Order history</h2><OrderTable orders={data.orders} /></section>}
      {section === 'Categories' && <section className="panel stack"><h2>Manage categories</h2>
        <form className="inline" onSubmit={event => { const fields = form(event); void run(() => api('/admin/categories', 'POST', Object.fromEntries(fields)), 'Category saved.') }}>
          <label>Category slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label><label>Category name<input name="name" required /></label><button className="button small" disabled={busy}>Save category</button>
        </form>
      </section>}
      {section === 'Templates' && <section className="panel stack"><h2>Manage templates</h2>
        {templates.map(template => <details key={template.slug} id={'aw-item-' + template.slug}><summary>{template.name} · {money(template.offerPrice)}</summary>
          <p>{template.slug} · {template.categoryId} · {template.archivedAt ? 'Archived' : template.active ? 'Published' : 'Unpublished'} · Version {template.versions[0]?.number ?? '—'}{template.createdAt && <> · Created {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(template.createdAt))}</>}</p>
          <form className="inline" onSubmit={event => { const fields = form(event); void run(() => api('/admin/templates/' + template.slug, 'PATCH', {
            regularPrice: Math.round(Number(fields.get('regular')) * 100), offerPrice: Math.round(Number(fields.get('offer')) * 100), featured: fields.get('featured') === 'on', status: fields.get('status'),
            name: fields.get('name'), description: fields.get('description'), image: fields.get('image'), style: fields.get('style'), categoryId: fields.get('category'), classification: fields.get('tier'),
            culture: fields.get('culture') || null, subcategory: fields.get('subcategory') || null, sortOrder: Number(fields.get('sortOrder')),
          }), 'Template updated.') }}>
            <label>Name<input name="name" defaultValue={template.name} required /></label>
            <label>Description<textarea name="description" defaultValue={template.description} required /></label>
            <label>Style<input name="style" defaultValue={template.style} required /></label>
            <label>Category slug<input name="category" defaultValue={template.categoryId} required /></label>
            <label>Culture<input name="culture" defaultValue={template.culture || ''} /></label>
            <label>Subcategory<input name="subcategory" defaultValue={template.subcategory || ''} /></label>
            <label>Tier<select name="tier" defaultValue={template.classification}>{['Basic', 'Standard', 'Premium', 'Luxury'].map(tier => <option key={tier}>{tier}</option>)}</select></label>
            <label>Thumbnail path<input key={template.image} name="image" defaultValue={template.image} required /></label>
            <label>Sort order<input name="sortOrder" type="number" min="0" max="9999" defaultValue={template.sortOrder || 0} /></label>
            <label>Regular price (₹)<input name="regular" type="number" min="1" step="0.01" defaultValue={template.regularPrice / 100} required /></label><label>Offer price (₹)<input name="offer" type="number" min="1" step="0.01" defaultValue={template.offerPrice / 100} required /></label>
            <label className="checkbox"><input type="checkbox" name="featured" defaultChecked={template.featured} /> Featured</label><label>Status<select name="status" defaultValue={template.archivedAt ? 'ARCHIVED' : template.active ? 'PUBLISHED' : 'UNPUBLISHED'}><option value="PUBLISHED">Published</option><option value="UNPUBLISHED">Unpublished</option><option value="ARCHIVED">Archived</option></select></label><button className="button small" disabled={busy}>Save template</button>
          </form>
          <form className="inline" onSubmit={event => {
            const file = form(event).get('thumbnail')
            if (!(file instanceof File) || file.size === 0) return
            void run(async () => {
              if (file.size > 5_000_000) throw new Error('Choose an image under 5 MB.')
              const data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(String(reader.result).split(',')[1])
                reader.onerror = () => reject(new Error('The thumbnail could not be read.'))
                reader.readAsDataURL(file)
              })
              return api('/admin/templates/' + template.slug + '/thumbnail', 'POST', { data })
            }, 'Thumbnail uploaded.')
          }}>
            <label>Upload thumbnail<input type="file" name="thumbnail" accept="image/jpeg,image/png,image/webp" required /></label>
            <button className="button small" disabled={busy}>Upload</button>
          </form>
          <form className="stack" onSubmit={event => { const fields = form(event); void run(() => api('/admin/templates/' + template.slug + '/versions', 'POST', JSON.parse(String(fields.get('config')))), 'New template version published.') }}>
            <Link href={'/preview/template/' + template.slug}>Open public template preview</Link><label>Version configuration (JSON)<textarea name="config" required defaultValue={JSON.stringify(template.versions[0]?.config, null, 2)} /></label><button className="button small" disabled={busy}>Publish new version</button>
          </form>
        </details>)}
        <details id="aw-add-template"><summary>Create a new template</summary><form className="stack" onSubmit={event => {
          const fields = form(event)
          void run(() => api('/admin/templates', 'POST', JSON.parse(String(fields.get('template')))), 'Template created.')
        }}>
          <label>Template definition (JSON)<textarea name="template" required defaultValue={JSON.stringify({
            slug: 'new-design', name: 'New design', description: '', image: '/images/bengali.webp', style: 'Traditional', categoryId: 'bengali-wedding', classification: 'Standard', regularPrice: 149900, offerPrice: 129900,
            config: { theme: 'ruby', names: 'Sample Names', image: '/images/bengali.webp', sections: ['events', 'countdown', 'rsvp'] },
          }, null, 2)} /></label><button className="button small" disabled={busy}>Create template</button></form></details>
      </section>}
      {section === 'Music Library' && <section className="panel stack"><h2>Music library</h2><form className="inline" onSubmit={event => { const fields = form(event); void run(() => api('/admin/music', 'POST', Object.fromEntries(fields)), 'Licensed track added.') }}>
        <label>Track name<input name="name" required /></label><label>Artist<input name="artist" required /></label><label>License reference<input name="license" required /></label><label>HTTPS audio URL<input name="file" type="url" required /></label><button className="button small" disabled={busy}>Add track</button>
      </form></section>}
      {section === 'Coupons' && <AdminCoupons />}
      {section === 'CMS' && <AdminContent />}
      {section === 'Activity Logs' && <section className="panel stack"><h2>Recent activity</h2>{data.logs.map(log => <p key={log.id}>{new Date(log.createdAt).toLocaleString('en-IN')} · {log.actor.name} · {log.action.replaceAll('_', ' ').toLowerCase()}</p>)}</section>}
      </div>
    </>}
  </AdminWorkspace>
}
