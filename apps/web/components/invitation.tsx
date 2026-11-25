'use client'
import './wedding-editions.css'
import Link from 'next/link'
import Script from 'next/script'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { EnvelopeOpening } from './envelope-opening'
import { api } from '../lib/client'
import { money, type Invitation } from '../lib/data'

const labels = {
  en: { invited: 'You are warmly invited', events: 'Celebrations', map: 'Get directions', gallery: 'Photo gallery', story: 'Our story', family: 'From our family', rsvp: 'RSVP', name: 'Your name', email: 'Email', party: 'Guests', yes: 'Joyfully accepts', no: 'Regretfully declines', submit: 'Send response', thanks: 'Thank you for responding.', remaining: 'days to go' },
  bn: { invited: 'আপনাকে সাদর আমন্ত্রণ', events: 'অনুষ্ঠানসূচি', map: 'ঠিকানা দেখুন', gallery: 'ছবির গ্যালারি', story: 'আমাদের গল্প', family: 'পরিবারের পক্ষ থেকে', rsvp: 'উপস্থিতি জানান', name: 'আপনার নাম', email: 'ইমেল', party: 'অতিথি', yes: 'উপস্থিত থাকব', no: 'উপস্থিত থাকতে পারব না', submit: 'উত্তর পাঠান', thanks: 'উত্তর দেওয়ার জন্য ধন্যবাদ।', remaining: 'দিন বাকি' },
  hi: { invited: 'आप सादर आमंत्रित हैं', events: 'कार्यक्रम', map: 'स्थान देखें', gallery: 'तस्वीरें', story: 'हमारी कहानी', family: 'हमारे परिवार की ओर से', rsvp: 'उपस्थिति की पुष्टि', name: 'आपका नाम', email: 'ईमेल', party: 'मेहमान', yes: 'उपस्थित रहूँगा', no: 'उपस्थित नहीं रह पाऊँगा', submit: 'उत्तर भेजें', thanks: 'उत्तर देने के लिए धन्यवाद।', remaining: 'दिन शेष' },
}
const normalizeDate = (value: string) => value.replace(/[\u00a0\u2009\u202f]/g, ' ')

