'use client'

import { useState } from 'react'
import type { Invitation } from '../lib/data'

const copy = {
  en: { title: 'A wedding invitation for you', open: 'Open invitation' },
  bn: { title: 'আপনার জন্য বিবাহের আমন্ত্রণ', open: 'আমন্ত্রণ খুলুন' },
  hi: { title: 'आपके लिए विवाह का निमंत्रण', open: 'निमंत्रण खोलें' },
}

export function EnvelopeOpening({ names, language, onOpen }: {
  names: string
  language: Invitation['language']
  onOpen: () => void
}) {
  const [opening, setOpening] = useState(false)
  const text = copy[language]
  const initials = names.trim().split(/\s+(?:&|and|ও|और)\s+/i)
    .slice(0, 2).map(name => Array.from(name.trim())[0]).filter(Boolean).join(' · ')

  function openEnvelope() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) onOpen()
    else setOpening(true)
  }

  return <section className="envelope-opening" lang={language}>
    <h1>{text.title}</h1>
    <button type="button" className="envelope-trigger" data-opening={opening} aria-label={text.open} aria-disabled={opening}
      onClick={() => { if (!opening) openEnvelope() }}>
      <span className="envelope-art" aria-hidden="true">
        <span className="envelope-back" />
        <span className="envelope-letter" onAnimationEnd={event => {
          if (opening && event.animationName === 'invitation-letter-rise') onOpen()
        }}><span>{names}</span></span>
        <span className="envelope-pocket" />
        <span className="envelope-flap" />
        <span className="envelope-seal">{initials}</span>
      </span>
      <span className="envelope-action">{text.open}</span>
    </button>
  </section>
}
