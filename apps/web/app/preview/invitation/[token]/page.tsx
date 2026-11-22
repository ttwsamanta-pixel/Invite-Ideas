import { PrivatePreview } from '../../../../components/invitation'
export const metadata = { title: 'Private Preview', robots: { index: false, follow: false }, referrer: 'no-referrer' }
export default async function Preview({ params }: { params: Promise<{ token: string }> }) {
  return <PrivatePreview token={(await params).token} />
}
