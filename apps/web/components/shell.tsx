'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useFavorites = create<{ ids: string[]; toggle: (id: string) => void }>()(persist(set => ({
  ids: [], toggle: id => set(state => ({ ids: state.ids.includes(id) ? state.ids.filter(key => key !== id) : [...state.ids, id] })),
}), { name: 'inviteideas-favorites', skipHydration: true }))

export function Brand() {
  return <Link className="brand" href="/" aria-label="InviteIdeas home">
    <Image className="brand-image" src="/images/brand.png" width={190} height={62} alt="InviteIdeas" unoptimized />

  </Link>
}
const links = [['Home', '/'], ['Templates', '/templates'], ['Occasions', '/#occasions'], ['How It Works', '/#how-it-works'], ['Pricing', '/pricing'], ['Blog', '/blog'], ['Contact', '/contact']]
export function Header() {
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  return <header className="header">
    <div className="wrap nav">
      <Brand />
      <nav aria-label="Main navigation" className={menu ? 'nav-links open' : 'nav-links'}>{links.map(([label, href]) => <Link href={href} key={href} onClick={() => setMenu(false)}>{label}</Link>)}
        <Link href="/login" className="mobile-sign" onClick={() => setMenu(false)}>Sign in</Link>
      </nav>
      <div className="nav-actions">
        <button className="icon-btn" aria-label={search ? 'Close search' : 'Search templates'} aria-expanded={search} onClick={() => setSearch(!search)}>{search ? <X /> : <Search />}</button>
        <Link className="icon-btn desktop-action" href="/templates?saved=1" aria-label="Saved templates"><Heart /></Link>
        <Link className="icon-btn desktop-action" href="/dashboard" aria-label="Invitation orders"><ShoppingBag /></Link>
        <Link className="button small desktop-action" href="/login"><UserRound size={16} /> Sign in</Link>
        <button className="button menu-button" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
      </div>
    </div>
    {search && <form action="/templates" className="wrap search-panel"><input autoFocus name="q" aria-label="Search templates" placeholder="Search templates, e.g. Bengali Wedding" /><button className="button">Search</button></form>}
  </header>
}
export function Footer({ description }: { description: string }) {
  return <footer className="footer"><div className="wrap footer-grid">
    <div><Brand /><p>{description}</p></div>
    <div><strong>Explore</strong><Link href="/templates/bengali-wedding">Bengali Wedding</Link><Link href="/templates">All templates</Link><Link href="/pricing">Pricing</Link></div>
    <div><strong>InviteIdeas</strong><Link href="/#how-it-works">How It Works</Link><Link href="/blog">Blog</Link><Link href="/contact">Contact</Link><Link href="/about">About</Link></div>
    <div><strong>Account & help</strong><Link href="/dashboard">My invitations</Link><Link href="/faq">FAQ</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link></div>
  </div><div className="wrap copyright">© {new Date().getFullYear()} InviteIdeas</div></footer>
}
