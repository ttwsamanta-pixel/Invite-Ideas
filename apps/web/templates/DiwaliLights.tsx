"use client";
import { Section, Gallery, MusicButton, EventTimeline, useReveal } from "./InvitationPrimitives";
import "./batch-four.css";
import "./batch4-diwali.css";
import type { InvitationData } from "./adapter";

export default function DiwaliLights({ data }: { data: InvitationData }) {
 useReveal();
 return <main className="ii-page batch-four diwali-page"><MusicButton url={data.musicUrl}/>
  <section className="ii-hero diwali-hero"><div className="diya-row">◌ ◌ ◌</div><p className="ii-kicker">The festival of lights</p><h1 className="ii-title">{data.title}</h1><p>{data.date}</p></section>
  <Section><p className="ii-kicker">An evening of light</p><h2 className="ii-title">Come home to<br/>celebrate Diwali</h2><p className="ii-copy">{data.story||data.welcomeMessage||"Join our family for diyas, sweets, laughter and a glowing evening together."}</p></Section>
  <Section><div className="diwali-invite"><p className="ii-kicker">Hosted by</p><h3>{data.names}</h3><p>{data.events[0]?.time}</p><p>{data.venue}<br/>{data.address}</p></div></Section>
  {data.events.length > 0 && <Section><EventTimeline events={data.events}/></Section>}
  {data.gallery.length > 0 && <Section><Gallery images={data.gallery}/></Section>}
  <Section className="diwali-footer"><h2 className="ii-title">May your home glow brighter</h2><p>Shubh Deepavali ✨</p></Section>
  {data.story && data.welcomeMessage && <Section><p className="ii-copy">{data.welcomeMessage}</p></Section>}
  {data.guestDetails.length > 0 && <Section><dl className="batch-four-details">{data.guestDetails.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></Section>}
  {data.rsvpEnabled && <Section className="batch-four-rsvp">{data.rsvp}</Section>}
 </main>
}
