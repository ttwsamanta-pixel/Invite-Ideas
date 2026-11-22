import { Editor } from '../../../../components/editor'
import { demoCatalog, serverApi, type Template } from '../../../../lib/data'
export const metadata = { title: 'Create Invitation', robots: { index: false, follow: false } }
export default async function EditorPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ edit?: string; owner?: string }> }) {
  const [{ slug }, { edit, owner }, catalog] = await Promise.all([params, searchParams, serverApi<Template[]>('/templates')])
  const templates = catalog || demoCatalog
  return <Editor templates={templates} selected={templates.find(item => item.slug === slug)?.slug} id={edit} owner={owner} />
}
