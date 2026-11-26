"use client";
import { Countdown, MusicButton, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";
import "./batch-three.css";
import "./batch3-baby.css";

export default function LittleWonder({ data }: { data: InvitationData }) {

 useReveal();
 return <main className="ii-page baby-page">
  <section className="baby-hero"><div className="baby-moon"/><div className="baby-cloud c1"/><div className="baby-cloud c2"/><div className="baby-inner"><div className="ii-eyebrow">A tiny miracle is on the way</div><h1>{data.title}</h1>{data.names && <p>{data.names}</p>}<p>{data.date} · {data.events[0]?.time}</p></div></section>
  <div className="ii-reveal" data-reveal><section className="ii-section"><div className="ii-wrap baby-center"><div className="ii-eyebrow">With tiny toes &amp; a big hello</div><h2 className="ii-title">A new little story begins.</h2><p className="ii-copy">{data.story || "Join us as we gather with family and friends to celebrate the beautiful little soul who is already so loved."}</p></div></section></div>
  <section className="ii-section baby-count"><div className="ii-wrap"><div className="ii-eyebrow">Almost time</div><Countdown date={data.countdownAt}/></div></section>
  <section className="ii-section"><div className="ii-wrap"><div className="ii-eyebrow">Celebration details</div><h2 className="ii-title">Join us</h2><div className="ii-events">{data.events.map((e,i)=><article className="ii-event" key={e.id||i}><h3>{e.title}</h3><p>{e.date} {e.time}</p><p>{e.venue}</p><p>{e.address}</p>{e.mapUrl && <a href={e.mapUrl} target="_blank" rel="noreferrer">Directions</a>}</article>)}</div></div></section>
  {data.gallery.length>0&&<section className="ii-section"><div className="ii-wrap"><div className="ii-eyebrow">Our little journey</div><h2 className="ii-title">Sweet moments</h2><div className="ii-gallery">{data.gallery.map((url,i)=><img key={url+i} src={url} alt="" loading="lazy"/>)}</div></div></section>}
  <section className="ii-section baby-venue"><div className="ii-wrap"><div className="ii-eyebrow">Celebration venue</div><h2 className="ii-title">{data.venue || "A beautiful place"}</h2><p className="ii-copy">{data.address}</p>{data.mapUrl&&<a href={data.mapUrl} target="_blank" rel="noreferrer">View map →</a>}</div></section>
  {data.welcomeMessage && <section className="ii-section"><div className="ii-wrap"><p className="ii-copy">{data.welcomeMessage}</p></div></section>}
  {data.guestDetails.some(field => field.key !== "age") && <section className="ii-section"><div className="ii-wrap"><dl className="batch-three-details">{data.guestDetails.filter(field => field.key !== "age").map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></div></section>}
  {data.rsvpEnabled && <div className="ii-wrap batch-three-rsvp">{data.rsvp}</div>}
  <section className="baby-end"><h2>Little hands.<br/>Big love.</h2></section>
  <MusicButton url={data.musicUrl}/>
 </main>
}
