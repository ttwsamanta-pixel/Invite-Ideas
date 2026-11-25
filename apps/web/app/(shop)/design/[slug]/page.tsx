import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card } from '../../../../components/market'
import { demoCatalog, money, serverApi, type Template } from '../../../../lib/data'
export default async function Design({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const items = await serverApi<Template[]>('/templates') || demoCatalog
  const template = items.find(item => item.slug === slug)
  if (!template) notFound()
  const config = template.versions[0]?.config
  return <div className="wrap content">
    <Link href={'/templates/' + template.categoryId}>‹ {template.category.name}</Link>
    <div className="detail">
      <div className="detail-image"><Image src={template.image} fill alt={template.name + ' invitation design'} sizes="(max-width: 767px) 90vw, 45vw" priority /></div>
      <div><p className="eyebrow">{template.category.name} · {template.style} · {template.classification}</p><h1>{template.name}</h1><p>{template.description}</p><p className="price"><strong>{money(template.offerPrice)}</strong><del>{money(template.regularPrice)}</del></p>
      <div className="hero-buttons"><Link className="button outline" href={'/preview/template/' + slug}>Live Preview</Link><Link className="button" href={'/editor/' + slug}>Use This Template</Link></div>
            <h2>Make it yours</h2><p>Customize names, venues, dates and ceremony times. Choose from Bengali, English and Hindi for invitation labels.</p>
      {config?.events && <p><strong>Sample schedule</strong> · {config.events.join(' · ')}</p>}
      {config?.fields?.length ? <p><strong>Guest information</strong> · {config.fields.map(field => field.label).join(' · ')}</p> : null}
      {config?.sections && <p>{[{ key: 'gallery', label: 'Photo gallery' }, { key: 'countdown', label: 'Countdown' }, { key: 'music', label: 'Background music' }, { key: 'rsvp', label: 'RSVP' }].filter(feature => config.sections.includes(feature.key)).map(feature => feature.label).join(' · ')}</p>}
      </div>
    </div>
    <h2>More invitation designs</h2><div className="template-grid">{items.filter(item => item.slug !== slug).slice(0, 4).map((item, index) => <Card key={item.slug} template={item} index={index} />)}</div>
  </div>
}
