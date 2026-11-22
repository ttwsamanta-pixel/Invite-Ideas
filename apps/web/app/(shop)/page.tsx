import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, CirclePlay, Grid2X2, Infinity as InfinityIcon, Pencil, QrCode, Send, ShieldCheck, Smartphone, Zap } from 'lucide-react'
import { Market, Occasions } from '../../components/market'
import { categories, demoCatalog, serverApi, type Template } from '../../lib/data'

export default async function Home() {
  const [templates, occasions] = await Promise.all([serverApi<Template[]>('/templates'), serverApi<typeof categories>('/categories')])
  const lead = (item: Template) => item.categoryId === 'bengali-wedding' ? -1 : item.categoryId === 'annaprashan' ? 1 : 0
  const featured = templates ? templates.filter(item => item.featured).sort((a, b) => lead(a) - lead(b)) : demoCatalog
  return <>
    <section className="hero">
      <div className="hero-art"><Image src="/images/hero.webp" alt="Bengali wedding invitation on a phone, framed by brass, flowers and red silk" fill priority sizes="(max-width: 767px) 100vw, 65vw" /></div>
      <div className="wrap hero-inner"><div className="hero-copy">
        <p className="eyebrow">DIGITAL INVITATIONS FOR EVERY CELEBRATION</p>
        <h1>Bengali Wedding <em>Invitation Templates</em></h1>
        <p>Create a beautiful digital wedding invitation with traditional Bengali designs, rich visuals and modern features.</p>
        <div className="hero-buttons"><Link className="button" href="/templates/bengali-wedding">Explore Bengali Wedding <ArrowRight size={18} /></Link><Link className="button outline" href="#how-it-works"><CirclePlay size={18} /> How It Works</Link></div>
        <div className="hero-features"><span><Smartphone /> Mobile friendly</span><span><Pencil /> Customizable</span><span><QrCode /> Link & QR code</span></div>
      </div></div>
    </section>
    <Occasions />
    <Market templates={featured} allCategories={occasions || categories} home />
    <section className="steps" id="how-it-works"><div className="wrap steps-inner">
      <div><h2>How It Works</h2><p>Create your invitation in three steps.</p></div>
      {[[Grid2X2, 'Choose a template', 'Explore designs for your occasion.'], [Pencil, 'Customize your invitation', 'Add your names, photos, venues and events.'], [Send, 'Pay & share', 'Get your invitation link and QR code after payment.']].map(([Icon, title, description], index) => {
        const Glyph = Icon as typeof Pencil
        return <div className="step" key={String(title)}><span className="step-icon"><Glyph /></span><div><strong>{index + 1}. {String(title)}</strong><p>{String(description)}</p></div></div>
      })}
    </div></section>
    <section className="wrap benefits" aria-label="Invitation benefits">{[[InfinityIcon, 'One-time payment'], [Zap, 'Instant delivery'], [Smartphone, 'Mobile optimized'], [CheckCircle2, 'Customizable'], [ShieldCheck, 'Secure checkout']].map(([Icon, title]) => {
      const Glyph = Icon as typeof Pencil
      return <span key={String(title)}><Glyph size={22} /> {String(title)}</span>
    })}</section>
  </>
}
