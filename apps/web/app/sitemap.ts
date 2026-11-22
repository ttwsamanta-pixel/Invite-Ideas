import type { MetadataRoute } from 'next'
import type { Article } from '../lib/content'
import { categories, demoCatalog, serverApi, type Template } from '../lib/data'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const root = process.env.APP_ORIGIN || 'http://localhost:3000'
  const designs = await serverApi<Template[]>('/templates') || demoCatalog
  const posts = await serverApi<Article[]>('/blog') || []
  return ['', '/templates', '/pricing', '/blog', '/contact', '/about', '/faq', ...posts.map(post => '/blog/' + post.slug), ...categories.map(item => '/templates/' + item.slug), ...designs.map(item => '/design/' + item.slug)].map(path => ({ url: root + path }))
}
