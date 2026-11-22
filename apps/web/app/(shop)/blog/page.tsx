import Link from 'next/link'
import { serverApi } from '../../../lib/data'
import type { Article } from '../../../lib/content'

export const metadata = { title: 'Invitation Ideas' }
export default async function Blog() {
  const posts = await serverApi<Article[]>('/blog') || []
  return <section className="wrap content stack"><h1>Invitation Ideas</h1>
    {posts.length ? posts.map(post => <article className="panel stack" key={post.slug}><p className="eyebrow">{post.category}</p>
      <h2><Link href={'/blog/' + post.slug}>{post.title}</Link></h2><p>{post.description}</p>
    </article>) : <div className="panel stack"><h2>Plan your ceremony details</h2><p>Include a separate date, local time and venue for each ceremony so guests can plan their visit.</p><Link href="/templates">Explore Invitation Templates</Link></div>}
  </section>
}
