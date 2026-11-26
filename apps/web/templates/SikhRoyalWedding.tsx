"use client";
import "./sikh.css";
import { Countdown, EventTimeline, Gallery, MusicButton, Section, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";

export default function SikhRoyalWedding({ data }: { data: InvitationData }) {
  useReveal();
  return <main className="invite sikh">
    <MusicButton url={data.musicUrl}/>
    <section className="sikh-opening"><div className="khanda">☬</div><div className="eyebrow">AANAND KARAJ</div><h1>{data.groomName ?? "Groom"}<span>&</span>{data.brideName ?? "Bride"}</h1><p>{data.date}</p><a className="cta light" href="#sikh-invite">Enter</a></section>
    <section id="sikh-invite" className="sikh-hero"><div className="container"><div className="eyebrow">With Waheguru's Blessings</div><h1>{data.groomName ?? "Groom"} & {data.brideName ?? "Bride"}</h1><p>{data.welcomeMessage ?? "Together with our families, we invite you to celebrate our Anand Karaj."}</p></div></section>
    <div className="container">
      {(data.story || data.welcomeMessage) && <Section eyebrow="Our Journey" title="Two hearts, one path">{data.story && <p className="lead">{data.story}</p>}{data.welcomeMessage && <p className="lead">{data.welcomeMessage}</p>}</Section>}
      <Section eyebrow="Celebration" title="Events"><EventTimeline events={data.events}/></Section>
      <Section eyebrow="The big day" title="Countdown"><Countdown date={data.countdownAt}/></Section>
      {data.gallery.length > 0 && <Section eyebrow="Captured memories"><Gallery images={data.gallery}/></Section>}
      <Section eyebrow="Venue" title={data.venue ?? "Gurdwara"}><p className="lead">{data.address}</p>{data.mapUrl && <a className="cta" href={data.mapUrl} target="_blank" rel="noreferrer">Directions</a>}</Section>
      {data.rsvpEnabled && <Section eyebrow="Join us" title="RSVP">{data.rsvp}</Section>}
    </div>
    <footer className="footer">Waheguru • Love • Family</footer>
  </main>;
}