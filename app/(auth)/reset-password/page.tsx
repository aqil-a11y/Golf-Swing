'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, CheckCircle, KeyRound, AlertCircle } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function verifyToken() {
      const supabase = createClient()
      const code = searchParams.get('code')
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      try {
        if (code) {
          // PKCE flow
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (token_hash && type === 'recovery') {
          // OTP / token_hash flow
          const { error } = await supabase.auth.verifyOtp({ token_hash, type: 'recovery' })
          if (error) throw error
        } else {
          // No params — check if there's already an active recovery session
          const { data } = await supabase.auth.getSession()
          if (!data.session) throw new Error('No valid reset session found.')
        }
        setVerified(true)
      } catch {
        setVerifyError('This reset link has expired or is invalid. Please request a new one.')
      } finally {
        setVerifying(false)
      }
    }
    verifyToken()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/analyze'), 2000)
  }

  if (verifying) {
    return (
      <div className="w-full max-w-md card text-center py-12">
        <svg className="animate-spin h-8 w-8 text-flag mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-slate-400">Verifying your reset link…</p>
      </div>
    )
  }

  if (verifyError) {
    return (
      <div className="w-full max-w-md card text-center">
        <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Link expired</h2>
        <p className="text-slate-400 text-sm mb-6">{verifyError}</p>
        <Link href="/forgot-password" className="btn-primary flex items-center justify-center gap-2">
          Request a new link
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="w-full max-w-md card text-center">
        <div className="w-16 h-16 bg-flag/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-flag" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Password updated!</h2>
        <p className="text-slate-400">Redirecting you to the app…</p>
      </div>
    )
  }

  if (!verified) return null

  return (
    <div className="w-full max-w-md card">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Set a new password</h1>
        <p className="text-slate-400 text-sm">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            New password
            <span className="text-slate-500 font-normal ml-1">(min. 8 characters)</span>
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="input pr-11"
            />
            <button type="button" onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Confirm new password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input pr-11"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              Updating...
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              Update Password
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 bg-flag rounded-xl flex items-center justify-center">
          <span className="text-white font-bold">S</span>
        </div>
        <span className="text-white font-bold text-xl tracking-tight">SwingAI</span>
      </Link>
      <Suspense fallback={
        <div className="w-full max-w-md card text-center py-12">
          <p className="text-slate-400">Loading…</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
