"use client";
import { Countdown, MusicButton, useReveal } from "./InvitationPrimitives";
import type { InvitationData } from "./adapter";
import "./batch-three.css";
import "./batch3-anniversary.css";

export default function ForeverUs({ data }: { data: InvitationData }) {

 useReveal();
 return <main className="ii-page anniv-page">
  <section className="anniv-hero"><div className="anniv-inner"><div className="ii-eyebrow">Still choosing you</div><h1>{data.brideName} <span>&amp;</span> {data.groomName}</h1><p>{data.title}</p><div className="anniv-ring">∞</div></div></section>
  <div className="ii-reveal" data-reveal><section className="ii-section"><div className="ii-wrap anniv-center"><div className="ii-eyebrow">Our story</div><h2 className="ii-title">Years pass.<br/>The feeling stays.</h2><p className="ii-copy">{data.story || "For every ordinary morning, every impossible laugh, every difficult day and every beautiful memory — thank you for choosing us."}</p></div></section></div>
  <section className="ii-section anniv-count"><div className="ii-wrap"><div className="ii-eyebrow">Another beautiful chapter</div><Countdown date={data.countdownAt}/></div></section>
  <section className="ii-section"><div className="ii-wrap"><div className="ii-eyebrow">Celebrate with us</div><h2 className="ii-title">The evening</h2><div className="ii-events">{data.events.map((e,i)=><article className="ii-event" key={e.id||i}><h3>{e.title}</h3><p>{e.date} {e.time}</p><p>{e.venue}</p><p>{e.address}</p>{e.mapUrl && <a href={e.mapUrl} target="_blank" rel="noreferrer">Directions</a>}</article>)}</div></div></section>
  {data.gallery.length>0&&<section className="ii-section anniv-gallery"><div className="ii-wrap"><div className="ii-eyebrow">Then &amp; now</div><h2 className="ii-title">Our memories</h2><div className="ii-gallery">{data.gallery.map((url,i)=><img key={url+i} src={url} alt="" loading="lazy"/>)}</div></div></section>}
  <section className="ii-section anniv-venue"><div className="ii-wrap"><div className="ii-eyebrow">Where we'll gather</div><h2 className="ii-title">{data.venue || "The Celebration"}</h2><p className="ii-copy">{data.address}</p>{data.mapUrl&&<a href={data.mapUrl} target="_blank" rel="noreferrer">Open map →</a>}</div></section>
  {data.welcomeMessage && <section className="ii-section"><div className="ii-wrap"><p className="ii-copy">{data.welcomeMessage}</p></div></section>}
  {data.guestDetails.some(field => field.key !== "age") && <section className="ii-section"><div className="ii-wrap"><dl className="batch-three-details">{data.guestDetails.filter(field => field.key !== "age").map(field => <div key={field.key}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}</dl></div></section>}
  {data.rsvpEnabled && <div className="ii-wrap batch-three-rsvp">{data.rsvp}</div>}
  <section className="anniv-end"><h2>Forever is<br/>our favorite word.</h2></section>
  <MusicButton url={data.musicUrl}/>
 </main>
}
