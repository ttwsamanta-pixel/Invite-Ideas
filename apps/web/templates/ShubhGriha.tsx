"use client";
import { Countdown, MusicButton, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";
import "./batch-three.css";
import "./batch3-home.css";

export default function ShubhGriha({ data }: { data: InvitationData }) {

 useReveal();
 return <main className="ii-page home-page">
  <section className="home-hero"><div className="home-gate"><div className="ii-eyebrow">A new address, a new beginning</div><h1>{data.title}</h1>{data.names && <p>{data.names}</p>}<p>{data.date} · {data.events[0]?.time}</p><div className="home-arch">⌂</div></div></section>
  <div className="ii-reveal" data-reveal><section className="ii-section home-welcome"><div className="ii-wrap"><div className="ii-eyebrow">Griha Pravesh</div><h2 className="ii-title">Come bless our new beginning.</h2><p className="ii-copy">{data.story || "A home becomes a home when it is filled with family, laughter, prayers and warm memories. We would love to welcome you."}</p></div></section></div>
  <section className="ii-section home-count"><div className="ii-wrap"><div className="ii-eyebrow">The auspicious moment</div><Countdown date={data.countdownAt}/></div></section>
  <section className="ii-section"><div className="ii-wrap"><div className="ii-eyebrow">Ceremony</div><h2 className="ii-title">Join us</h2><div className="ii-events">{data.events.map((e,i)=><article className="ii-event" key={e.id||i}><h3>{e.title}</h3><p>{e.date} {e.time}</p><p>{e.venue}</p><p>{e.address}</p>{e.mapUrl && <a href={e.mapUrl} target="_blank" rel="noreferrer">Directions</a>}</article>)}</div></div></section>
  {data.gallery.length>0&&<section className="ii-section home-gallery"><div className="ii-wrap"><div className="ii-eyebrow">Our new space</div><h2 className="ii-title">A glimpse inside</h2><div className="ii-gallery">{data.gallery.map((url,i)=><img key={url+i} src={url} alt="" loading="lazy"/>)}</div></div></section>}
  <section className="ii-section home-venue"><div className="ii-wrap"><div className="ii-eyebrow">Our address</div><h2 className="ii-title">{data.venue || "Our New Home"}</h2><p className="ii-copy">{data.address}</p>{data.mapUrl&&<a href={data.mapUrl} target="_blank" rel="noreferrer">Find us →</a>}</div></section>
  {data.welcomeMessage && <section className="ii-section"><div className="ii-wrap"><p className="ii-copy">{data.welcomeMessage}</p></div></section>}
  {data.guestDetails.some(field => field.key !== "age") && <section className="ii-section"><div className="ii-wrap"><dl className="batch-three-details">{data.guestDetails.filter(field => field.key !== "age").map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></div></section>}
  {data.rsvpEnabled && <div className="ii-wrap batch-three-rsvp">{data.rsvp}</div>}
  <section className="home-end"><div className="ii-eyebrow">With blessings</div><h2>May this home<br/>always be full of joy.</h2></section>
  <MusicButton url={data.musicUrl}/>
 </main>
}
