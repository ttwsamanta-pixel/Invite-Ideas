'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { InvitationView } from './invitation'
import { api, HttpError } from '../lib/client'
import type { Invitation, Template } from '../lib/data'

const short = z.string().trim().min(1, 'Required').max(180)
const schema = z.object({
  title: short, names: short, language: z.enum(['en', 'bn', 'hi']), story: z.string().max(4000), family: z.string().max(4000), details: z.record(z.string(), z.string().max(500)),
  rsvpEnabled: z.boolean(), musicId: z.string(),
  events: z.array(z.object({ name: short, date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/), venue: short, mapUrl: z.union([z.url({ protocol: /^https$/ }), z.literal('')]), description: z.string().max(4000) })).min(1).max(20),
})
type Fields = z.infer<typeof schema>
const emptyEvent = { name: '', date: '', venue: '', mapUrl: '', description: '' }
type Track = { id: string; name: string; artist: string }
function indiaLocal(iso: string) {
  return new Date(Date.parse(iso) + 19_800_000).toISOString().slice(0, 16)
}
export function Editor({ templates, selected, id, owner }: { templates: Template[]; selected?: string; id?: string; owner?: string }) {
  const router = useRouter()
  const [trackList, setTrackList] = useState<Track[]>([])
  const [existing, setExisting] = useState<Invitation>()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [livePreview, setLivePreview] = useState(false)
  const draftRequest = useRef<string>(undefined)
  const [template, setTemplate] = useState(selected || templates[0]?.slug || '')
  const { register, reset, control, handleSubmit, formState, getValues, setValue } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', names: '', language: 'en', story: '', family: '', details: {}, rsvpEnabled: true, musicId: '', events: [emptyEvent] },
  })
  const draftId = id || existing?.id
  const formValues = useWatch({ control })
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'events' })
  useEffect(() => {
    let live = true
    const access = id ? api<Invitation>('/invitations/' + id) : api('/auth/me')
    access.then(result => {
      if (!live) return
      if (id) {
        const invitation = result as Invitation
        setExisting(invitation)
        reset({ ...invitation, language: invitation.events.length ? invitation.language : invitation.templateVersion?.config.language || invitation.language, details: invitation.details || {}, musicId: invitation.musicId || '', events: invitation.events.length ? invitation.events.map(item => ({ ...item, mapUrl: item.mapUrl || '', date: indiaLocal(item.startsAt) })) : (invitation.templateVersion?.config.events || ['']).map(name => ({ ...emptyEvent, name })) })
      }
      setReady(true)
    }).catch(failure => {
      if (!live) return
      if (failure instanceof HttpError && failure.status === 401) router.replace('/login?next=' + encodeURIComponent(location.pathname))
      else setError(failure.message)
    })
    api<Track[]>('/music').then(tracks => { if (live) setTrackList(tracks) }).catch(() => undefined)
    return () => { live = false }
  }, [id, reset, router])
  const config = existing?.templateVersion?.config || templates.find(item => item.slug === template)?.versions[0]?.config
  useEffect(() => {
    if (id || !config?.events) return
    const hasEventDetails = getValues('events').some(event => event.date || event.venue || event.mapUrl || event.description)
    if (!hasEventDetails) replace(config.events.map(name => ({ ...emptyEvent, name })))
    if (config.language && !formState.dirtyFields.language) setValue('language', config.language)
  }, [config, id, getValues, replace, setValue, formState.dirtyFields.language])
  useEffect(() => {
    if (!ready || draftId || owner || !config?.componentKey) return
    let active = true
    draftRequest.current ||= crypto.randomUUID()
    api<Invitation>('/invitations/drafts', 'POST', { template, requestId: draftRequest.current })
      .then(draft => {
        if (!active) return
        setExisting(draft)
        const url = new URL(location.href)
        url.searchParams.set('edit', draft.id)
        history.replaceState(null, '', url)
      })
      .catch(failure => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [config?.componentKey, draftId, owner, ready, template])
  const locked = existing && !['DRAFT', 'ACTIVE'].includes(existing.status || '')
  const save = handleSubmit(async data => {
    setError('')
    try {
      const path = draftId ? '/invitations/' + draftId : owner ? '/admin/invitations' : '/invitations'
      const saved = await api<Invitation>(path, draftId ? 'PATCH' : 'POST', {
        ...data, details: Object.fromEntries((config?.fields || []).map(field => [field.key, data.details[field.key] || ''])), template, ownerId: owner, timezone: 'Asia/Kolkata', musicId: data.musicId || null,
        events: data.events.map(({ date, mapUrl, ...event }) => ({ ...event, mapUrl: mapUrl || undefined, startsAt: date + ':00+05:30' })),
      })
      router.push(owner ? '/admin' : '/preview/invitation/' + saved.previewToken)
    } catch (failure) { setError((failure as Error).message) }
  })
  async function upload(file: File) {
    if (!draftId) return
    setUploading(true); setError('')
    try {
      if (file.size > 5_000_000 || !/\.(jpe?g|png|webp)$/i.test(file.name)) throw new Error('Choose a JPEG, PNG or WebP photo up to 5 MB.')
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const asset = await api<{ id: string }>('/invitations/' + draftId + '/gallery', 'POST', { type: file.type, data })
      setExisting(previous => previous ? { ...previous, gallery: [...previous.gallery, asset] } : previous)
    } catch (failure) { setError((failure as Error).message) } finally { setUploading(false) }
  }
  const liveEvents = (formValues.events || []).flatMap(event => {
    const start = Date.parse((event.date || '') + ':00+05:30')
    if (!event.name || !Number.isFinite(start)) return []
    return [{ name: event.name, startsAt: new Date(start).toISOString(), venue: event.venue || '', mapUrl: /^https:\/\//.test(event.mapUrl || '') ? event.mapUrl : undefined, description: event.description || '' }]
  }).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  return <section className="wrap content"><h1>{id ? 'Edit your invitation' : 'Create your invitation'}</h1>
    {error && <p className="error" role="alert">{error}</p>}
    {!ready && !error && <p role="status">Loading invitation editor…</p>}
    {locked && <p className="panel">This invitation is {existing.status === 'LOCKED' ? 'locked because the final event has started.' : 'awaiting payment or archived.'} <Link href="/dashboard">Back to dashboard</Link></p>}
    {ready && !locked && <div className="split"><form className="stack" onSubmit={save}>
      <section className="panel stack"><h2>Basic details</h2>
        {!draftId && !config?.componentKey && <label>Template<select value={template} onChange={e => setTemplate(e.target.value)}>{templates.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>}
        <div className="field-grid"><label>Invitation title<input {...register('title')} required maxLength={180} /></label><label>{config?.editorLabels?.name || 'Names'}<input {...register('names')} required maxLength={180} /></label></div>
        <label>Invitation language<select {...register('language')}><option value="en">English</option><option value="bn">বাংলা</option><option value="hi">हिन्दी</option></select></label>
      </section>
      <section className="panel stack"><h2>Events</h2><p>Enter event times in India Standard Time (IST). Editing closes at the start of your final event.</p>
        {fields.map((field, index) => <fieldset className="stack" key={field.id}><legend>Event {index + 1}</legend><div className="field-grid"><label>Event name<input {...register(`events.${index}.name`)} required /></label><label>Date and time<input type="datetime-local" {...register(`events.${index}.date`)} required /></label>
        <label>Venue address<input {...register(`events.${index}.venue`)} required /></label><label>Map link<input type="url" placeholder="https://" {...register(`events.${index}.mapUrl`)} /></label></div>
        <label>Description<textarea {...register(`events.${index}.description`)} maxLength={4000} /></label>
        {fields.length > 1 && <button type="button" className="button outline small" onClick={() => remove(index)}>Remove event {index + 1}</button>}</fieldset>)}
        {fields.length < 20 && <button type="button" className="button outline" onClick={() => append(emptyEvent)}>Add another event</button>}
      </section>
      {config?.fields?.length ? <section className="panel stack"><h2>Guest information</h2>
        {config.fields.map(field => <label key={field.key}>{field.label}<textarea {...register(`details.${field.key}`)} maxLength={500} /></label>)}
      </section> : null}
      <section className="panel stack"><h2>Personal touches</h2><label>{config?.editorLabels?.story || 'Story'}<textarea {...register('story')} maxLength={4000} /></label><label>{config?.editorLabels?.family || 'Family or additional message'}<textarea {...register('family')} maxLength={4000} /></label><label>Background music<select {...register('musicId')}><option value="">No music</option>{trackList.map(track => <option value={track.id} key={track.id}>{track.name} · {track.artist}</option>)}</select></label>
      <label className="checkbox"><input type="checkbox" {...register('rsvpEnabled')} /> Enable guest RSVP</label></section>
      {Object.keys(formState.errors).length > 0 && <p role="alert" className="error">Check the required fields, event dates and HTTPS map links.</p>}
      <button className="button" disabled={formState.isSubmitting || uploading}>{formState.isSubmitting ? 'Saving…' : owner ? 'Save invitation' : 'Save & preview'}</button>
    </form><aside className="panel stack"><h2>Photo gallery</h2>{draftId ? <>
      <label>Add a photo<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = '' }} /></label>
      <div className="gallery">{existing?.gallery.map(asset => <a key={asset.id} href={'/api/public/media/' + asset.id}><img src={'/api/public/media/' + asset.id} alt="Invitation gallery photo" /></a>)}</div>
    </> : <p>Save your draft, then reopen the editor to add photos.</p>}</aside></div>}
    {ready && config?.componentKey && <div className="panel stack">
      <button type="button" className="button outline" aria-expanded={livePreview} onClick={() => setLivePreview(!livePreview)}>{livePreview ? 'Hide live preview' : 'Show live preview'}</button>
      {livePreview && <InvitationView sample invitation={{
        id: draftId || '', title: formValues.title || '', names: formValues.names || '', language: formValues.language || config.language || 'en', timezone: 'Asia/Kolkata',
        story: formValues.story || '', family: formValues.family || '', details: formValues.details as Invitation['details'],
        events: liveEvents, finalEventAt: liveEvents.at(-1)?.startsAt || new Date(0).toISOString(), rsvpEnabled: Boolean(formValues.rsvpEnabled), order: null, config,
        gallery: existing?.gallery.map(image => ({ id: image.id, url: '/api/public/media/' + image.id })) || [],
      }} />}
    </div>}
  </section>
}
