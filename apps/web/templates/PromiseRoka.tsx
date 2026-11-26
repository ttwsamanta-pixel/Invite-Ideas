"use client";
import { Countdown, MusicButton, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";
import "./batch-three.css";
import "./batch3-roka.css";

export default function PromiseRoka({ data }: { data: InvitationData }) {


 useReveal();
 return <main className="ii-page roka-page">
  <section className="roka-cover">
   <div className="roka-orbit"/><div className="roka-cover-inner">
    <div className="ii-eyebrow">A new chapter begins</div>
    <h1>{data.brideName} <span>&amp;</span> {data.groomName}</h1>
    <p>{data.title}</p>
    <div className="roka-date">{data.date || "Save the date"} · {data.events[0]?.time || ""}</div>
   </div>
  </section>
  <div className="ii-reveal" data-reveal><section className="ii-section roka-intro"><div className="ii-wrap"><div className="ii-eyebrow">The Promise</div><h2 className="ii-title">Two stories.<br/>One beautiful beginning.</h2><p className="ii-copy">{data.story || "With our families beside us and hearts full of happiness, we invite you to celebrate the beginning of our forever."}</p></div></section></div>
  <section className="ii-section roka-count"><div className="ii-wrap"><div className="ii-eyebrow">Counting down to us</div><Countdown date={data.countdownAt}/></div></section>
  <section className="ii-section roka-events"><div className="ii-wrap"><div className="ii-eyebrow">Celebration</div><h2 className="ii-title">The moments</h2><div className="ii-events">{data.events.map((e,i)=><article className="ii-event" key={e.id||i}><h3>{e.title}</h3><p>{e.date} {e.time}</p><p>{e.venue}</p><p>{e.address}</p>{e.mapUrl && <a href={e.mapUrl} target="_blank" rel="noreferrer">Directions</a>}</article>)}</div></div></section>
  {data.gallery.length>0&&<section className="ii-section"><div className="ii-wrap"><div className="ii-eyebrow">A few memories</div><h2 className="ii-title">Us, in frames.</h2><div className="ii-gallery">{data.gallery.map((url,i)=><img key={url+i} src={url} alt="" loading="lazy"/>)}</div></div></section>}
  <section className="ii-section roka-venue"><div className="ii-wrap"><div className="ii-eyebrow">Join us</div><h2 className="ii-title">{data.venue || "The Celebration Venue"}</h2><p className="ii-copy">{data.address}</p>{data.mapUrl&&<a href={data.mapUrl} target="_blank" rel="noreferrer">Open map →</a>}</div></section>
  {data.welcomeMessage && <section className="ii-section"><div className="ii-wrap"><p className="ii-copy">{data.welcomeMessage}</p></div></section>}
  {data.guestDetails.some(field => field.key !== "age") && <section className="ii-section"><div className="ii-wrap"><dl className="batch-three-details">{data.guestDetails.filter(field => field.key !== "age").map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></div></section>}
  {data.rsvpEnabled && <div className="ii-wrap batch-three-rsvp">{data.rsvp}</div>}
  <section className="roka-end"><h2>With love,<br/>{data.brideName} &amp; {data.groomName}</h2></section>
  <MusicButton url={data.musicUrl}/>
 </main>;
}
