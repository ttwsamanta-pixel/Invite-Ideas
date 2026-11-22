import type { MetadataRoute } from 'next'
import { categories, demoCatalog, serverApi, type Template } from '../lib/data'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const root = process.env.APP_ORIGIN || 'http://localhost:3000'
  const designs = await serverApi<Template[]>('/templates') || demoCatalog
  return ['', '/templates', '/pricing', '/blog', '/contact', ...categories.map(item => '/templates/' + item.slug), ...designs.map(item => '/design/' + item.slug)].map(path => ({ url: root + path }))
}
