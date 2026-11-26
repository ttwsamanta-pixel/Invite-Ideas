'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import type { CinematicOpeningConfig, Invitation } from '../lib/data'
import './cinematic-opening.css'

const text = {
  en: { open: 'Open invitation', skip: 'Skip opening' },
  bn: { open: 'আমন্ত্রণ খুলুন', skip: 'সরাসরি আমন্ত্রণ দেখুন' },
  hi: { open: 'निमंत्रण खोलें', skip: 'सीधे निमंत्रण देखें' },
}

export function CinematicOpening({ opening, names, title, language, onComplete }: {
  opening: CinematicOpeningConfig
  names: string
  title: string
  language: Invitation['language']
  onComplete: () => void
}) {
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finishForPreference = () => { if (preference.matches) onComplete() }
    preference.addEventListener('change', finishForPreference)
    const timer = window.setTimeout(onComplete, opening.duration)
    return () => {
      window.clearTimeout(timer)
      preference.removeEventListener('change', finishForPreference)
    }
  }, [opening.duration, onComplete, playing])
  const copy = text[language]
  const start = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) onComplete()
    else setPlaying(true)
  }
  const caption = <><span>{title}</span><b>{names}</b></>
  const scenes = {
    envelope: <div className="ii-envelope-stage"><div className="ii-envelope"><div className="ii-envelope-flap" /><div className="ii-envelope-pocket" /><div className="ii-wax-seal">✦</div><div className="ii-letter"><span>{title}</span><strong>{names}</strong></div></div></div>,
    'royal-gate': <div className="ii-gate-arch"><div className="ii-gate-glow" /><div className="ii-gate-title">{caption}</div><div className="ii-gate-left" /><div className="ii-gate-right" /></div>,
    'floral-curtain': <><div className="ii-curtain ii-curtain-left" /><div className="ii-curtain ii-curtain-right" /><div className="ii-floral-center">{caption}</div><div className="ii-petals">✦ ❀ ✧ ❀ ✦</div></>,
    'mirror-reveal': <div className="ii-mirror-frame"><div className="ii-mirror-light" /><div className="ii-mirror-content">{caption}</div></div>,
    parchment: <div className="ii-scroll"><div className="ii-scroll-top" /><div className="ii-scroll-paper">{caption}</div><div className="ii-scroll-bottom" /></div>,
  }
  const className = { envelope: 'envelope', 'royal-gate': 'gate', 'floral-curtain': 'floral', 'mirror-reveal': 'mirror', parchment: 'parchment' }[opening.type]
  const ratio = opening.duration / 4400
  return <section aria-label={copy.open} className="cinematic-opening" lang={language}>
    <div className={'ii-opening ii-' + className + '-opening'} data-playing={playing} style={{ '--opening-ratio': ratio } as CSSProperties}>
      <div className="cinematic-scene" aria-hidden="true">{scenes[opening.type]}</div>
      <div className="cinematic-controls">
        {!playing && <button type="button" onClick={start}>{copy.open}</button>}
        <button type="button" onClick={onComplete}>{copy.skip}</button>
      </div>
    </div>
  </section>
}
