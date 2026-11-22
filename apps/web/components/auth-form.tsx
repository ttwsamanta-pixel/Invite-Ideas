'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Brand } from './shell'
import { api } from '../lib/client'

type Mode = 'login' | 'register' | 'forgot' | 'verify' | 'reset'
export function AuthForm({ mode, token, next }: { mode: Mode; token?: string; next?: string }) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [length, setLength] = useState(0)
  const normal = mode === 'login' || mode === 'register'
  const complete = mode === 'reset' || mode === 'verify'
  const destination = next?.startsWith('/editor/') && /^\/editor\/[a-z0-9-]+$/.test(next) ? next : '/dashboard'
  const suffix = destination !== '/dashboard' ? '?next=' + encodeURIComponent(destination) : ''
  const title = { login: 'Welcome back.', register: 'Get started.', forgot: 'Reset your password.', verify: 'Verify your email.', reset: 'Choose a new password.' }[mode]
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await api<{ message?: string }>('/auth/' + (complete ? 'complete' : mode), 'POST', {
        name: data.get('name'), email: data.get('email'), password: data.get('password'), terms: data.get('terms') === 'on', ...(complete ? { kind: mode, token } : {}),
      })
      if (result.message) setMessage(result.message)
      else router.push(destination)
    } catch (failure) { setError((failure as Error).message) } finally { setBusy(false) }
  }
  return <section className="auth panel">
    <Brand /><p className="eyebrow">{mode === 'login' ? 'SIGN IN' : 'YOUR INVITEIDEAS ACCOUNT'}</p><h1>{title}</h1>
    {mode === 'login' && <p>Please enter your credentials to access your dashboard.</p>}
    {mode === 'register' && <p>Create your account to start building your dream invitation.</p>}
    {normal && <><a href="/api/auth/google" className="button outline google">Continue with Google</a><p className="eyebrow">OR {mode === 'register' ? 'REGISTER' : 'SIGN IN'} WITH EMAIL</p></>}
    <form className="stack" onSubmit={submit}>
      {mode === 'register' && <label>Full name<input name="name" maxLength={180} required autoComplete="name" /></label>}
      {!complete && <label>Email address<input name="email" type="email" maxLength={190} required autoComplete="email" /></label>}
      {mode !== 'forgot' && <div className="stack"><label>Password<input name="password" type={visible ? 'text' : 'password'} required minLength={mode === 'login' ? undefined : 12} maxLength={128} onChange={event => setLength(event.target.value.length)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
        <div className="inline"><button type="button" className="button outline small" onClick={() => setVisible(!visible)}>{visible ? 'Hide password' : 'Show password'}</button>{mode === 'login' && <Link href="/forgot">Forgot password?</Link>}{mode !== 'login' && <span className="muted">{length >= 12 ? 'Minimum length reached' : 'Use at least 12 characters'}</span>}</div>
      </div>}
      {mode === 'register' && <label className="checkbox"><input name="terms" type="checkbox" required /><span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</span></label>}
      <button className="button" disabled={busy || (complete && !token)}>{busy ? 'Please wait…' : { login: 'Sign in', register: 'Create account', forgot: 'Send reset link', verify: 'Verify and sign in', reset: 'Save password' }[mode]}</button>
      {error && <p role="alert" className="error">{error}</p>}{message && <p role="status" className="success">{message}</p>}
    </form>
    {mode === 'login' && <p className="helper">New to InviteIdeas? <Link href={'/register' + suffix}>Create an account</Link></p>}
    {mode !== 'login' && <p className="helper"><Link href={'/login' + suffix}>Back to sign in</Link></p>}
  </section>
}
