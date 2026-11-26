"use client";
import "./bengali.css";
import { Countdown, EventTimeline, Gallery, MusicButton, Section, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";

export default function BengaliHeritageWedding({ data }: { data: InvitationData }) {
  useReveal();
  return <main className="invite bengali">
    <MusicButton url={data.musicUrl}/>
    <section className="alpona-opening"><div className="alpona-ring">শুভ বিবাহ</div><div className="bengali-names">{data.groomName ?? "বর"} <span>♥</span> {data.brideName ?? "কনে"}</div><a href="#bengali-invite">আমন্ত্রণ</a></section>
    <section id="bengali-invite" className="bengali-hero"><div className="container"><div className="eyebrow">শুভ বিবাহ</div><h1>{data.groomName ?? "বর"}<br/><i>ও</i><br/>{data.brideName ?? "কনে"}</h1><p>{data.date}</p></div></section>
    <div className="container">
      {(data.story || data.welcomeMessage) && <Section eyebrow="আমাদের গল্প" title="দুই হৃদয়, এক পথ">{data.story && <p className="lead">{data.story}</p>}{data.welcomeMessage && <p className="lead">{data.welcomeMessage}</p>}</Section>}
      <Section eyebrow="অনুষ্ঠানসূচি" title="Celebrations"><EventTimeline events={data.events}/></Section>
      <Section eyebrow="শুভ লগ্ন" title="Counting the moments"><Countdown date={data.countdownAt}/></Section>
      {data.gallery.length > 0 && <Section eyebrow="স্মৃতির পাতা"><Gallery images={data.gallery}/></Section>}
      <Section eyebrow="ঠিকানা" title={data.venue ?? "Venue"}><p className="lead">{data.address}</p>{data.mapUrl && <a className="cta" href={data.mapUrl} target="_blank" rel="noreferrer">Map দেখুন</a>}</Section>
      {data.rsvpEnabled && <Section eyebrow="আপনাদের জন্য" title="RSVP">{data.rsvp}</Section>}
    </div>
    <footer className="footer">শুভ বিবাহ • ভালোবাসা • আশীর্বাদ</footer>
  </main>;
}