"use client";
import { Countdown, MusicButton, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";
import "./batch-three.css";
import "./batch3-birthday.css";

export default function MidnightBirthday({ data }: { data: InvitationData }) {

 const age = data.guestDetails.find(field => field.key === "age")?.value;
 useReveal();
 return <main className="ii-page bday-page">
  <section className="bday-hero"><div className="bday-stars"/><div className="bday-hero-content"><div className="ii-eyebrow">Tonight, we celebrate</div><h1>{data.names}</h1>{data.title && <p>{data.title}</p>}{age && <div className="bday-number">{age}<span>years</span></div>}<p>{data.date} · {data.events[0]?.time}</p></div></section>
  <div className="ii-reveal" data-reveal><section className="ii-section"><div className="ii-wrap bday-center"><div className="ii-eyebrow">A little note</div><h2 className="ii-title">Come make a memory.</h2><p className="ii-copy">{data.story || "Good people, great music, delicious food and one more reason to celebrate. Your presence is the gift."}</p></div></section></div>
  <section className="ii-section bday-count"><div className="ii-wrap"><div className="ii-eyebrow">Party starts in</div><Countdown date={data.countdownAt}/></div></section>
  <section className="ii-section"><div className="ii-wrap"><div className="ii-eyebrow">The plan</div><h2 className="ii-title">Party details</h2><div className="ii-events">{data.events.map((e,i)=><article className="ii-event" key={e.id||i}><h3>{e.title}</h3><p>{e.date} {e.time}</p><p>{e.venue}</p><p>{e.address}</p>{e.mapUrl && <a href={e.mapUrl} target="_blank" rel="noreferrer">Directions</a>}</article>)}</div></div></section>
  {data.gallery.length>0&&<section className="ii-section bday-gallery"><div className="ii-wrap"><div className="ii-eyebrow">The good times</div><h2 className="ii-title">Snapshots</h2><div className="ii-gallery">{data.gallery.map((url,i)=><img key={url+i} src={url} alt="" loading="lazy"/>)}</div></div></section>}
  <section className="ii-section bday-venue"><div className="ii-wrap"><div className="ii-eyebrow">Where</div><h2 className="ii-title">{data.venue || "The Party"}</h2><p className="ii-copy">{data.address}</p>{data.mapUrl&&<a href={data.mapUrl} target="_blank" rel="noreferrer">Get directions →</a>}</div></section>
  {data.welcomeMessage && <section className="ii-section"><div className="ii-wrap"><p className="ii-copy">{data.welcomeMessage}</p></div></section>}
  {data.guestDetails.some(field => field.key !== "age") && <section className="ii-section"><div className="ii-wrap"><dl className="batch-three-details">{data.guestDetails.filter(field => field.key !== "age").map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></div></section>}
  {data.rsvpEnabled && <div className="ii-wrap batch-three-rsvp">{data.rsvp}</div>}
  <section className="bday-end"><div><div className="ii-eyebrow">See you there</div><h2>Let’s make<br/>this night legendary.</h2></div></section>
  <MusicButton url={data.musicUrl}/>
 </main>
}
