'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Activity, ArrowRight, BarChart3, Bell, CalendarDays, ChevronDown, Clock3, Coins, CreditCard, Crown, FileText, Grid2X2, House, Layers3, Link2, Mail, Menu, Music2, Plus, Search, ShoppingCart, Tag, UserPlus, Users, Wallet, X } from 'lucide-react'
import { api } from '../lib/client'
import { money, type Template } from '../lib/data'

export const sections = [
  ['Dashboard', House], ['Customers', Users], ['Invitations', Mail], ['Templates', Layers3],
  ['Categories', Grid2X2], ['Orders', ShoppingCart], ['Payments', CreditCard], ['Payment Links', Link2],
  ['Music Library', Music2], ['Coupons', Tag], ['CMS', FileText], ['Reports', BarChart3], ['Activity Logs', Activity],
] as const
export type Section = typeof sections[number][0]
export type Customer = { id: string; name: string; email: string; verifiedAt?: string; createdAt: string }
export type AdminOrder = {
  id: string; amount: number; status: string; method: string; createdAt: string; paymentLinkUrl?: string
  invitation: { title: string; owner: { name: string; email: string }; templateVersion: { template: { image: string; category: { name: string } } } }
}
export type AdminData = {
  users: Customer[]
  invitations: { id: string; title: string; status: string; source: string; slug?: string; owner: { name: string } }[]
  orders: AdminOrder[]
  logs: { id: string; action: string; createdAt: string; actor: { name: string } }[]
}
type Overview = {
  customers: number; status: Record<string, number>; pending: number; rsvp: number; revenue: number; online: number; offline: number
  series: { date: string; revenue: number; orders: number }[]
}
type Account = { name: string; email: string }
const timestamp = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
const shortDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()
const showStatus = (status: string) => status === 'SUCCESS' ? 'Paid' : status.toLowerCase().replaceAll('_', ' ')

