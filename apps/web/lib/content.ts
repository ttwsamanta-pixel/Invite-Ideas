import { serverApi } from './data'

export const defaultCopy = {
  heroEyebrow: 'DIGITAL INVITATIONS FOR EVERY CELEBRATION',
  heroTitle: 'Bengali Wedding', heroSubtitle: 'Invitation Templates',
  heroDescription: 'Create a beautiful digital wedding invitation with traditional Bengali designs, rich visuals and modern features.',
  footerDescription: 'Beautiful digital invitations for every celebration.',
  contactEmail: '',
  seoTitle: 'InviteIdeas | Digital Invitations for Every Celebration',
  seoDescription: 'Create, customize and share your digital invitation. Explore Bengali wedding invitations and designs for every celebration.',
  about: 'InviteIdeas helps you create digital invitations for weddings and other celebrations. Choose a design, customize it and share it from your phone.',
  testimonials: [] as { name: string; quote: string }[],
  questions: [
    { question: 'How much does an invitation cost?', answer: 'Each template lists its own one-time price. Your purchase covers one invitation.' },
    { question: 'When does editing close?', answer: 'You can make changes until the scheduled start time of your final event.' },
    { question: 'How do I share my invitation?', answer: 'The dashboard offers a public link and a downloadable QR code after payment is verified.' },
  ],
}
export async function getSiteCopy() {
  return { ...defaultCopy, ...await serverApi<Partial<typeof defaultCopy>>('/site-copy') }
}
export type Article = {
  slug: string; category: string; title: string; description: string; body?: string
  image?: string | null; seoTitle?: string | null; seoDescription?: string | null; publishedAt?: string | null
}
