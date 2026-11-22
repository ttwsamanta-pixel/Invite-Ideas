'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
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
      <p>{invitation.templateVersion?.template.name} · {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: invitation.timezone }).format(new Date(invitation.finalEventAt))}</p>
      <p>{invitation._count?.views ?? 0} views · {invitation._count?.responses ?? 0} RSVPs {invitation.order && ' · ' + money(invitation.order.amount) + ' · ' + invitation.order.status}</p>
      <div className="inline">
        {['DRAFT', 'ACTIVE'].includes(invitation.status || '') && <Link className="button outline small" href={'/editor/' + invitation.templateVersion?.template.slug + '?edit=' + invitation.id}>Edit</Link>}
        <Link className="button outline small" href={'/preview/invitation/' + invitation.previewToken}>Preview</Link>
        {invitation.slug && <><Link className="button outline small" href={'/invite/' + invitation.slug}>Open public invitation</Link><button className="button outline small" onClick={() => share(invitation.slug!)}>Share</button><a className="button outline small" href={'/api/invitations/' + invitation.id + '/qr'}>Download QR</a></>}
        <button className="button outline small" onClick={() => openGuests(invitation.id)}>Guests & RSVPs</button>
      </div>
      {guests?.id === invitation.id && <div className="stack"><h3>Guest list</h3><form className="inline" onSubmit={e => addGuest(e, invitation.id)}><label>Name<input name="name" required /></label><label>Email<input name="email" required type="email" /></label><button className="button small">Add guest</button></form>
        {guests.guests.map(guest => <p key={guest.id}>{guest.name} · {guest.email}</p>)}<h3>Responses</h3>
        {guests.responses.length === 0 && <p>No guest responses yet.</p>}
        {guests.responses.map(response => <p key={response.id}>{response.name} · {response.attending ? 'Attending (' + response.party + ')' : 'Declined'} {response.message && ' · ' + response.message}</p>)}</div>}
    </article>)}
  </section>
}
