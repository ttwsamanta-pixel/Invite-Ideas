'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../lib/client'
import { defaultCopy, type Article } from '../lib/content'

const example = { slug: 'bengali-wedding-checklist', title: 'Bengali wedding invitation checklist', category: 'Wedding', description: '', body: '', published: false }
export function AdminContent() {
  const [copy, setCopy] = useState('')
  const [article, setArticle] = useState(JSON.stringify(example, null, 2))
  const [posts, setPosts] = useState<Article[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  useEffect(() => {
    Promise.all([api<Partial<typeof defaultCopy>>('/site-copy'), api<Article[]>('/admin/blog')])
      .then(([copy, posts]) => { setCopy(JSON.stringify({ ...defaultCopy, ...copy }, null, 2)); setPosts(posts) })
      .catch(failure => setError(failure.message))
  }, [])
  async function save(event: FormEvent<HTMLFormElement>, path: string, value: string) {
    event.preventDefault()
    setError(''); setMessage(''); setWorking(true)
    try {
      await api(path, 'POST', JSON.parse(value))
      if (path.endsWith('/blog')) setPosts(await api<Article[]>('/admin/blog'))
      setMessage('Content saved.')
    } catch (failure) { setError((failure as Error).message) } finally { setWorking(false) }
  }
  return <section className="panel stack"><h2>Website content</h2>
    {error && <p role="alert" className="error">{error}</p>}{message && <p role="status" className="success">{message}</p>}
    <details><summary>Homepage, FAQ and SEO</summary><form className="stack" onSubmit={event => save(event, '/admin/site-copy', copy)}>
      <label>Site content (JSON)<textarea rows={12} value={copy} required onChange={e => setCopy(e.target.value)} /></label><button className="button small" disabled={working}>Save site content</button>
    </form></details>
    <details><summary>Blog articles</summary><div className="stack">
      <div className="inline">{posts.map(post => <button key={post.slug} className="button outline small" onClick={() => setArticle(JSON.stringify({
        slug: post.slug, title: post.title, category: post.category, description: post.description, body: post.body, image: post.image || undefined, seoTitle: post.seoTitle || undefined, seoDescription: post.seoDescription || undefined, published: Boolean(post.publishedAt),
      }, null, 2))}>{post.title}</button>)}<button className="button outline small" onClick={() => setArticle(JSON.stringify(example, null, 2))}>New article</button></div>
      <form className="stack" onSubmit={event => save(event, '/admin/blog', article)}><label>Article (JSON)<textarea rows={10} required value={article} onChange={e => setArticle(e.target.value)} /></label><button className="button small" disabled={working}>Save article</button></form>
    </div></details>
  </section>
}
