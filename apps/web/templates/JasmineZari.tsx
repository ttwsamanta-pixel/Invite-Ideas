"use client";
import "./jasmine-zari.css";
import { Countdown, EventTimeline, Gallery, MusicButton, Section, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";

export default function JasmineZari({ data }: { data: InvitationData }) {
  useReveal();
  return <main className="invite batch-two jasmine" style={data.artwork ? { backgroundImage: "url(" + data.artwork + ")" } : undefined}>
    <MusicButton url={data.musicUrl} />
    <section className="jasmine-opening"><div className="temple-door left"/><div className="temple-door right"/><div className="jasmine-opening-copy"><div className="jasmine-flower">✦</div><div className="eyebrow">With the blessings of our families</div><h1>{data.groomName}<i>&amp;</i>{data.brideName}</h1><p>{data.date}</p><a href="#jasmine-invite">Open the invitation</a></div></section>
    <section id="jasmine-invite" className="jasmine-hero"><div className="jasmine-rangoli"/><div className="container"><div className="eyebrow">Jasmine &amp; Zari</div><h2>A celebration<br/><em>in gold &amp; ivory</em></h2><p className="lead">{data.welcomeMessage ?? "Join us for a celebration filled with jasmine, music, family and the warmth of two traditions becoming one."}</p></div></section>
    <div className="container">
      {data.story && <Section eyebrow="Our story" title="From hello to forever"><p className="lead">{data.story}</p></Section>}
      <Section eyebrow="Muhurtham & celebrations" title="The sacred moments"><EventTimeline events={data.events}/></Section>
      <Section eyebrow="Muhurtham countdown" title="The auspicious moment"><Countdown date={data.countdownAt}/></Section>
      {data.gallery.length > 0 && <Section eyebrow="Captured memories" title="A little glimpse"><Gallery images={data.gallery}/></Section>}
      <Section eyebrow="Venue" title={data.venue ?? "Wedding venue"}><p className="lead">{data.address}</p>{data.mapUrl && <a className="cta jasmine-cta" href={data.mapUrl} target="_blank" rel="noreferrer">View on map</a>}</Section>
      {data.guestDetails.length > 0 && <Section title="Guest information"><dl className="batch-two-details">{data.guestDetails.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></Section>}
      {data.rsvpEnabled && <Section eyebrow="Your presence matters" title="Kindly join us">{data.rsvp}</Section>}
    </div>
    <footer className="jasmine-footer"><div>ஜெய் ஸ்ரீ கணேஷா</div><p>May the new beginning be filled with grace.</p></footer>
  </main>;
}
