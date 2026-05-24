'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { VideoUploader } from '@/components/VideoUploader'
import { AnalysisCard } from '@/components/AnalysisCard'
import { AnalysisResult } from '@/lib/types'
import { RotateCcw, Clock, TrendingUp, UserPlus, Lock } from 'lucide-react'

const FREE_TRIAL_KEY = 'swingai_free_count'
const FREE_TRIAL_LIMIT = 5

function getTrialCount(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(FREE_TRIAL_KEY) || '0', 10)
}

function incrementTrialCount(): number {
  const next = getTrialCount() + 1
  localStorage.setItem(FREE_TRIAL_KEY, String(next))
  return next
}

interface AnalyzeClientProps {
  isLoggedIn: boolean
}

export default function AnalyzeClient({ isLoggedIn }: AnalyzeClientProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [trialCount, setTrialCount] = useState(0)
  const [trialExhausted, setTrialExhausted] = useState(false)
  const [resultClub, setResultClub] = useState<string | null>(null)
  const [resultTitle, setResultTitle] = useState<string | null>(null)
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    const count = getTrialCount()
    setTrialCount(count)
    setTrialExhausted(!isLoggedIn && count >= FREE_TRIAL_LIMIT)
  }, [isLoggedIn])

  const handleAnalyze = async (signedUrl: string, storageKey: string, mimeType: string, club: string | null, title: string | null, videoPreviewUrl?: string | null) => {
    if (!isLoggedIn && trialCount >= FREE_TRIAL_LIMIT) {
      setTrialExhausted(true)
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setResult(null)
    setAnalysisStep('Processing with AI...')

    try {
      const stepTimer = setTimeout(() => setAnalysisStep('Analyzing...'), 8000)

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedUrl, storageKey, mimeType, club, title }),
      })

      clearTimeout(stepTimer)

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed. Please try again.')
      }

      const analysisJson: AnalysisResult = data.analysis.analysis_json ?? data.analysis

      if (!isLoggedIn) {
        const newCount = incrementTrialCount()
        setTrialCount(newCount)
        if (newCount >= FREE_TRIAL_LIMIT) setTrialExhausted(true)
      }

      setResult(analysisJson)
      setResultClub(club)
      setResultTitle(title)
      setResultVideoUrl(videoPreviewUrl ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsAnalyzing(false)
      setAnalysisStep('')
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setResultClub(null)
    setResultTitle(null)
    setResultVideoUrl(null)
  }

  // Guest free trial exhausted — sign up wall
  if (!isLoggedIn && trialExhausted && !result) {
    return (
      <div className="card text-center py-16">
        <div className="w-16 h-16 bg-flag/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <Lock className="w-8 h-8 text-flag" />
        </div>
        <h2 className="text-white font-bold text-2xl mb-2">You&apos;ve used all 5 free analyses</h2>
        <p className="text-slate-400 mb-8 max-w-sm mx-auto">
          Sign up for free to continue analyzing your swing and keep your full history.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className="btn-primary flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" />
            Create Free Account
          </Link>
          <Link href="/login" className="btn-ghost border border-turf-600 flex items-center justify-center">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (result) {
    const remainingFree = FREE_TRIAL_LIMIT - trialCount

    return (
      <div className="animate-fade-in space-y-8">
        {resultVideoUrl && (
          <video
            src={resultVideoUrl}
            controls
            className="w-full rounded-2xl max-h-80 object-contain bg-black border border-turf-600"
          />
        )}

        {/* Summary card */}
        <div className="card bg-gradient-to-br from-turf-800 to-turf-900 border-flag/20">
          <h2 className="text-white font-bold text-xl mb-2">Swing Analysis Complete</h2>
          {(resultClub || resultTitle) && (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {resultClub && (
                <span className="inline-flex items-center bg-flag/10 border border-flag/20 text-flag text-xs font-medium px-2.5 py-1 rounded-full">
                  Club: {resultClub}
                </span>
              )}
              {resultTitle && (
                <span className="text-slate-400 text-sm italic">{resultTitle}</span>
              )}
            </div>
          )}
          {result.summary && (
            <p className="text-slate-300 text-sm leading-relaxed max-w-lg">{result.summary}</p>
          )}
        </div>

        {/* Guest signup CTA */}
        {!isLoggedIn && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-flag/10 border border-flag/25 rounded-xl px-5 py-4">
            <div>
              <p className="text-white font-medium text-sm">
                {trialExhausted
                  ? 'You\'ve used all 5 free analyses.'
                  : `${remainingFree} free ${remainingFree === 1 ? 'analysis' : 'analyses'} remaining.`}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">Sign up to save your history and get unlimited analyses.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/signup" className="btn-primary text-sm py-2 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                Sign up free
              </Link>
              <Link href="/login" className="btn-ghost text-sm border border-turf-600">
                Sign in
              </Link>
            </div>
          </div>
        )}

        {/* Category cards */}
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4" />
            Detailed Breakdown
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.categories.map((cat, i) => (
              <AnalysisCard key={cat.name} category={cat} index={i} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!trialExhausted && (
            <button onClick={handleReset} className="btn-primary flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Analyze Another Swing
            </button>
          )}
          {isLoggedIn && (
            <Link href="/history" className="btn-ghost border border-turf-600 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              View History
            </Link>
          )}
          {!isLoggedIn && trialExhausted && (
            <Link href="/signup" className="btn-primary flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              Sign Up to Continue
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Guest trial counter */}
      {!isLoggedIn && (
        <div className="flex items-center justify-between bg-turf-800 border border-turf-600 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: FREE_TRIAL_LIMIT }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < trialCount ? 'bg-flag' : 'bg-turf-600'}`}
                />
              ))}
            </div>
            <span className="text-slate-400 text-sm">
              {FREE_TRIAL_LIMIT - trialCount} of {FREE_TRIAL_LIMIT} free analyses remaining
            </span>
          </div>
          <Link href="/signup" className="text-flag hover:text-flag-light text-xs font-medium transition-colors">
            Sign up for unlimited →
          </Link>
        </div>
      )}

      <VideoUploader
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        analysisStep={analysisStep}
      />

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-xl px-5 py-4">
          <strong className="font-semibold">Error: </strong>{error}
        </div>
      )}
    </div>
  )
}
