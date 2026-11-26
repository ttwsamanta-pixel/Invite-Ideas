"use client";
import "./royal.css";
import { Countdown, EventTimeline, Gallery, MusicButton, Section, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";

export default function RoyalIndianWedding({ data }: { data: InvitationData }) {
  useReveal();
  const couple = `${data.groomName ?? "Groom"} & ${data.brideName ?? "Bride"}`;
  return <main className="invite royal">
    <MusicButton url={data.musicUrl}/>
    <section className="royal-opening"><div className="arch"><span>✦</span><small>WITH THE BLESSINGS OF OUR FAMILIES</small><h1>{couple}</h1><p>{data.date}</p><a href="#invitation">Enter Invitation</a></div></section>
    <section id="invitation" className="royal-hero"><div className="royal-overlay"/><div className="royal-hero-content"><div className="eyebrow">A Royal Celebration</div><h1>{couple}</h1><p>{data.welcomeMessage ?? "Two families, one beautiful beginning."}</p></div></section>
    <div className="container">
      {(data.story || data.welcomeMessage) && <Section eyebrow="Our Beginning" title="A story worth celebrating">{data.story && <p className="lead">{data.story}</p>}{data.welcomeMessage && <p className="lead">{data.welcomeMessage}</p>}</Section>}
      <Section eyebrow="The Celebrations" title="Join us"><EventTimeline events={data.events}/></Section>
      <Section eyebrow="Until we say I do" title="The countdown"><Countdown date={data.countdownAt}/></Section>
      {data.gallery.length > 0 && <Section eyebrow="Moments"><Gallery images={data.gallery}/></Section>}
      <Section eyebrow="The Celebration" title={data.venue ?? "Our Venue"}><p className="lead">{data.address}</p>{data.mapUrl && <a className="cta" href={data.mapUrl} target="_blank" rel="noreferrer">Open Map</a>}</Section>
      {data.rsvpEnabled && <Section eyebrow="We would love to see you" title="RSVP">{data.rsvp}</Section>}
    </div>
    <footer className="footer">Forever begins here ✦</footer>
  </main>;
}