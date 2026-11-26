"use client";
import "./alpona-silk.css";
import { Countdown, EventTimeline, Gallery, MusicButton, Section, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";

export default function AlponaSilk({ data }: { data: InvitationData }) {
  useReveal();
  return <main className="invite batch-two alpona-silk" style={data.artwork ? { backgroundImage: "url(" + data.artwork + ")" } : undefined}>
    <MusicButton url={data.musicUrl} />
    <section className="alpona-opening"><div className="alpona-lines"/><div className="alpona-opening-copy"><div className="bengali-mark">শুভ বিবাহ</div><h1>{data.groomName}<span> ও </span>{data.brideName}</h1><p>{data.date ?? "একটি শুভ দিন"}</p><a href="#alpona-invite">আমন্ত্রণ</a></div></section>
    <section id="alpona-invite" className="alpona-hero"><div className="silk-ribbon"/><div className="container"><div className="eyebrow">আলপনা • সিল্ক • ভালোবাসা</div><h2>দুই পরিবার,<br/><em>একটি নতুন গল্প</em></h2><p className="lead">{data.welcomeMessage ?? "আমাদের জীবনের এই শুভ অধ্যায়ে আপনাদের স্নেহ, আশীর্বাদ ও উপস্থিতি আমাদের সবচেয়ে বড় পাওয়া।"}</p></div></section>
    <div className="container">
      {data.story && <Section eyebrow="আমাদের গল্প" title="একসাথে পথচলা"><p className="lead">{data.story}</p></Section>}
      <Section eyebrow="অনুষ্ঠানসূচি" title="শুভ আয়োজন"><EventTimeline events={data.events}/></Section>
      <Section eyebrow="শুভ লগ্ন" title="অপেক্ষার শেষ প্রহর"><Countdown date={data.countdownAt}/></Section>
      {data.gallery.length > 0 && <Section eyebrow="স্মৃতির অ্যালবাম" title="আমাদের মুহূর্ত"><Gallery images={data.gallery}/></Section>}
      <Section eyebrow="স্থান" title={data.venue ?? "অনুষ্ঠানের ঠিকানা"}><p className="lead">{data.address}</p>{data.mapUrl && <a className="cta alpona-cta" href={data.mapUrl} target="_blank" rel="noreferrer">মানচিত্র দেখুন</a>}</Section>
      {data.guestDetails.length > 0 && <Section title="Guest information"><dl className="batch-two-details">{data.guestDetails.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></Section>}
      {data.rsvpEnabled && <Section eyebrow="আপনাদের অপেক্ষায়" title="উপস্থিতি জানান">{data.rsvp}</Section>}
    </div>
    <footer className="alpona-footer"><div>শুভ বিবাহ</div><p>ভালোবাসা • আশীর্বাদ • আনন্দ</p></footer>
  </main>;
}
