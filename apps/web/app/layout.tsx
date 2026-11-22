import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: { default: 'InviteIdeas | Digital Invitations for Every Celebration', template: '%s | InviteIdeas' },
  metadataBase: new URL(process.env.APP_ORIGIN || 'http://localhost:3000'),
  description: 'Create, customize and share your digital invitation. Explore Bengali wedding invitations and designs for every celebration.',
  openGraph: { siteName: 'InviteIdeas', images: ['/images/social.png'] },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
