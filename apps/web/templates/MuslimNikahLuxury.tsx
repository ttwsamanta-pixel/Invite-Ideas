"use client";
import "./nikah.css";
import { Countdown, EventTimeline, Gallery, MusicButton, Section, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";

export default function MuslimNikahLuxury({ data }: { data: InvitationData }) {
  useReveal();
  return <main className="invite nikah">
    <MusicButton url={data.musicUrl}/>
    <section className="nikah-opening"><div className="ornament">۞</div><div className="eyebrow">BISMILLAH</div><h1>{data.groomName ?? "Groom"}<em>&</em>{data.brideName ?? "Bride"}</h1><p>{data.date}</p><a className="nikah-button" href="#nikah-invite">Enter Invitation</a></section>
    <section id="nikah-invite" className="nikah-hero"><div className="container"><div className="eyebrow">With love and blessings</div><h1>Two souls.<br/>One beautiful beginning.</h1><p>{data.welcomeMessage ?? "We invite you to join us as we begin our journey together."}</p></div></section>
    <div className="container">
      {(data.story || data.welcomeMessage) && <Section eyebrow="Our Story" title="Written in the stars">{data.story && <p className="lead">{data.story}</p>}{data.welcomeMessage && <p className="lead">{data.welcomeMessage}</p>}</Section>}
      <Section eyebrow="The Nikah & Walima" title="Our Events"><EventTimeline events={data.events}/></Section>
      <Section eyebrow="Until our day" title="Countdown"><Countdown date={data.countdownAt}/></Section>
      {data.gallery.length > 0 && <Section eyebrow="Moments"><Gallery images={data.gallery}/></Section>}
      <Section eyebrow="Celebration Venue" title={data.venue ?? "Venue"}><p className="lead">{data.address}</p>{data.mapUrl && <a className="nikah-button" href={data.mapUrl} target="_blank" rel="noreferrer">View Location</a>}</Section>
      {data.rsvpEnabled && <Section eyebrow="Your presence means a lot" title="RSVP">{data.rsvp}</Section>}
    </div>
    <footer className="footer">With duas & love</footer>
  </main>;
}