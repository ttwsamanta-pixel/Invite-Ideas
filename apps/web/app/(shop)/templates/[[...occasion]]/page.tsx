import { notFound } from 'next/navigation'
import { Market } from '../../../../components/market'
import { categories, demoCatalog, serverApi, type Template } from '../../../../lib/data'
export const metadata = { title: 'Invitation Templates' }
export default async function Templates({ params, searchParams }: { params: Promise<{ occasion?: string[] }>; searchParams: Promise<{ q?: string; saved?: string }> }) {
  const [{ occasion }, { q, saved }, templates, available] = await Promise.all([params, searchParams, serverApi<Template[]>('/templates'), serverApi<typeof categories>('/categories')])
  const all = available || categories
  const category = occasion?.[0] === 'annaprasan' ? 'annaprashan' : occasion?.[0]
  if (occasion && (occasion.length !== 1 || !all.some(item => item.slug === category))) notFound()
  return <Market templates={templates || demoCatalog} allCategories={all} initialCategory={category} query={typeof q === 'string' ? q : undefined} saved={saved === '1'} />
}
