"use client";
import "./moonlit-jali.css";
import { Countdown, EventTimeline, Gallery, MusicButton, Section, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";

export default function MoonlitJali({ data }: { data: InvitationData }) {
  useReveal();
  return <main className="invite batch-two moonlit" style={data.artwork ? { backgroundImage: "url(" + data.artwork + ")" } : undefined}>
    <MusicButton url={data.musicUrl} />
    <section className="moonlit-opening"><div className="stars"/><div className="jali-arch"><div className="moon">☾</div><div className="eyebrow">Bismillah • With the blessings of our families</div><h1>{data.groomName}<span>&amp;</span>{data.brideName}</h1><p>{data.date}</p><a href="#moonlit-invite">Enter the nikah</a></div></section>
    <section id="moonlit-invite" className="moonlit-hero"><div className="crescent"/><div className="container"><div className="eyebrow">Moonlit Jali</div><h2>A night of<br/><em>love &amp; dua</em></h2><p className="lead">{data.welcomeMessage ?? "With the love of our families and the grace of Allah, we invite you to witness our Nikah and celebrate with us."}</p></div></section>
    <div className="container">
      {data.story && <Section eyebrow="Our story" title="A beautiful beginning"><p className="lead">{data.story}</p></Section>}
      <Section eyebrow="Nikah & reception" title="The evening"><EventTimeline events={data.events}/></Section>
      <Section eyebrow="The countdown" title="Until our Nikah"><Countdown date={data.countdownAt}/></Section>
      {data.gallery.length > 0 && <Section eyebrow="Moments" title="Captured in moonlight"><Gallery images={data.gallery}/></Section>}
      <Section eyebrow="Venue" title={data.venue ?? "The celebration"}><p className="lead">{data.address}</p>{data.mapUrl && <a className="cta moonlit-cta" href={data.mapUrl} target="_blank" rel="noreferrer">View location</a>}</Section>
      {data.guestDetails.length > 0 && <Section title="Guest information"><dl className="batch-two-details">{data.guestDetails.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></Section>}
      {data.rsvpEnabled && <Section eyebrow="With joy in our hearts" title="Join us">{data.rsvp}</Section>}
    </div>
    <footer className="moonlit-footer"><div>بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div><p>May this new chapter be filled with barakah.</p></footer>
  </main>;
}
