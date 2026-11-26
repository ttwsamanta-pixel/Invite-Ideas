'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { parseGuests } from '../lib/guests'
import { api, HttpError } from '../lib/client'
import { money, type Invitation } from '../lib/data'

type Account = { id: string; name: string; email: string; role: string }
type Guest = { id: string; name: string; email: string }
type Response = Guest & { attending: boolean; party: number; message: string }
export function Dashboard() {
  const router = useRouter()
  const [account, setAccount] = useState<Account>()
  const [items, setItems] = useState<Invitation[]>()
  const [guests, setGuests] = useState<{ id: string; guests: Guest[]; responses: Response[] }>()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [importing, setImporting] = useState(false)
  useEffect(() => {
    Promise.all([api<Account>('/auth/me'), api<Invitation[]>('/invitations')]).then(([person, invitations]) => {
      setAccount(person); setItems(invitations)
    }).catch(failure => {
      if (failure instanceof HttpError && failure.status === 401) router.replace('/login')
      else setError(failure.message)
    })
  }, [router])
  async function openGuests(id: string) {
    setError('')
    try { setGuests({ id, ...await api<{ guests: Guest[]; responses: Response[] }>('/invitations/' + id + '/guests') }) } catch (failure) { setError((failure as Error).message) }
  }
  async function addGuest(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault()
    const form = event.currentTarget
    setError('')
    try {
      await api('/invitations/' + id + '/guests', 'POST', Object.fromEntries(new FormData(form)))
      form.reset(); await openGuests(id)
    } catch (failure) { setError((failure as Error).message) }
  }
  async function importGuests(file: File, id: string) {
    setImporting(true); setError('')
    try {
      if (file.size > 1_000_000) throw new Error('Choose a CSV smaller than 1 MB.')
      const records = parseGuests((await file.text()).replace(/^\uFEFF/, ''))
      const result = await api<{ added: number }>('/invitations/' + id + '/guests/import', 'POST', records)
      setMessage(result.added + ' guests imported.')
      await openGuests(id)
    } catch (failure) { setError((failure as Error).message) }
    finally { setImporting(false) }
  }

  async function share(slug: string) {
    const url = location.origin + '/invite/' + slug
    try {
      if (navigator.share) await navigator.share({ url })
      else { await navigator.clipboard.writeText(url); setMessage('Invitation link copied.') }
    } catch (failure) { if ((failure as Error).name !== 'AbortError') setError('Could not share automatically. Copy the public invitation link.') }
  }
  return <section className="wrap content stack"><div className="inline"><h1>My Invitations</h1><Link className="button" href="/templates">Create Invitation</Link>{account?.role === 'ADMIN' && <Link className="button outline" href="/admin">Admin panel</Link>}</div>
    {account && <div className="inline"><span>{account.name} · {account.email}</span><button className="button outline small" onClick={async () => { try { await api('/auth/logout', 'POST'); router.push('/login') } catch (failure) { setError((failure as Error).message) } }}>Sign out</button></div>}
    {error && <p role="alert" className="error">{error}</p>}{message && <p role="status" className="success">{message}</p>}
    {!items && !error && <p role="status">Loading invitations…</p>}
    {items?.length === 0 && <div className="panel"><p>Your saved drafts and published invitations will appear here.</p><Link href="/templates">Explore invitation templates</Link></div>}
    {items?.map(invitation => <article className="panel list-card" key={invitation.id}>
      <span className="badge-static">{invitation.status?.replaceAll('_', ' ')}</span><h2>{invitation.title}</h2>
      <p>{invitation.templateVersion?.template.name} · {invitation.events.length ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: invitation.timezone }).format(new Date(invitation.finalEventAt)) : 'Add event details'}</p>
      <p>{invitation._count?.views ?? 0} views · {invitation._count?.responses ?? 0} RSVPs {invitation.order && ' · ' + money(invitation.order.amount) + ' · ' + invitation.order.status}</p>
      <div className="inline">
        {['DRAFT', 'ACTIVE'].includes(invitation.status || '') && <Link className="button outline small" href={'/editor/' + invitation.templateVersion?.template.slug + '?edit=' + invitation.id}>Edit</Link>}
        <Link className="button outline small" href={'/preview/invitation/' + invitation.previewToken}>Preview</Link>
        {invitation.slug && <><Link className="button outline small" href={'/invite/' + invitation.slug}>Open public invitation</Link><button className="button outline small" onClick={() => share(invitation.slug!)}>Share</button><a className="button outline small" href={'/api/invitations/' + invitation.id + '/qr'}>Download QR</a></>}
        <button className="button outline small" onClick={() => openGuests(invitation.id)}>Guests & RSVPs</button>
      </div>
      {guests?.id === invitation.id && <div className="stack"><h3>Guest list</h3><form className="inline" onSubmit={e => addGuest(e, invitation.id)}><label>Name<input name="name" required /></label><label>Email<input name="email" required type="email" /></label><button className="button small">Add guest</button></form>
        <label>Import a guest CSV (name and email)<input type="file" accept=".csv,text/csv" disabled={importing} onChange={event => { const file = event.target.files?.[0]; if (file) void importGuests(file, invitation.id); event.target.value = '' }} /></label>
        <div className="field-grid"><label>Search guests<input value={query} onChange={event => setQuery(event.target.value)} /></label>
          <label>RSVP status<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All guests</option><option value="waiting">Awaiting response</option><option value="yes">Attending</option><option value="no">Declined</option></select></label></div>
        {guests.guests.map(guest => {
          const response = guests.responses.find(item => item.email === guest.email)
          const status = response ? response.attending ? 'yes' : 'no' : 'waiting'
          if ((filter !== 'all' && filter !== status) || !(guest.name + ' ' + guest.email).toLowerCase().includes(query.trim().toLowerCase())) return null
          return <p key={guest.id}>{guest.name} · {guest.email} · {status === 'waiting' ? 'Awaiting response' : status === 'yes' ? 'Attending' : 'Declined'}</p>
        })}<h3>Responses</h3>
        {guests.responses.length === 0 && <p>No guest responses yet.</p>}
        {guests.responses.map(response => <p key={response.id}>{response.name} · {response.attending ? 'Attending (' + response.party + ')' : 'Declined'} {response.message && ' · ' + response.message}</p>)}</div>}
    </article>)}
  </section>
}
