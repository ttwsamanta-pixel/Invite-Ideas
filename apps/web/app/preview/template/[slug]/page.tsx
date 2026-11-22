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
  const language = template.categoryId === 'bengali-wedding' ? 'bn' : 'en'
  const startsAt = '2027-05-15T18:00:00+05:30'
  return <><div className="preview-banner"><Link className="button outline small" href={'/design/' + slug}>Back to design</Link><strong>Sample invitation</strong><Link className="button small" href={'/editor/' + slug}>Use Template</Link></div>
    <InvitationView invitation={{ id: '', title: template.name, names: config.names, language, timezone: 'Asia/Kolkata', story: '', family: '', rsvpEnabled: false, finalEventAt: startsAt, events: [{ name: language === 'bn' ? 'বিবাহ অনুষ্ঠান' : 'Celebration', startsAt, venue: 'Kolkata, West Bengal', description: '' }], gallery: [], order: null, config }} /></>
}
