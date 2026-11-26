"use client";
import { Section, Gallery, MusicButton, EventTimeline, useReveal } from "./InvitationPrimitives";
import "./batch-four.css";
import "./batch4-christian.css";
import type { InvitationData } from "./adapter";

export default function ChristianGardenWedding({ data }: { data: InvitationData }) {
 useReveal();
 return <main className="ii-page batch-four christian-page"><MusicButton url={data.musicUrl}/>
  <section className="ii-hero christian-hero"><div className="cross">✦</div><p className="ii-kicker">With faith, love & joy</p><h1 className="ii-title">{data.names}</h1><p>{data.date}</p></section>
  <Section><p className="ii-kicker">Our wedding day</p><h2 className="ii-title">Love is the beginning<br/>of every beautiful story.</h2><p className="ii-copy">{data.story||"We invite you to witness and celebrate the beginning of our life together."}</p></Section>
  {data.events.length > 0 && <Section><EventTimeline events={data.events}/></Section>}
  <Section><div className="venue"><p className="ii-kicker">The Garden</p><h2 className="ii-title">{data.venue||"Our Wedding Venue"}</h2><p>{data.address}</p>{data.mapUrl && <a href={data.mapUrl} target="_blank" rel="noreferrer">Directions</a>}</div></Section>
  {data.gallery.length > 0 && <Section><Gallery images={data.gallery}/></Section>}
  <Section className="christian-footer"><h2 className="ii-title">See you at the altar</h2><p>{data.welcomeMessage||"Your presence will make our day even more special."}</p></Section>
  {data.guestDetails.length > 0 && <Section><dl className="batch-four-details">{data.guestDetails.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></Section>}
  {data.rsvpEnabled && <Section className="batch-four-rsvp">{data.rsvp}</Section>}
 </main>
}
