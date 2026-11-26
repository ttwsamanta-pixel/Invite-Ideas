"use client";

import { useEffect, useRef, useState } from "react";
import type { InvitationData } from "./adapter";

export function useReveal() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".batch-render [data-reveal]"));
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      }),
      { threshold: 0.12 }
    );
    items.forEach(item => { item.dataset.revealReady = ""; observer.observe(item); });
    return () => observer.disconnect();
  }, []);
}

export function Countdown({ date }: { date?: string }) {
  const [text, setText] = useState("00 : 00 : 00 : 00");
  useEffect(() => {
    if (!date) return;
    const target = new Date(date).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor(diff / 3600000) % 24;
      const m = Math.floor(diff / 60000) % 60;
      const s = Math.floor(diff / 1000) % 60;
      setText(`${String(d).padStart(2,"0")} : ${String(h).padStart(2,"0")} : ${String(m).padStart(2,"0")} : ${String(s).padStart(2,"0")}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [date]);
  return <div className="countdown">{text}</div>;
}

export function MusicButton({ url }: { url?: string }) {
  const player = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  if (!url) return null
  return <div>
    <audio key={url} ref={player} src={url} preload="none" onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setPlaying(false)} />
    <button type="button" className="music-button" aria-label={playing ? "Pause music" : "Play music"} onClick={() => {
      const audio = player.current
      if (!audio) return
      if (audio.paused) void audio.play().catch(() => setPlaying(false))
      else audio.pause()
    }}>{playing ? "Ⅱ" : "♫"}</button>
  </div>
}

export function Section({ eyebrow, title, children, className="" }: { eyebrow?: string; title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`ii-section ${className}`} data-reveal>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}

export function Gallery({ images }: { images: string[] }) {
  return (
    <div className="gallery">
      {images.map((src, i) => <div className={`gallery-item g${i+1}`} key={src+i}><img src={src} alt="" loading="lazy"/></div>)}
    </div>
  );
}

export function EventTimeline({ events }: { events: InvitationData["events"] }) {
  return (
    <div className="timeline">
      {events.map((event, i) => (
        <article className="timeline-item" key={event.id}>
          <div className="timeline-dot">{String(i+1).padStart(2,"0")}</div>
          <div>
            <div className="event-date">{event.date}{event.time ? ` · ${event.time}` : ""}</div>
            <h3>{event.title}</h3>
            {event.venue && <p>{event.venue}</p>}
            {event.address && <small>{event.address}</small>}
            {event.mapUrl && <p><a href={event.mapUrl} target="_blank" rel="noreferrer">Directions</a></p>}
          </div>
        </article>
      ))}
    </div>
  );
}