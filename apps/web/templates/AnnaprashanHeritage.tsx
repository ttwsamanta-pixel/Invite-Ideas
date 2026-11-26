"use client";
import { Section, Gallery, MusicButton, EventTimeline, useReveal } from "./InvitationPrimitives";
import "./batch-four.css";
import "./batch4-annaprashan.css";
import type { InvitationData } from "./adapter";

export default function AnnaprashanHeritage({ data }: { data: InvitationData }) {
 useReveal();
 return <main className="ii-page batch-four anna-page"><MusicButton url={data.musicUrl}/>
  <section className="ii-hero anna-hero"><p className="ii-kicker">প্রথম অন্নপ্রাশন</p><h1 className="ii-title">{data.names}</h1><p>{data.date}</p><div className="rice-bowl">❋</div></section>
  <Section><p className="ii-kicker">A milestone to remember</p><h2 className="ii-title">From first smile<br/>to first bite</h2><p className="ii-copy">{data.story||data.welcomeMessage||"Come celebrate a beautiful milestone with our family as our little one takes the first taste of life's journey."}</p></Section>
  {data.events.length > 0 && <Section><EventTimeline events={data.events}/></Section>}
  {data.gallery.length > 0 && <Section><Gallery images={data.gallery}/></Section>}
  <Section className="anna-footer"><h2 className="ii-title">With love & blessings</h2><p>{data.guestDetails.find(field => field.key === "family-name")?.value || data.names}</p></Section>
  {data.story && data.welcomeMessage && <Section><p className="ii-copy">{data.welcomeMessage}</p></Section>}
  {data.guestDetails.length > 0 && <Section><dl className="batch-four-details">{data.guestDetails.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></Section>}
  {data.rsvpEnabled && <Section className="batch-four-rsvp">{data.rsvp}</Section>}
 </main>
}
