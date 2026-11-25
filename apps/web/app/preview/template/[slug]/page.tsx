import Link from 'next/link'
import { notFound } from 'next/navigation'
import { InvitationView } from '../../../../components/invitation'
import { demoCatalog, serverApi, type Template } from '../../../../lib/data'
export const metadata = { title: 'Template Preview', robots: { index: false, follow: true } }

export default async function Demo({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const available = await serverApi<Template[]>('/templates') || demoCatalog
  const template = available.find(item => item.slug === slug)
  if (!template) notFound()
  const { config } = template.versions[0]
  const language = config.language || (template.categoryId === 'bengali-wedding' ? 'bn' : 'en')
  const schedule = config.events || [language === 'bn' ? 'বিবাহ অনুষ্ঠান' : 'Celebration']
  const place = config.place || 'Kolkata'
  const events = schedule.map((name, i) => ({
    name,
    startsAt: new Date(Date.UTC(2027, 11, 12, 12 + (i % 2) * 2, 30) + Math.floor(i / 2) * 86_400_000).toISOString(),
    venue: place,
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(place),
    description: '',
  }))
  return <>
    <div className="preview-banner"><Link className="button outline small" href={'/design/' + slug}>Back to design</Link><strong>Sample invitation</strong><Link className="button small" href={'/editor/' + slug}>Use Template</Link></div>
    <InvitationView sample invitation={{
      id: '', title: template.name, names: config.names, language, timezone: 'Asia/Kolkata',
      story: config.layout ? (language === 'bn' ? 'আমাদের আনন্দের দিনে আপনাদের সঙ্গে চাই।' : 'We hope to share this weekend with the people we love most.') : '',
      family: config.layout ? (language === 'bn' ? 'দুই পরিবারের পক্ষ থেকে আপনাদের সাদর আমন্ত্রণ।' : 'With love from both our families, we hope you can celebrate with us.') : '',
      details: Object.fromEntries(config.fields?.map(field => [field.key, field.example || '']) || []),
      rsvpEnabled: Boolean(config.layout), finalEventAt: events.at(-1)!.startsAt, events,
      gallery: config.layout && config.sections.includes('gallery') ? ['bands', 'jasmine', 'table'].map(id => ({ id, url: '/images/wedding/sample-' + id + '.webp' })) : [], order: null, config,
    }} />
  </>
}
