import { Db } from '../src/database'
import { hash } from 'argon2'
import catalog from '../../../catalog.json'
import weddingCollection from '../../../wedding-collection.json'
import templateBatch from '../../../template-batch-01.json'
import batchTwo from '../../../template-batch-02.json'

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
  for (const design of weddingCollection) {
    await db.template.upsert({
      where: { slug: design.slug }, update: {},
      create: {
        slug: design.slug, name: design.name, categoryId: design.category, style: design.style,
        classification: design.tier, badge: design.tier, image: design.config.image,
        offerPrice: design.price, regularPrice: design.regular, description: design.description, featured: design.featured,
        versions: { create: { number: 1, config: design.config } },
      },
    })
  }
  for (const design of templateBatch) {
    await db.template.upsert({
      where: { slug: design.id }, update: {},
      create: {
        slug: design.id, name: design.name, categoryId: design.category, style: design.style,
        classification: design.tier[0] + design.tier.slice(1).toLowerCase(), image: design.config.image,
        regularPrice: design.regularPrice, offerPrice: design.offerPrice,
        description: design.name + ' invitation with ceremony schedule, gallery and RSVP.',
        active: design.status === 'PUBLISHED',
        versions: { create: { number: 1, config: design.config } },
      },
    })
  }
  for (const design of batchTwo) {
    await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT slug FROM templates WHERE slug = ${design.id} FOR UPDATE`
      const current = await tx.template.findUnique({ where: { slug: design.id }, include: { versions: { orderBy: { number: 'desc' }, take: 1 } } })
      if (!current) {
        await tx.template.create({ data: {
          slug: design.id, name: design.name, categoryId: design.category, style: design.style, culture: design.culture,
          classification: design.tier, image: design.config.image, description: design.description, featured: design.featured,
          regularPrice: design.regularPrice, offerPrice: design.offerPrice, versions: { create: { number: 1, config: design.config } },
        } })
        return
      }
      const latest = current.versions[0]
      const config = latest?.config
      // Upgrade only the original catalog versions. Existing invitations keep their pinned records.
      if (design.legacy && latest?.number === 1 && config && typeof config === 'object' && !Array.isArray(config) &&
        !config.componentKey && config.layout && config.image === design.config.image && config.theme === design.config.theme) {
        await tx.templateVersion.upsert({
          where: { templateId_number: { templateId: current.slug, number: 2 } }, update: {},
          create: { templateId: current.slug, number: 2, config: design.config },
        })
        if (!current.culture) await tx.template.update({ where: { slug: current.slug }, data: { culture: design.culture } })
      }
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
