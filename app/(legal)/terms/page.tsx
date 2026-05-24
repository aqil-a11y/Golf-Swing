import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — SwingAI',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-turf-600 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-flag rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">SwingAI</span>
          </Link>
          <Link href="/" className="btn-ghost text-sm">← Back</Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: May 24, 2026</p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Use of service</h2>
            <p>
              SwingAI provides AI-powered golf swing analysis for personal, non-commercial use.
              By using the service, you agree to use it lawfully and not attempt to reverse-engineer,
              abuse, or overload the platform. We reserve the right to suspend accounts that violate
              these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">User content</h2>
            <p>
              You own the videos you upload. By uploading content to SwingAI, you grant us a
              limited license to process and store it for the purpose of providing analysis results.
              We do not claim ownership of your videos and will not share them with third parties
              other than our AI provider (Google Gemini) for analysis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Acceptable use</h2>
            <p>
              You agree not to upload content that is illegal, obscene, or unrelated to golf swing
              analysis. You agree not to use automated tools to interact with the service in ways
              that could harm other users or degrade platform performance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Limitation of liability</h2>
            <p>
              SwingAI is provided "as is" without warranties of any kind. AI analysis is for
              informational and entertainment purposes only — it does not substitute for professional
              golf instruction. We are not liable for any losses arising from your use of the service
              or reliance on analysis results.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Changes to terms</h2>
            <p>
              We may update these terms from time to time. Continued use of SwingAI after changes
              are posted constitutes acceptance of the new terms. We will update the "last updated"
              date at the top of this page when changes are made.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-turf-600 px-6 py-6 text-center text-slate-600 text-sm">
        <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
        <span className="mx-3">·</span>
        <span>SwingAI — Golf analysis powered by Google Gemini</span>
      </footer>
    </div>
  )
}
