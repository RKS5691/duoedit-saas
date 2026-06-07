'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button, Input } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode]       = useState<'login' | 'signup'>('login')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        setMessage('Check your email for a confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-2xl font-bold text-accent-3">
            Duo<span className="text-gold">Edit</span>
          </Link>
          <p className="mt-2 text-sm text-text2">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-7">
          {/* Mode toggle */}
          <div className="mb-6 flex rounded-lg border border-border bg-bg3 p-1">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setMessage('') }}
                className={`flex-1 rounded-md py-2 text-sm transition-all ${
                  mode === m ? 'bg-accent text-white' : 'text-text2 hover:text-text'
                }`}
              >
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <Input
                label="Full Name"
                placeholder="Riya Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />

            {error   && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
            {message && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{message}</p>}

            <Button type="submit" loading={loading} size="lg" className="mt-1 w-full">
              {mode === 'login' ? 'Log In' : 'Create Account'}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text3">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm text-text2 transition hover:border-border2 hover:text-text"
          >
            <span>🔵</span> Continue with Google
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-text3">
          By continuing, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-text2">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-text2">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
