"use client";
import "./salt-sunset.css";
import { Countdown, EventTimeline, Gallery, MusicButton, Section, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";

export default function SaltSunset({ data }: { data: InvitationData }) {
  useReveal();
  return <main className="invite batch-two sunset" style={data.artwork ? { backgroundImage: "url(" + data.artwork + ")" } : undefined}>
    <MusicButton url={data.musicUrl} />
    <section className="sunset-opening"><div className="sunset-noise"/><div className="container sunset-opening-copy"><div className="eyebrow">A destination wedding story</div><h1>{data.groomName}<span> × </span>{data.brideName}</h1><p>{data.venue ?? "By the sea"} · {data.date}</p><a href="#sunset-invite">Begin the story</a></div></section>
    <section id="sunset-invite" className="sunset-hero"><div className="sunset-image"/><div className="container"><div className="eyebrow">Salt &amp; Sunset</div><h2>Come away<br/><em>with us.</em></h2><p className="lead">{data.welcomeMessage ?? "Pack light, bring your favourite people, and meet us where the horizon turns gold."}</p></div></section>
    <div className="container">
      {data.story && <Section eyebrow="The story" title="Two people. One horizon."><p className="lead">{data.story}</p></Section>}
      <Section eyebrow="Weekend itinerary" title="The celebrations"><EventTimeline events={data.events}/></Section>
      <Section eyebrow="Until we meet" title="Countdown to the coast"><Countdown date={data.countdownAt}/></Section>
      {data.gallery.length > 0 && <Section eyebrow="The postcard album" title="Frames from our story"><Gallery images={data.gallery}/></Section>}
      <Section eyebrow="Stay &amp; arrive" title={data.venue ?? "Destination venue"}><p className="lead">{data.address}</p>{data.mapUrl && <a className="cta sunset-cta" href={data.mapUrl} target="_blank" rel="noreferrer">Open directions</a>}</Section>
      {data.guestDetails.length > 0 && <Section title="Guest information"><dl className="batch-two-details">{data.guestDetails.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></Section>}
      {data.rsvpEnabled && <Section eyebrow="Travel with us" title="Save your seat"><p className="lead">{data.welcomeMessage ?? "Please RSVP so we can help with your stay, transfers and celebration plans."}</p>{data.rsvp}</Section>}
    </div>
    <footer className="sunset-footer"><div>See you where the sky meets the sea.</div><p>{data.groomName} &amp; {data.brideName}</p></footer>
  </main>;
}
