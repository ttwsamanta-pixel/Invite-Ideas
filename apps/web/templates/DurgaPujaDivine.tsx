"use client";
import { Section, Gallery, MusicButton, EventTimeline, useReveal } from "./InvitationPrimitives";
import "./batch-four.css";
import "./batch4-puja.css";
import type { InvitationData } from "./adapter";

export default function DurgaPujaDivine({ data }: { data: InvitationData }) {
 useReveal();
 return <main className="ii-page batch-four puja-page">
  <MusicButton url={data.musicUrl}/>
  <section className="ii-hero puja-hero"><div className="puja-mandala">ॐ</div><p className="ii-kicker">শুভ দুর্গোৎসব</p><h1 className="ii-title">{data.title}</h1><p className="puja-host">{data.names}</p><p>{data.date}</p></section>
  <Section><p className="ii-kicker">আমন্ত্রণ</p><h2 className="ii-title">মায়ের আশীর্বাদে<br/>আপনাকে সাদর আমন্ত্রণ</h2><p className="ii-copy">{data.story||data.welcomeMessage||"Join us for prayers, rituals, cultural moments and the warmth of togetherness."}</p></Section>
  {data.events.length > 0 && <Section><EventTimeline events={data.events}/></Section>}
  {data.gallery.length > 0 && <Section><h2 className="ii-title">মায়ের আগমনী</h2><Gallery images={data.gallery}/></Section>}
  <Section className="puja-closing"><p className="ii-kicker">জয় মা দুর্গা</p><h2 className="ii-title">শুভ বিজয়া</h2><p className="ii-copy">{data.venue}<br/>{data.address}</p></Section>
  {data.story && data.welcomeMessage && <Section><p className="ii-copy">{data.welcomeMessage}</p></Section>}
  {data.guestDetails.length > 0 && <Section><dl className="batch-four-details">{data.guestDetails.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></Section>}
  {data.rsvpEnabled && <Section className="batch-four-rsvp">{data.rsvp}</Section>}
 </main>
}