export function AdminWorkspace({ account, section, select, data, templates, children }: {
  account?: Account; section: Section; select: (section: Section) => void; data?: AdminData; templates: Template[]; children: ReactNode
}) {
  const router = useRouter()
  const [drawer, setDrawer] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [profile, setProfile] = useState(false)
  const [query, setQuery] = useState('')
  const [logoutError, setLogoutError] = useState('')
  const search = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); search.current?.focus() }
      if (event.key === 'Escape') { setQuery(''); setDrawer(false); setProfile(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  function go(value: Section) { select(value); setDrawer(false); setQuery('') }
  const q = query.trim().toLocaleLowerCase()
  const matches = q && data ? [
    ...data.users.map(item => ({ key: item.id, name: item.name, detail: item.email, section: 'Customers' as const })),
    ...data.invitations.map(item => ({ key: item.id, name: item.title, detail: item.owner.name, section: 'Invitations' as const })),
    ...templates.map(item => ({ key: item.slug, name: item.name, detail: item.style, section: 'Templates' as const })),
    ...data.orders.map(item => ({ key: item.id, name: item.invitation.title, detail: item.id, section: 'Orders' as const })),
  ].filter(item => (item.name + ' ' + item.detail).toLocaleLowerCase().includes(q)).slice(0, 8) : []
  return <div className={'aw-shell' + (collapsed ? ' aw-collapsed' : '')}>
    {drawer && <button className="aw-scrim" aria-label="Close navigation" onClick={() => setDrawer(false)} />}
    <aside className={'aw-sidebar' + (drawer ? ' aw-open' : '')}>
      <Link className="aw-logo" href="/" aria-label="InviteIdeas storefront"><Image src="/images/brand.png" alt="InviteIdeas" width={198} height={63} unoptimized /></Link>
      <div className="aw-workspace-label"><Crown size={18} /><span>Super Admin Workspace</span></div>
      <nav aria-label="Admin navigation">{sections.map(([label, Icon]) => <button key={label} title={label} aria-current={section === label ? 'page' : undefined} onClick={() => go(label)}><Icon size={20} strokeWidth={1.75} /><span>{label}</span></button>)}</nav>
    </aside>
    <div className="aw-main">
      <header className="aw-toolbar">
        <button className="aw-icon" aria-label={drawer ? 'Close navigation' : 'Toggle navigation'} aria-expanded={drawer || !collapsed} onClick={() => {
          if (window.matchMedia('(max-width: 820px)').matches) setDrawer(!drawer)
          else setCollapsed(!collapsed)
        }}>{drawer ? <X /> : <Menu />}</button>
        <div className="aw-search"><Search size={19} /><input ref={search} value={query} onChange={e => setQuery(e.target.value)} aria-label="Search workspace" placeholder="Search customers, invitations, templates, orders…" /><kbd>Ctrl K</kbd>
          {q && <div className="aw-dropdown aw-results">{matches.length ? matches.map(item => <button key={item.section + item.key} onClick={() => { go(item.section); setTimeout(() => document.getElementById('aw-item-' + item.key)?.scrollIntoView({ block: 'center' }), 0) }}><strong>{item.name}</strong><small>{item.section} · {item.detail}</small></button>) : <p>No matches in the loaded records.</p>}</div>}
        </div>
        {account && <div className="aw-account">
          <button className="aw-icon aw-activity" aria-label="Recent activity" title="Recent activity" onClick={() => go('Activity Logs')}><Bell size={20} /></button>
          <button className="aw-profile" onClick={() => setProfile(!profile)} aria-expanded={profile} aria-label="Account menu"><span className="aw-avatar">{initials(account.name)}</span><span className="aw-profile-text"><strong>{account.name}</strong><small><Crown size={12} /> Super Admin</small></span><ChevronDown size={16} /></button>
          {profile && <div className="aw-dropdown aw-account-menu"><Link href="/dashboard">Customer dashboard</Link><Link href="/">Storefront</Link><button onClick={async () => {
            try { await api('/auth/logout', 'POST'); router.replace('/login') }
            catch (failure) { setLogoutError((failure as Error).message) }
          }}>Sign out</button>{logoutError && <p role="alert">{logoutError}</p>}</div>}
        </div>}
      </header>
      <main className="aw-content">{children}</main>
    </div>
  </div>
}

export function OrderTable({ orders }: { orders: AdminOrder[] }) {
  if (!orders.length) return <p className="aw-empty">No orders yet.</p>
  return <div className="aw-table-scroll"><table className="aw-table">
    <thead><tr><th>Order</th><th>Customer</th><th>Invitation</th><th>Amount</th><th>Payment method</th><th>Status</th><th>Date</th></tr></thead>
    <tbody>{orders.map(item => {
      const { owner, templateVersion, title } = item.invitation
      return <tr key={item.id} id={'aw-item-' + item.id}>
        <td title={item.id}>#{item.id.slice(0, 8).toUpperCase()}</td>
        <td><div className="aw-person"><span className="aw-avatar">{initials(owner.name)}</span><span><strong>{owner.name}</strong><small>{owner.email}</small></span></div></td>
        <td><div className="aw-person"><Image src={templateVersion.template.image} alt="" width={39} height={30} unoptimized /><span><strong>{title}</strong><small>{templateVersion.template.category.name}</small></span></div></td>
        <td><strong>{money(item.amount)}</strong></td>
        <td>{item.paymentLinkUrl ? <a href={item.paymentLinkUrl} target="_blank" rel="noreferrer">Payment link</a> : item.method === 'OFFLINE' ? 'Offline' : item.method === 'LINK' ? 'Payment link' : 'Razorpay'}</td>
        <td><span className={'aw-status aw-status-' + item.status.toLowerCase()}>{showStatus(item.status)}</span></td><td>{timestamp.format(new Date(item.createdAt))}</td>
      </tr>
    })}</tbody>
  </table></div>
}

function RevenueChart({ series, mode }: { series: Overview['series']; mode: 'revenue' | 'orders' }) {
  const [selected, setSelected] = useState<number>()
  const hasSales = series.some(item => item[mode] > 0)
  const max = Math.max(mode === 'revenue' ? 400 : 4, ...series.map(item => item[mode]))
  const step = Math.ceil(max / 4)
  const points = series.map((item, i) => ({ x: 76 + i * 494 / Math.max(1, series.length - 1), y: 160 - item[mode] * 140 / (step * 4) }))
  const line = points.map(point => point.x + ',' + point.y).join(' ')
  const format = (amount: number) => mode === 'revenue' ? money(amount) : amount.toLocaleString('en-IN')
  const active = selected !== undefined && series[selected] ? selected : undefined
  return <figure className="aw-chart" aria-label={mode === 'revenue' ? 'Daily paid revenue' : 'Daily paid order count'}>
    <svg viewBox="0 0 580 194" role="img" aria-label="Daily sales trend">
      <defs><linearGradient id="aw-chart-fill" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop offset="0%" stopColor="#b32661" stopOpacity=".3" /><stop offset="100%" stopColor="#b32661" stopOpacity=".04" /></linearGradient></defs>
      {[0, 1, 2, 3, 4].map(i => <g key={i}><line x1="76" x2="570" y1={160-i*35} y2={160-i*35} stroke="#eadce0" /><text x="69" y={164-i*35} textAnchor="end">{format(i*step)}</text></g>)}
      {points.length > 0 && <><polygon points={'76,160 ' + line + ' 570,160'} fill="url(#aw-chart-fill)" /><polyline points={line} fill="none" stroke="#840d40" strokeWidth="2.6" /></>}
      {points.map((point, i) => i % Math.ceil(series.length / 6) === 0 || i === series.length - 1 ? <text key={i} x={point.x} y="180" textAnchor={i === series.length - 1 ? 'end' : 'middle'}>{shortDate.format(new Date(series[i].date))}</text> : null)}
      {points.map((point, i) => <g key={i} onMouseEnter={() => setSelected(i)}><circle cx={point.x} cy={point.y} r={active === i ? 5 : 2.3} fill="#fffaf4" stroke="#840d40" strokeWidth="1.5" /><circle cx={point.x} cy={point.y} r="8" fill="transparent" /></g>)}
    </svg>
    <figcaption>{active === undefined ? (hasSales ? 'Daily totals · India Standard Time' : 'No paid orders in this period.') : shortDate.format(new Date(series[active].date)) + ' · ' + format(series[active][mode])}</figcaption>
  </figure>
}

const statusColors = [['ACTIVE', 'Active', '#850b40'], ['DRAFT', 'Draft', '#ffc65d'], ['PAYMENT_PENDING', 'Payment pending', '#fa8c27'], ['LOCKED', 'Locked', '#a17cde'], ['ARCHIVED', 'Archived', '#c8aff3']]
const quick = [['Create Invitation', Plus, 'Customers', 'aw-customer-list'], ['Add Customer', UserPlus, 'Customers', 'aw-add-customer'], ['Create Payment Link', Link2, 'Payment Links', ''], ['Add Template', Layers3, 'Templates', 'aw-add-template'], ['Add Music', Music2, 'Music Library', '']] as const
export function AdminOverview({ name, data, select }: { name?: string; data?: AdminData; select: (section: Section) => void }) {
  const [days, setDays] = useState('30')
  const [mode, setMode] = useState<'revenue' | 'orders'>('revenue')
  const [result, setResult] = useState<{ days: string; value: Overview }>()
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    api<Overview>('/admin/overview?days=' + days).then(value => { if (active) { setResult({ days, value }); setError('') } }).catch(failure => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [days, data])
  const view = result?.days === days ? result.value : undefined
  const metrics = [
    ['Total Customers', Users, view?.customers], ['Active Invitations', Mail, view?.status.ACTIVE],
    ['Total Revenue', Coins, view && money(view.revenue)], ['Pending Payments', Clock3, view?.pending],
    ['Online Sales', CreditCard, view && money(view.online)], ['Offline Sales', Wallet, view && money(view.offline)],
    ['RSVP Responses', CalendarDays, view?.rsvp],
  ] as const
  const total = Object.values(view?.status || {}).reduce((sum, value) => sum + value, 0)
  let angle = 0
  const stops = statusColors.flatMap(([key, , color]) => {
    const end = angle + (total ? ((view?.status[key] || 0) / total) * 360 : 0)
    const stop = color + ' ' + angle + 'deg ' + end + 'deg'
    const visible = end > angle
    angle = end
    return visible ? [stop] : []
  })
  return <>
    <div className="aw-heading"><div><p className="eyebrow">Super Admin Dashboard</p><h1>{name ? 'Welcome back, ' + name.split(' ')[0] + '!' : 'Workspace overview'}</h1><p>Track invitations, payments and customer activity.</p></div>
      <label className="aw-range"><CalendarDays size={19} /><select aria-label="Overview date range" value={days} onChange={e => setDays(e.target.value)}>
        <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
      </select></label>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="aw-metrics" aria-busy={!view && !error}>{metrics.map(([label, Icon, value], index) => <article className={'aw-metric' + (index === 2 ? ' aw-metric-featured' : '')} key={label}>
      <div><Icon size={25} strokeWidth={1.7} /><strong>{label}</strong></div><p>{typeof value === 'number' ? value.toLocaleString('en-IN') : value ?? '—'}</p>
      <small>{[2, 4, 5, 6].includes(index) ? 'Selected period' : 'Current total'}</small>
    </article>)}</div>
    <div className="aw-chart-grid">
      <section className="aw-panel"><div className="aw-panel-head"><h2>Revenue Overview</h2><div className="aw-toggle">{(['revenue', 'orders'] as const).map(key => <button key={key} aria-pressed={mode === key} onClick={() => setMode(key)}>{key === 'revenue' ? 'Revenue' : 'Orders'}</button>)}</div></div>
        {view ? <RevenueChart series={view.series} mode={mode} /> : <p className="aw-empty">{error ? 'Revenue unavailable.' : 'Loading revenue…'}</p>}</section>
      <section className="aw-panel"><h2>Invitation Status</h2><div className="aw-breakdown">
        <div className="aw-donut" style={{ background: stops.length ? 'conic-gradient(' + (stops.length === 1 ? stops[0] + ', ' + stops[0].split(' ')[0] + ' 360deg' : stops.join(', ')) + ')' : '#eee2e7' }}><div><strong>{total.toLocaleString('en-IN')}</strong><small>Total</small></div></div>
        <ul>{statusColors.map(([key, label, color]) => <li key={key}><i style={{ background: color }} /><span>{label}</span><strong>{view?.status[key] ?? '—'}</strong></li>)}</ul>
      </div></section>
      <section className="aw-panel"><h2>Quick Actions</h2><div className="aw-quick">{quick.map(([text, Icon, target, id], i) => <button className={i === 0 ? 'aw-primary' : ''} key={text} onClick={() => { select(target); if (id) setTimeout(() => {
        const element = document.getElementById(id)
        if (element instanceof HTMLDetailsElement) element.open = true
        element?.scrollIntoView({ block: 'center' })
      }, 0) }}><Icon size={19} />{text}</button>)}</div></section>
    </div>
    <div className="aw-recent">
      <section className="aw-panel aw-order-panel"><div className="aw-panel-head"><h2>Recent Orders</h2><button onClick={() => select('Orders')}>View all <ArrowRight size={15} /></button></div><OrderTable orders={data?.orders.slice(0, 5) || []} /></section>
      <section className="aw-panel"><div className="aw-panel-head"><h2>Recent Customers</h2><button onClick={() => select('Customers')}>View all <ArrowRight size={15} /></button></div>
        {data?.users.length ? <ul className="aw-customer-list">{data.users.slice(0, 5).map(item => <li key={item.id}><div className="aw-person"><span className="aw-avatar">{initials(item.name)}</span><div><strong>{item.name}</strong><small>{item.email}</small></div></div><time dateTime={item.createdAt}>{timestamp.format(new Date(item.createdAt))}</time></li>)}</ul> : <p className="aw-empty">No customers yet.</p>}
      </section>
    </div>
  </>
}
