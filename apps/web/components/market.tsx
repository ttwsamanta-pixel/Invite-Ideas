'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Cake, CircleEllipsis, Eye, Gem, Heart, House, Lamp, Flower2, CookingPot, CircleDot, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { categories, matchesOccasion, money, type Template } from '../lib/data'
import { useFavorites } from './shell'

const icons = [CircleDot, Flower2, Gem, Cake, CookingPot, Lamp, House, Heart, CircleEllipsis]
export function Occasions() {
  return <section className="wrap occasion-strip" id="occasions" aria-label="Shop by occasion">
    {[...categories.slice(0, 8), { slug: '', name: 'More occasions' }].map(({ slug, name }, i) => {
      const Icon = icons[i]
      return <Link className={slug === 'bengali-wedding' ? 'occasion active' : 'occasion'} key={name} href={'/templates' + (slug ? '/' + slug : '')}><Icon size={28} strokeWidth={1.55} />{name}</Link>
    })}
  </section>
}
export function Card({ template, index }: { template: Template; index: number }) {
  const toggle = useFavorites(state => state.toggle)
  const saved = useFavorites(state => state.ids.includes(template.slug))
  const reduced = useReducedMotion()
  return <motion.article className="template-card" initial={false} whileHover={reduced ? undefined : { y: -4 }} transition={{ duration: 0.2 }}>
    <div className="card-image">
      <Link href={'/design/' + template.slug} tabIndex={-1} aria-hidden="true"><Image fill src={template.image} alt="" priority={index < 2} sizes="(max-width: 767px) 90vw, (max-width: 1279px) 40vw, 24vw" /></Link>
      {template.badge && <span className="badge">{template.badge}</span>}
      <button type="button" className="favorite" onClick={() => toggle(template.slug)} aria-label={'Save ' + template.name} aria-pressed={saved}><Heart size={16} fill={saved ? 'currentColor' : 'none'} /></button>
    </div>
    <div className="card-body">
      <div className="card-category">{template.category.name} <span>·</span> {template.style}</div>
      <h3><Link href={'/design/' + template.slug}>{template.name}</Link></h3>
      <p>{template.description}</p>
      <div className="price"><strong>{money(template.offerPrice)}</strong>{template.regularPrice > template.offerPrice && <del>{money(template.regularPrice)}</del>}</div>
      <div className="card-actions"><Link className="button outline small" href={'/preview/template/' + template.slug}><Eye size={15} /> Live Preview</Link><Link className="button small" href={'/editor/' + template.slug}>Use Template</Link></div>
    </div>
  </motion.article>
}
export function Market({ templates, allCategories = categories, home = false, initialCategory = '', query = '', saved = false }: { templates: Template[]; allCategories?: typeof categories; home?: boolean; initialCategory?: string; query?: string; saved?: boolean }) {
  const [category, setCategory] = useState(initialCategory)
  const [style, setStyle] = useState('')
  const [tier, setTier] = useState('')
  const [budget, setBudget] = useState('')
  const [sort, setSort] = useState('')
  const ids = useFavorites(state => state.ids)
  useEffect(() => { void useFavorites.persist.rehydrate() }, [])
  const filtered = templates.filter(item => matchesOccasion(item, category) && (!style || item.style === style) && (!tier || item.classification === tier) && (!budget || item.offerPrice <= Number(budget)) && (!saved || ids.includes(item.slug)) && (!query || (item.name + ' ' + item.category.name + ' ' + item.style + ' ' + item.description).toLowerCase().includes(query.toLowerCase())))
  if (sort === 'asc') filtered.sort((a, b) => a.offerPrice - b.offerPrice)
  if (sort === 'desc') filtered.sort((a, b) => b.offerPrice - a.offerPrice)
  if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name))
  return <section className="wrap market" id="templates">
    <div className="market-top">
      <div><p className="eyebrow">{home ? 'THE INVITATION COLLECTION' : 'FIND YOUR DESIGN'}</p>
        {home ? <h2>Featured Templates</h2> : <h1>{saved ? 'Saved templates' : query ? 'Search results' : allCategories.find(item => item.slug === initialCategory)?.name || 'Invitation Templates'}</h1>}
        <p>{query ? 'Showing results for “' + query + '”' : 'Handpicked invitation designs for your special occasions.'}</p></div>
      <div className="filters">
        <label>Occasion<select value={category} onChange={e => setCategory(e.target.value)}><option value="">All occasions</option>{allCategories.map(item => <option value={item.slug} key={item.slug}>{item.name}</option>)}</select></label>
        <label>Style<select value={style} onChange={e => setStyle(e.target.value)}><option value="">All styles</option>{[...new Set(templates.map(item => item.style))].map(option => <option key={option}>{option}</option>)}</select></label>
        <label>Collection<select value={tier} onChange={e => setTier(e.target.value)}><option value="">All tiers</option>{["Basic", "Standard", "Premium", "Luxury"].map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Price<select value={budget} onChange={e => setBudget(e.target.value)}><option value="">All prices</option><option value="100000">Up to ₹1,000</option><option value="150000">Up to ₹1,500</option></select></label>
        <label>Sort by<select value={sort} onChange={e => setSort(e.target.value)}><option value="">Featured</option><option value="asc">Price, low first</option><option value="desc">Price, high first</option><option value="name">Name</option></select></label>
      </div>
    </div>
    {filtered.length ? <div className="template-grid">{(home ? filtered.slice(0, 4) : filtered).map((template, index) => <Card key={template.slug} template={template} index={index} />)}</div> : <div className="empty"><SearchX /><p>{saved ? 'Save a design with the heart button to find it here.' : 'No invitations match these filters.'}</p>{!saved && <button className="button outline" onClick={() => { setCategory(''); setBudget(''); setStyle(''); setTier('') }}>Clear filters</button>}</div>}
    {home && <div className="center"><Link className="button outline" href="/templates">View All Templates</Link></div>}
  </section>
}
