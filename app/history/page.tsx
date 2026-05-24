import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import HistoryClient from './HistoryClient'
import { Analysis } from '@/lib/types'

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: analyses } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Swing History</h1>
          <p className="text-slate-400">
            {analyses && analyses.length > 0
              ? `${analyses.length} swing analysis ${analyses.length === 1 ? 'session' : 'sessions'} recorded`
              : 'Your analysis sessions will appear here'}
          </p>
        </div>
        <HistoryClient analyses={(analyses ?? []) as Analysis[]} />
      </main>
    </div>
  )
}
