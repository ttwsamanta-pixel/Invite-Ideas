import Link from 'next/link'
import { notFound } from 'next/navigation'
import { InvitationView } from '../../../../components/invitation'
import { demoCatalog, serverApi, type Template } from '../../../../lib/data'
export const metadata = { title: 'Template Preview', robots: { index: false, follow: true } }

const sampleStories: Record<string, string> = {
  'phulkari-courtyard': 'Our families first met over chai in Chandigarh. We are returning to the city to celebrate together after our Anand Karaj.',
  'jasmine-zari': 'Chennai is where we met, where our families first shared a meal, and where we will begin our married life.',
  'moonlit-jali': 'We spent our first evening together walking through Hyderabad. We wanted our wedding weekend to feel as warm and unhurried as that evening.',
  'white-rose-vows': 'We are getting married in Kochi with our closest family and friends.',
  'marigold-raas': 'Our first Garba together ended with sore feet and plans for next year. This time we get to invite everyone to dance with us.',
  'paithani-morning': 'Our weekends in Pune usually begin with breakfast together. For once we are inviting everyone to join us early.',
  'alpana-silk': 'কলকাতাতেই আমাদের প্রথম দেখা। এই শহরেই পরিবার ও বন্ধুদের সঙ্গে নতুন পথচলার আনন্দ ভাগ করে নিতে চাই।',
  'salt-and-sunset': 'On our first trip to Goa, we stayed on the beach until the sun went down. We are going back with our favourite people this time.',
  'amber-jharokha': 'We are bringing our families to Jaipur for music in the courtyard and a wedding under the evening sky.',
  'olive-wax-seal': 'After years of sending each other handwritten notes, we wanted our wedding invitation to feel like a letter from us.',
}

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
      story: config.layout ? sampleStories[slug] || '' : '',
      family: config.layout ? (language === 'bn' ? 'দুই পরিবারের পক্ষ থেকে আপনাদের সাদর আমন্ত্রণ।' : 'With love from both our families, we hope you can celebrate with us.') : '',
      details: Object.fromEntries(config.fields?.map(field => [field.key, field.example || '']) || []),
      rsvpEnabled: Boolean(config.layout), finalEventAt: events.at(-1)!.startsAt, events,
      gallery: config.layout && config.sections.includes('gallery') ? ['bands', 'jasmine', 'table'].map(id => ({ id, url: '/images/wedding/sample-' + id + '.webp' })) : [], order: null, config,
    }} />
  </>
}
