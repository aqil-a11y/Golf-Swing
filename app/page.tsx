import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Activity, BarChart3, Clock } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/analyze')

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b border-turf-600 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-flag rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">SwingAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link href="/signup" className="btn-primary text-sm py-2">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-flag/10 border border-flag/20 text-flag text-sm font-medium px-4 py-2 rounded-full mb-8">
            <Activity className="w-4 h-4" />
            AI-Powered Golf Coach
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
            Perfect your swing
            <br />
            <span className="text-flag">with expert AI feedback</span>
          </h1>

          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Upload your golf swing video and receive instant, detailed feedback on mechanics,
            club path, tempo, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/analyze" className="btn-primary text-base px-8 py-4">
              Try Free — No Sign Up Needed
            </Link>
            <Link href="/login" className="btn-ghost text-base px-8 py-4 border border-turf-600">
              Sign In
            </Link>
          </div>
          <p className="text-slate-600 text-sm mt-4">5 free analyses · No credit card required</p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-turf-600 px-6 py-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              icon: <Activity className="w-6 h-6 text-flag" />,
              title: 'Swing Mechanics',
              desc: 'Deep analysis of posture, stance, grip, backswing, downswing, and follow-through.',
            },
            {
              icon: <BarChart3 className="w-6 h-6 text-flag" />,
              title: 'Club Path & Impact',
              desc: 'Understand your club face angle and swing path at the moment of impact.',
            },
            {
              icon: <Clock className="w-6 h-6 text-flag" />,
              title: 'Tempo & Timing',
              desc: 'Get rhythm feedback to build a consistent, powerful swing every time.',
            },
          ].map((f) => (
            <div key={f.title} className="card hover:bg-turf-800 transition-colors duration-200">
              <div className="w-12 h-12 bg-flag/10 rounded-xl flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-turf-600 px-6 py-6 text-center text-slate-600 text-sm space-y-1">
        <div className="flex items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
        </div>
        <p>SwingAI</p>
      </footer>
    </main>
  )
}
