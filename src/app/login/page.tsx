'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  const handleSignUp = async () => {
    if (!email || !password) {
      setMessage('Please enter an email and password.')
      return
    }
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email to confirm your account.')
    }
    setLoading(false)
  }

  return (
    <main style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 24 }}>Sign in</h1>

      <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '8px 12px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '8px 12px', fontSize: 14, border: '1px solid #ccc', borderRadius: 4 }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '8px 12px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          {loading ? 'Loading...' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={handleSignUp}
          disabled={loading}
          style={{ padding: '8px 12px', background: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
        >
          Create account
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 16, color: message.startsWith('Check') ? 'green' : 'red', fontSize: 14 }}>
          {message}
        </p>
      )}
    </main>
  )
}
