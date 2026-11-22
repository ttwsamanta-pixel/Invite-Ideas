import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { z } from 'zod'
import { AdminGuard, AuthGuard, type AuthRequest } from './auth'
import { Db, email, short, slug, validate } from './core'

const siteCopy = z.object({
  heroEyebrow: short, heroTitle: short, heroSubtitle: short, heroDescription: z.string().trim().min(1).max(400),
  footerDescription: z.string().trim().min(1).max(400), contactEmail: z.union([email, z.literal('')]),
  seoTitle: short, seoDescription: z.string().trim().min(1).max(200),
  about: z.string().trim().max(5000),
  testimonials: z.array(z.object({ name: short, quote: z.string().trim().min(1).max(500) })).max(12),
  questions: z.array(z.object({ question: short, answer: z.string().trim().min(1).max(500) })).max(20),
})
const article = z.object({
  slug, category: short, title: short, description: z.string().trim().min(1).max(400),
  body: z.string().trim().min(1).max(30_000), published: z.boolean(),
  image: z.string().regex(/^\/images\/[a-z0-9-]+\.webp$/).optional(),
  seoTitle: short.optional(), seoDescription: z.string().trim().max(200).optional(),
})
const postSummary = { slug: true, category: true, title: true, description: true, image: true, publishedAt: true } as const

@Controller()
export class ContentController {
  constructor(private readonly db: Db) {}

  @Get('site-copy')
  async copy() {
    return (await this.db.setting.findUnique({ where: { key: 'site-copy' } }))?.value || {}
  }

  @Get('blog')
  listPosts() {
    return this.db.blogPost.findMany({ where: { publishedAt: { lte: new Date() } }, take: 80, orderBy: { publishedAt: 'desc' }, select: postSummary })
  }

  @Get('blog/:slug')
  post(@Param('slug') slug: string) {
    return this.db.blogPost.findFirst({ where: { slug, publishedAt: { lte: new Date() } }, select: { ...postSummary, body: true, seoTitle: true, seoDescription: true } })
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Post('admin/site-copy')
  saveCopy(@Body() raw: unknown, @Req() req: AuthRequest) {
    const value = validate(siteCopy, raw)
    return this.db.$transaction([
      this.db.setting.upsert({ where: { key: 'site-copy' }, create: { key: 'site-copy', value }, update: { value } }),
      this.db.activityLog.create({ data: { actorId: req.account.id, action: 'SITE_COPY_SAVED', targetId: 'site-copy', detail: {} } }),
    ])
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Get('admin/blog')
  adminPosts() { return this.db.blogPost.findMany({ take: 100, orderBy: { updatedAt: 'desc' } }) }

  @UseGuards(AuthGuard, AdminGuard)
  @Post('admin/blog')
  savePost(@Body() raw: unknown, @Req() req: AuthRequest) {
    const { published, ...data } = validate(article, raw)
    return this.db.$transaction(async tx => {
      const existing = await tx.blogPost.findUnique({ where: { slug: data.slug } })
      const fields = { ...data, image: data.image || null, seoTitle: data.seoTitle || null, seoDescription: data.seoDescription || null, publishedAt: published ? existing?.publishedAt || new Date() : null }
      const post = await tx.blogPost.upsert({ where: { slug: data.slug }, create: fields, update: fields })
      await tx.activityLog.create({ data: { actorId: req.account.id, action: 'BLOG_POST_SAVED', targetId: post.slug, detail: { published } } })
      return post
    })
  }
}
