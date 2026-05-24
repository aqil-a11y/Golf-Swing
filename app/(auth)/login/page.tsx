'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, LogIn, CheckCircle, AlertCircle } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  confirmation_failed: 'Email confirmation failed. The link may have expired — please try signing up again.',
  reset_failed: 'Password reset link failed or expired. Please request a new one.',
  missing_token: 'Invalid confirmation link. Please request a new one.',
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const confirmed = searchParams.get('confirmed')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/analyze')
    router.refresh()
  }

  const urlError = errorParam ? (ERROR_MESSAGES[errorParam] ?? errorParam) : null

  return (
    <div className="w-full max-w-md card">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-slate-400 text-sm">Sign in to your account</p>
      </div>

      {confirmed && (
        <div className="mb-5 bg-flag/10 border border-flag/30 text-flag text-sm rounded-lg px-4 py-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Email confirmed! You can now sign in.
        </div>
      )}

      {urlError && (
        <div className="mb-5 bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {urlError}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="input"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-flag transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Sign In
            </>
          )}
        </button>
      </form>

      <p className="text-center text-slate-400 text-sm mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-flag hover:text-flag-light font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 bg-flag rounded-xl flex items-center justify-center">
          <span className="text-white font-bold">S</span>
        </div>
        <span className="text-white font-bold text-xl tracking-tight">SwingAI</span>
      </Link>

      <Suspense fallback={
        <div className="w-full max-w-md card">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
            <p className="text-slate-400 text-sm">Sign in to your account</p>
          </div>
          <div className="h-40 animate-pulse bg-turf-800 rounded-lg" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
