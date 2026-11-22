import Link from 'next/link'

export default function NotFound() {
  return <main className="wrap content stack"><h1>Page not found</h1><p>Check the link, or explore the invitation collection.</p><div><Link className="button" href="/templates">Explore templates</Link></div></main>
}
