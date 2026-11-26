"use client";
import "./editorial.css";
import { Countdown, EventTimeline, Gallery, MusicButton, Section, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";

export default function ModernEditorialWedding({ data }: { data: InvitationData }) {
  useReveal();
  return <main className="invite editorial">
    <MusicButton url={data.musicUrl}/>
    <section className="editorial-opening"><div className="opening-number">01</div><div><div className="eyebrow">THE WEDDING OF</div><h1>{data.groomName ?? data.title}<br/><span>&</span><br/>{data.brideName ?? ""}</h1><p>{data.date}</p></div><a href="#editorial-invite">Scroll to begin ↓</a></section>
    <section id="editorial-invite" className="editorial-hero"><div className="hero-image" style={{backgroundImage:`url(${data.gallery[0] ?? data.artwork ?? ""})`}}/><div className="hero-copy"><div className="eyebrow">A New Chapter</div><h1>Made of moments.</h1></div></section>
    <div className="container">
      {(data.story || data.welcomeMessage) && <Section eyebrow="Chapter 01" title="How we got here">{data.story && <p className="lead">{data.story}</p>}{data.welcomeMessage && <p className="lead">{data.welcomeMessage}</p>}</Section>}
      <Section eyebrow="Chapter 02" title="The day"><EventTimeline events={data.events}/></Section>
      <Section eyebrow="Chapter 03" title="Almost time"><Countdown date={data.countdownAt}/></Section>
      {data.gallery.length > 0 && <Section eyebrow="Chapter 04" title="Frames from us"><Gallery images={data.gallery}/></Section>}
      <Section eyebrow="Chapter 05" title={data.venue ?? "Meet us there"}><p className="lead">{data.address}</p>{data.mapUrl && <a className="cta" href={data.mapUrl} target="_blank" rel="noreferrer">Open Map</a>}</Section>
      {data.rsvpEnabled && <Section eyebrow="Final Chapter" title="Will you be there?">{data.rsvp}</Section>}
    </div>
    <footer className="footer">And then, forever.</footer>
  </main>;
}