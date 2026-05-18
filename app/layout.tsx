import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SwingAI — Golf Swing Analyzer',
  description: 'AI-powered golf swing analysis. Upload your swing video and get instant expert feedback.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
