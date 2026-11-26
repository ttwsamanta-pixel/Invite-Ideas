"use client";
import "./phulkari-courtyard.css";
import { Countdown, EventTimeline, Gallery, MusicButton, Section, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";

export default function PhulkariCourtyard({ data }: { data: InvitationData }) {
  useReveal();
  return <main className="invite batch-two phulkari" style={data.artwork ? { backgroundImage: "url(" + data.artwork + ")" } : undefined}>
    <MusicButton url={data.musicUrl} />
    <section className="phulkari-opening">
      <div className="phulkari-grid" aria-hidden="true" />
      <div className="opening-copy"><div className="phulkari-badge">ੴ</div><div className="eyebrow">Anand Karaj • A Celebration of Love</div><h1>{data.groomName} <span>&amp;</span> {data.brideName}</h1><p>{data.date ?? "A day to remember"}</p><a href="#phulkari-invite" className="phulkari-link">Enter the celebration</a></div>
    </section>
    <section id="phulkari-invite" className="phulkari-hero"><div className="phulkari-hero-art"/><div className="container"><div className="eyebrow">Phulkari Courtyard</div><h2>Two hearts.<br/>One sacred promise.</h2><p className="lead">{data.welcomeMessage ?? "With the blessings of our families, we invite you to celebrate our Anand Karaj and the beginning of a beautiful new chapter."}</p></div></section>
    <div className="container">
      {data.story && <Section eyebrow="Our story" title="A love worth gathering for"><p className="lead">{data.story}</p></Section>}
      <Section eyebrow="Ceremony & celebrations" title="The wedding weekend"><EventTimeline events={data.events}/></Section>
      <Section eyebrow="The countdown" title="Until we say Anand"><Countdown date={data.countdownAt}/></Section>
      {data.gallery.length > 0 && <Section eyebrow="Memories" title="In frames"><Gallery images={data.gallery}/></Section>}
      <Section eyebrow="Gurdwara / Venue" title={data.venue ?? "The celebration"}><p className="lead">{data.address}</p>{data.mapUrl && <a className="cta phulkari-cta" href={data.mapUrl} target="_blank" rel="noreferrer">Get directions</a>}</Section>
      {data.guestDetails.length > 0 && <Section title="Guest information"><dl className="batch-two-details">{data.guestDetails.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></Section>}
      {data.rsvpEnabled && <Section eyebrow="We would love to see you" title="Please join us">{data.rsvp}</Section>}
    </div>
    <footer className="phulkari-footer"><span>ਵਾਹਿਗੁਰੂ</span><p>With love, laughter &amp; blessings</p></footer>
  </main>;
}
