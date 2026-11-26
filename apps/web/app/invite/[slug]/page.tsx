import { cache } from 'react'
import { notFound } from 'next/navigation'
import { InvitationView } from '../../../components/invitation'
import { serverApi, type Invitation } from '../../../lib/data'
const load = cache((slug: string) => serverApi<Invitation>('/public/invite/' + encodeURIComponent(slug)))
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const invitation = await load(slug)
  return { title: invitation?.title || 'Invitation', description: invitation?.names, alternates: invitation ? { canonical: '/invite/' + encodeURIComponent(slug) } : undefined, robots: { index: false, follow: false }, openGraph: { title: invitation?.title, description: invitation?.names, images: [invitation?.config?.image || '/images/social.png'] } }
}
export default async function PublicInvite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const invitation = await load(slug)
  if (!invitation) notFound()
  return <InvitationView invitation={invitation} slug={slug} />
}
