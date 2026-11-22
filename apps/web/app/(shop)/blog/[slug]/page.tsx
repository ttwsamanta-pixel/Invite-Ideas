import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { cache } from 'react'
import { serverApi } from '../../../../lib/data'
import type { Article } from '../../../../lib/content'

const getPost = cache((slug: string) => serverApi<Article>('/blog/' + encodeURIComponent(slug)))
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug)
  return { title: post?.seoTitle || post?.title, description: post?.seoDescription || post?.description }
}
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug)
  if (!post) notFound()
  return <article className="wrap content stack prose-page">
    <Link href="/blog">Back to Invitation Ideas</Link><p className="eyebrow">{post.category}</p><h1>{post.title}</h1><p>{post.description}</p>
    {post.image && <Image src={post.image} alt="" width={720} height={470} style={{ maxWidth: '100%', height: 'auto' }} />}
    {post.body?.split(/\n{2,}/).map((paragraph, i) => <p key={i} style={{ whiteSpace: 'pre-line' }}>{paragraph}</p>)}
  </article>
}
