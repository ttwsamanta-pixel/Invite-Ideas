import catalog from '../../../catalog.json'
import weddingCollection from '../../../wedding-collection.json'

export type Config = { theme: string; names: string; image: string; sections: string[]; layout?: 'frame' | 'split' | 'cover'; opening?: 'envelope'; language?: 'en' | 'bn' | 'hi'; place?: string; events?: string[]; fields?: { key: string; label: string; example?: string }[] }
export type Template = {
  slug: string; name: string; description: string; image: string; style: string; badge: string | null
  categoryId: string; category: { slug: string; name: string }; offerPrice: number; regularPrice: number
  featured: boolean; active: boolean; classification: string; versions: { number: number; config: Config }[]
}
export const categories = catalog.categories.map(([slug, name]) => ({ slug, name }))
export const demoCatalog: Template[] = catalog.templates.map(entry => {
  const [slug, name, categoryId, style, badge, offerPrice, regularPrice, theme, artwork, names, description] =
    entry as [string, string, string, string, string | null, number, number, string, string, string, string]
  const image = '/images/' + artwork + '.webp'
  return { slug, name, description, image, style, badge, categoryId, category: categories.find(item => item.slug === categoryId)!, offerPrice, regularPrice, featured: true, active: true, classification: badge === 'Premium' ? 'Premium' : 'Standard', versions: [{ number: 1, config: { theme, image, names, sections: ['events', 'countdown', 'gallery', 'story', 'family', 'rsvp', 'music'] } }] }
})
demoCatalog.push(...weddingCollection.map(design => ({
  slug: design.slug, name: design.name, description: design.description, image: design.config.image,
  style: design.style, classification: design.tier, badge: design.tier, featured: design.featured, active: true,
  offerPrice: design.price, regularPrice: design.regular, categoryId: design.category,
  category: categories.find(category => category.slug === design.category)!,
  versions: [{ number: 1, config: design.config as Config }],
})))
export function matchesOccasion(template: Template, occasion: string) {
  return !occasion || template.categoryId === occasion || (occasion === 'wedding' && template.categoryId.endsWith('-wedding'))
}
export const money = (paise: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: paise % 100 ? 2 : 0 }).format(paise / 100)
export async function serverApi<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch((process.env.API_ORIGIN || 'http://127.0.0.1:4000') + '/api' + path, { cache: 'no-store', signal: AbortSignal.timeout(2500) })
    return response.ok ? await response.json() : null
  } catch { return null }
}
export type InvitationEvent = { name: string; startsAt: string; venue: string; mapUrl?: string; description: string }
export type Order = { status: string; method: string; amount: number; paymentLinkUrl?: string }
export type Invitation = {
  id: string; title: string; names: string; language: 'en' | 'bn' | 'hi'; timezone: string
  story: string; family: string; details?: Record<string, string> | null; finalEventAt: string; events: InvitationEvent[]; rsvpEnabled: boolean
  gallery: { id: string; url?: string }[]; musicId?: string | null; music?: { name: string; file: string } | null
  slug?: string; status?: string; checkoutPrice?: number; source?: string; previewToken?: string; order: Order | null
  config?: Config; templateVersion?: { template: Template; config: Config }; _count?: { responses: number; views: number }
}
