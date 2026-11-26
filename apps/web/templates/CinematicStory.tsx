import type { InvitationData } from './adapter'
import { Countdown, Gallery, MusicButton } from './InvitationPrimitives'
import './cinematic-story.css'

export function CinematicStory({ data, theme }: { data: InvitationData; theme: 'burgundy' | 'royal' | 'floral' | 'mirror' | 'parchment' }) {
  const sections = data.sections
  return <main className={'cinematic-story ii-story-site ii-theme-' + theme}>
    {sections.includes('music') && <MusicButton url={data.musicUrl} />}
    <section className="ii-hero">
      <span className="ii-kicker">{data.title}</span>
      <h1>{data.names}</h1>
      {sections.includes('family') && data.welcomeMessage && <p>{data.welcomeMessage}</p>}
      {data.date && <div className="ii-date">{data.date}</div>}
    </section>
    {sections.includes('story') && data.story && <section className="ii-story"><h2>Our story</h2><p>{data.story}</p></section>}
    {sections.includes('events') && data.events.length > 0 && <section className="ii-events">
      <h2>The celebrations</h2>
      <div className="ii-event-grid">{data.events.map(event => <article key={event.id}>
        <h3>{event.title}</h3><p>{event.date} · {event.time}</p><p>{event.venue}</p>
        {event.address && <p>{event.address}</p>}
        {event.mapUrl && <a href={event.mapUrl} target="_blank" rel="noreferrer">Directions</a>}
      </article>)}</div>
    </section>}
    {sections.includes('countdown') && data.countdownAt && <section className="ii-countdown" aria-label="Countdown"><Countdown date={data.countdownAt} /></section>}
    {sections.includes('gallery') && data.gallery.length > 0 && <section className="ii-gallery"><h2>Gallery</h2><Gallery images={data.gallery} /></section>}
    {sections.includes('events') && data.venue && <section className="ii-venue"><h2>{data.venue}</h2>{data.mapUrl && <a href={data.mapUrl} target="_blank" rel="noreferrer">Open in Maps</a>}</section>}
    {data.guestDetails.length > 0 && <section className="ii-story"><h2>Guest information</h2><dl>{data.guestDetails.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></section>}
    {data.rsvpEnabled && <div className="ii-rsvp">{data.rsvp}</div>}
    <footer className="ii-footer">{data.names}</footer>
  </main>
}
