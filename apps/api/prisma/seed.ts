import { Db } from '../src/database'
import { hash } from 'argon2'
import catalog from '../../../catalog.json'

const db = new Db()
async function seed() {
  for (const [slug, name] of catalog.categories) {
    await db.category.upsert({ where: { slug }, create: { slug, name }, update: {} })
  }
  for (const entry of catalog.templates) {
    const [slug, name, categoryId, style, badge, offerPrice, regularPrice, theme, image, names, description] =
      entry as [string, string, string, string, string | null, number, number, string, string, string, string]
    await db.template.upsert({
      where: { slug }, update: {},
      create: {
        slug, name, categoryId, style, badge, offerPrice, regularPrice, description,
        image: '/images/' + image + '.webp', classification: badge === 'Premium' ? 'Premium' : 'Standard', featured: true,
        versions: { create: { number: 1, config: { theme, names, image: '/images/' + image + '.webp', sections: ['events', 'countdown', 'gallery', 'story', 'family', 'rsvp', 'music'] } } },
      },
    })
  }
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    if (ADMIN_PASSWORD.length < 16) throw new Error('ADMIN_PASSWORD must have at least 16 characters')
    const email = ADMIN_EMAIL.trim().toLowerCase()
    const existing = await db.user.findUnique({ where: { email } })
    if (existing && existing.role !== 'ADMIN') throw new Error('Admin email is already in use')
    if (!existing) await db.user.create({ data: { email, name: 'InviteIdeas Admin', password: await hash(ADMIN_PASSWORD), verifiedAt: new Date(), role: 'ADMIN' } })
  }
}
seed().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => db.$disconnect())
