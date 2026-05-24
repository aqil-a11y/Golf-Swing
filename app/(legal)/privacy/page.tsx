import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — SwingAI',
}

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: May 24, 2026</p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">What we collect</h2>
            <p>
              When you create an account, we collect your email address. When you use SwingAI to
              analyze your golf swing, we store the video files you upload and the AI-generated
              analysis results associated with your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">How we use it</h2>
            <p>
              Your email is used to authenticate your account and send transactional messages
              (account confirmation, password resets). Your golf swing videos are processed by our
              AI to generate analysis results. We do not sell your data to third parties or use it
              for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">How long we store it</h2>
            <p>
              We retain your data for as long as your account is active. Videos, analysis results,
              and profile information are deleted permanently when you delete your account. You can
              delete individual analyses from your History page at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Your rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data at any time. To
              delete your account and all associated data, visit your{' '}
              <Link href="/profile" className="text-flag hover:text-flag-light transition-colors">Profile page</Link>{' '}
              and use the "Delete Account" option in the Danger Zone section.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-turf-600 px-6 py-6 text-center text-slate-600 text-sm">
        <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
        <span className="mx-3">·</span>
        <span>SwingAI</span>
      </footer>
    </div>
  )
}
