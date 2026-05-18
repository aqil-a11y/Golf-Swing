import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import AnalyzeClient from './AnalyzeClient'

export default async function AnalyzePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col">
      {user ? (
        <Navbar userEmail={user.email ?? ''} />
      ) : (
        <header className="border-b border-turf-600 bg-turf-950/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-flag rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">SwingAI</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
              <Link href="/signup" className="btn-primary text-sm py-2">Sign up free</Link>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analyze Your Swing</h1>
          <p className="text-slate-400">
            Upload a golf swing video to receive AI-powered coaching feedback.
          </p>
        </div>
        <AnalyzeClient isLoggedIn={!!user} />
      </main>
    </div>
  )
}