export function InvitationView({ invitation, slug, sample = false }: { invitation: Invitation; slug?: string; sample?: boolean }) {
  const t = labels[invitation.language]
  const config = invitation.config
  const sections = config?.sections || []
  const [opened, setOpened] = useState(false)
  const headline = useRef<HTMLHeadingElement>(null)
  const sealed = config?.opening === 'envelope' && !opened
  useEffect(() => { if (opened) headline.current?.focus() }, [opened])
  const [remaining, setRemaining] = useState<number>()
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    function update() { setRemaining(Math.ceil((Date.parse(invitation.finalEventAt) - Date.now()) / 86_400_000)) }
    update()
    const timer = setInterval(update, 60_000)
    return () => clearInterval(timer)
  }, [invitation.finalEventAt])
  useEffect(() => {
    if (slug) void api('/public/invite/' + slug + '/view', 'POST').catch(() => undefined)
  }, [slug])
  async function respond(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sample) { setAnswer(t.thanks); return }
    const data = new FormData(event.currentTarget)
    setError(''); setBusy(true)
    try {
      await api('/public/invite/' + slug + '/rsvp', 'POST', {
        name: data.get('name'), email: data.get('email'), attending: data.get('attending') === 'yes', party: Number(data.get('party')), message: data.get('message') || '',
      })
      setAnswer(t.thanks)
    } catch (failure) { setError((failure as Error).message) } finally { setBusy(false) }
  }
  const guestDetails = config?.fields?.filter(field => invitation.details?.[field.key]) || []
  const ceremony = invitation.events[0]
  const formatDate = new Intl.DateTimeFormat(invitation.language, { year: 'numeric', month: 'long', day: 'numeric', timeZone: invitation.timezone })
  const eventDate = ceremony && normalizeDate(formatDate.formatRange(new Date(ceremony.startsAt), new Date(invitation.finalEventAt)))
  const detailHeading = { en: 'Guest information', bn: 'অতিথিদের জন্য তথ্য', hi: 'मेहमानों के लिए जानकारी' }[invitation.language]
  return <>
    {sealed && <EnvelopeOpening names={invitation.names} language={invitation.language} artwork={config!.image} onOpen={() => setOpened(true)} />}
    <article hidden={sealed} className={'invitation ' + (config?.theme || '') + (config?.layout ? ' wedding-edition wedding-' + config.layout : '')} lang={invitation.language}>
    {config?.layout ? <>
      <header className="wedding-hero">
        <img src={config.image} alt="" fetchPriority="high" />
        <div className="wedding-cover-copy"><p>{t.invited}</p><h1 ref={headline} tabIndex={-1}>{invitation.names}</h1><strong className="wedding-invitation-title">{invitation.title}</strong><span>{eventDate}</span></div>
      </header>
      <nav className="wedding-nav" aria-label={t.events}>
        {sections.includes('events') && <a href="#invitation-events">{t.events}</a>}
        {sections.includes('gallery') && invitation.gallery.length > 0 && <a href="#invitation-gallery">{t.gallery}</a>}
        {guestDetails.length > 0 && <a href="#guest-information">{detailHeading}</a>}
        {sections.includes('rsvp') && invitation.rsvpEnabled && (slug || sample) && <a href="#invitation-rsvp">{t.rsvp}</a>}
      </nav>
    </> : <header className={invitation.id ? "invite-top personalized" : "invite-top"}>
      {invitation.id ? <span className="invite-flourish" aria-hidden="true">❦</span> : config?.image && <img src={config.image} alt="" />}
      <p>{t.invited}</p><h1 ref={headline} tabIndex={-1}>{invitation.names}</h1><p>{invitation.title}</p>
    </header>}
    {sections.includes('countdown') && remaining !== undefined && remaining > 0 && <section className="invite-section wedding-countdown"><strong>{new Intl.NumberFormat(invitation.language).format(remaining)}</strong><span>{t.remaining}</span></section>}
    {sections.includes('events') && <section className="invite-section" id="invitation-events"><h2>{t.events}</h2><div className="wedding-schedule">{invitation.events.map((event, index) => <div className="wedding-event" key={index}>
      <h3>{event.name}</h3><time dateTime={event.startsAt}>{normalizeDate(new Intl.DateTimeFormat(invitation.language, { dateStyle: 'full', timeStyle: 'short', timeZone: invitation.timezone }).format(new Date(event.startsAt)))}</time><p className="wedding-venue">{event.venue}</p>
      {event.description && <p>{event.description}</p>}{event.mapUrl && <a className="button outline small" href={event.mapUrl} target="_blank" rel="noreferrer">{t.map}</a>}
    </div>)}</div></section>}
    {guestDetails.length > 0 && <section className="invite-section wedding-details" id="guest-information"><h2>{detailHeading}</h2>
      <dl>{guestDetails.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{invitation.details?.[field.key]}</dd></div>)}</dl>
    </section>}
    {sections.includes('gallery') && invitation.gallery.length > 0 && <section className="invite-section" id="invitation-gallery"><h2>{t.gallery}</h2><div className="gallery">{invitation.gallery.map(image => <img key={image.id} src={image.url} alt={t.gallery} loading="lazy" />)}</div></section>}
    {sections.includes('story') && invitation.story && <section className="invite-section wedding-note"><h2>{t.story}</h2><p>{invitation.story}</p></section>}
    {sections.includes('family') && invitation.family && <section className="invite-section wedding-note wedding-family"><h2>{t.family}</h2><p>{invitation.family}</p></section>}
    {sections.includes('music') && invitation.music && <section className="invite-section"><p>{invitation.music.name}</p><audio controls preload="none" src={invitation.music.file} /></section>}
    {sections.includes('rsvp') && invitation.rsvpEnabled && (slug || sample) && remaining !== undefined && remaining > 0 && <section className="invite-section" id="invitation-rsvp"><h2>{t.rsvp}</h2>
      {sample && <p>Try the sample RSVP. Responses are discarded.</p>}{answer ? <p role="status" className="success">{answer}</p> : <form className="stack" onSubmit={respond}>
        <label>{t.name}<input name="name" required maxLength={180} /></label><label>{t.email}<input name="email" required type="email" maxLength={190} /></label>
        <label>{t.rsvp}<select name="attending"><option value="yes">{t.yes}</option><option value="no">{t.no}</option></select></label>
        <label>{t.party}<input name="party" type="number" min={1} max={12} defaultValue={1} required /></label>
        <button className="button" disabled={busy}>{t.submit}</button>{error && <p role="alert" className="error">{error}</p>}
      </form>}
    </section>}
    <footer className="invite-section"><Link href="/" aria-label="InviteIdeas"><img src="/images/brand.png" alt="InviteIdeas" width="150" style={{ margin: 'auto' }} /></Link></footer>
    </article>
  </>
}
type CheckoutOptions = { key: string; order_id: string; amount: number; currency: string; name: string; handler: (data: unknown) => void; modal: { ondismiss: () => void } }
declare global { interface Window { Razorpay?: new (options: CheckoutOptions) => { open: () => void } } }
export function PrivatePreview({ token }: { token: string }) {
  const [invitation, setInvitation] = useState<Invitation>()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [published, setPublished] = useState('')
  const [coupon, setCoupon] = useState('')
  useEffect(() => { api<Invitation>('/preview/' + token).then(setInvitation).catch(failure => setError(failure.message)) }, [token])
  async function checkout() {
    if (!invitation || !window.Razorpay) { setError('Checkout could not load. Refresh and try again.'); return }
    setBusy(true); setError('')
    try {
      const order = await api<{ key: string; gatewayOrderId: string; amount: number; currency: string }>('/invitations/' + invitation.id + '/checkout', 'POST', { code: coupon.trim() || undefined })
      const Razorpay = window.Razorpay
      new Razorpay({
        key: order.key, order_id: order.gatewayOrderId, amount: order.amount, currency: order.currency, name: 'InviteIdeas',
        modal: { ondismiss: () => setBusy(false) },
        handler: async data => {
          try { setPublished((await api<{ slug: string }>('/invitations/' + invitation.id + '/confirm', 'POST', data)).slug) }
          catch (failure) { setError((failure as Error).message + ' Check your dashboard for the latest payment status.') }
          finally { setBusy(false) }
        },
      }).open()
    } catch (failure) { setError((failure as Error).message); setBusy(false) }
  }
  return <><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    <div className="preview-banner"><strong>Private invitation preview</strong><Link className="button outline small" href="/dashboard">My Invitations</Link>
      {published && <Link className="button small" href={'/invite/' + published}>Open Your Invitation</Link>}
      {!published && invitation && !invitation.order && <label>Coupon code<input value={coupon} onChange={e => setCoupon(e.target.value)} maxLength={32} placeholder="Optional" /></label>}
      {!published && invitation && (!invitation.order || (invitation.order.status === 'PENDING' && invitation.order.method === 'ONLINE')) && <button className="button small" onClick={checkout} disabled={busy}>{busy ? 'Processing…' : 'Pay & publish' + (coupon.trim() && !invitation.order ? '' : ' · ' + money(invitation.order?.amount ?? invitation.checkoutPrice ?? 0))}</button>}
      {invitation?.order?.status === 'PENDING' && invitation.order.paymentLinkUrl && <a className="button small" href={invitation.order.paymentLinkUrl}>Pay with Razorpay</a>}
    </div>
    {error && <p className="wrap error" role="alert">{error}</p>}
    {!invitation && !error && <p className="wrap" role="status">Loading your private preview…</p>}
    {invitation && <InvitationView invitation={invitation} />}
  </>
}
