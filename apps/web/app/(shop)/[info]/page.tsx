import Link from 'next/link'
import { notFound } from 'next/navigation'
const content: Record<string, { title: string; text: string; link?: string; label?: string }> = {
  pricing: { title: 'One-time pricing', text: 'Every design has its own price. Your purchase covers one invitation, with a shareable link and downloadable QR code once payment is verified.', link: '/templates', label: 'Browse designs and prices' },
  blog: { title: 'Invitation ideas', text: 'For a Bengali wedding, remember to include each ceremony separately. Give guests the local date, start time and venue for events such as the gaye holud, wedding and reception.', link: '/templates/bengali-wedding', label: 'Explore Bengali weddings' },
  contact: { title: 'Contact InviteIdeas', text: 'Get help choosing a design, setting up an invitation or finding an existing order.' },
  terms: { title: 'Invitation terms', text: 'Each purchase covers one invitation. Please upload only content you have permission to share. Invitation editing closes at the final event time.' },
  privacy: { title: 'Invitation privacy', text: 'Your account and draft invitations are private. Once published, anyone with the invitation link can view the details and photos you chose to share. RSVP responses are available to the invitation owner and authorized staff.' },
}
export default async function Info({ params }: { params: Promise<{ info: string }> }) {
  const { info } = await params
  const page = Object.hasOwn(content, info) ? content[info] : null
  if (!page) notFound()
  const contact = info === 'contact' ? process.env.SUPPORT_EMAIL : undefined
  return <section className="wrap content prose-page"><h1>{page.title}</h1><p>{page.text}</p>{contact && <a href={'mailto:' + contact}>{contact}</a>}{info === 'contact' && !contact && <p>Support contact details will appear when email support is configured.</p>}{page.link && <Link className="button" href={page.link}>{page.label}</Link>}</section>
}
