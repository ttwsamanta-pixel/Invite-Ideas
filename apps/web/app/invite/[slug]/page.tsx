import { cache } from 'react'
import { notFound } from 'next/navigation'
import { InvitationView } from '../../../components/invitation'
import { serverApi, type Invitation } from '../../../lib/data'
const load = cache((slug: string) => serverApi<Invitation>('/public/invite/' + encodeURIComponent(slug)))
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const invitation = await load(slug)
  const image = (!invitation?.config?.editorLabels && invitation?.config?.image) || '/images/social.png'
  return { twitter: { card: 'summary_large_image', title: invitation?.title, description: invitation?.names, images: [image] }, title: invitation?.title || 'Invitation', description: invitation?.names, alternates: invitation ? { canonical: '/invite/' + encodeURIComponent(slug) } : undefined, robots: { index: false, follow: false }, openGraph: { title: invitation?.title, description: invitation?.names, images: [image] } }
}
export default async function PublicInvite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const invitation = await load(slug)
  if (!invitation) notFound()
  return <InvitationView invitation={invitation} slug={slug} />
}
