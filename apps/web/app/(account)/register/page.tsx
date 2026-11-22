import { AuthForm } from '../../../components/auth-form'
export const metadata = { robots: { index: false, follow: false } }
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string; next?: string }> }) {
  const { token, next } = await searchParams
  return <AuthForm mode="register" token={token} next={next} />
}
