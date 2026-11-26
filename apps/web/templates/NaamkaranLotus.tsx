"use client";
import { Section, Gallery, MusicButton, EventTimeline, useReveal } from "./InvitationPrimitives";
import "./batch-four.css";
import "./batch4-naamkaran.css";
import type { InvitationData } from "./adapter";

export default function NaamkaranLotus({ data }: { data: InvitationData }) {
 useReveal();
 return <main className="ii-page batch-four naam-page"><MusicButton url={data.musicUrl}/>
  <section className="ii-hero naam-hero"><div className="lotus">✿</div><p className="ii-kicker">A little name, a lifetime of love</p><h1 className="ii-title">{data.names}</h1><p>{data.date} · {data.events[0]?.time}</p></section>
  <Section><p className="ii-kicker">The Naming Ceremony</p><h2 className="ii-title">A new name.<br/>A beautiful beginning.</h2><p className="ii-copy">{data.welcomeMessage||"With grateful hearts, we invite you to celebrate the naming of our little blessing."}</p></Section>
  <Section><div className="naam-card"><p className="ii-kicker">Hosted with love by</p><h3>{data.guestDetails.find(field => field.key === "family-name")?.value || data.names}</h3><p>{data.venue}</p><p>{data.address}</p></div></Section>
  {data.events.length > 0 && <Section><EventTimeline events={data.events}/></Section>}
  {data.gallery.length > 0 && <Section><Gallery images={data.gallery}/></Section>}
  <Section><h2 className="ii-title">Blessings welcome</h2><p className="ii-copy">{data.story||"Your presence and blessings are the most precious gift."}</p></Section>
  {data.guestDetails.length > 0 && <Section><dl className="batch-four-details">{data.guestDetails.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></Section>}
  {data.rsvpEnabled && <Section className="batch-four-rsvp">{data.rsvp}</Section>}
 </main>
}
