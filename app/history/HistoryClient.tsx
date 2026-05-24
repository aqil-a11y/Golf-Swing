'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Analysis } from '@/lib/types'
import { AnalysisCard } from '@/components/AnalysisCard'
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Clock,
  BarChart2,
  PlusCircle,
} from 'lucide-react'

interface HistoryClientProps {
  analyses: Analysis[]
}

function ConfirmDeleteModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="card max-w-sm w-full">
        <div className="flex items-center justify-center w-12 h-12 bg-red-900/40 rounded-full mb-4 mx-auto">
          <Trash2 className="w-5 h-5 text-red-400" />
        </div>
        <h3 className="text-white font-semibold text-center mb-2">Delete Analysis?</h3>
        <p className="text-slate-400 text-sm text-center mb-6">
          This will permanently delete this analysis. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading} className="btn-ghost flex-1 border border-turf-600">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-700 hover:bg-red-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function HistoryItem({
  analysis,
  onDelete,
}: {
  analysis: Analysis
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const date = new Date(analysis.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const time = new Date(analysis.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/analyses/${analysis.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(analysis.id)
      }
    } catch {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      {showConfirm && (
        <ConfirmDeleteModal
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          loading={deleting}
        />
      )}

      <article className="card hover:bg-turf-800 transition-colors duration-200">
        {/* Top row */}
        <div className="flex items-start gap-4 mb-4">
          {/* Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Clock className="w-3 h-3" />
              {date} · {time}
              {analysis.club && (
                <span className="inline-flex items-center bg-flag/10 border border-flag/20 text-flag text-xs font-medium px-2 py-0.5 rounded-full ml-1">
                  {analysis.club}
                </span>
              )}
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">
              {analysis.title || 'Swing Analysis'}
            </h3>
            {analysis.analysis_json?.summary && (
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                {analysis.analysis_json.summary}
              </p>
            )}
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 border-t border-turf-700 pt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors font-medium"
          >
            <BarChart2 className="w-4 h-4" />
            {expanded ? 'Hide' : 'View'} full analysis
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowConfirm(true)}
            className="btn-danger ml-auto flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>

        {/* Expanded analysis */}
        {expanded && (
          <div className="mt-6 pt-6 border-t border-turf-700 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.analysis_json?.categories?.map((cat, i) => (
                <AnalysisCard key={cat.name} category={cat} index={i} />
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  )
}

const selectClass =
  'bg-turf-800 border border-turf-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-flag/50 [color-scheme:dark]'

export default function HistoryClient({ analyses: initialAnalyses }: HistoryClientProps) {
  const [analyses, setAnalyses] = useState(initialAnalyses)
  const [clubFilter, setClubFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const handleDelete = (id: string) => {
    setAnalyses((prev) => prev.filter((a) => a.id !== id))
  }

  if (analyses.length === 0) {
    return (
      <div className="card text-center py-20">
        <div className="w-16 h-16 bg-turf-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <BarChart2 className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">No analyses yet</h3>
        <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">
          Upload your first golf swing video and get instant AI coaching feedback.
        </p>
        <Link href="/analyze" className="btn-primary inline-flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Analyze Your First Swing
        </Link>
      </div>
    )
  }

  const clubs = Array.from(
    new Set(analyses.map((a) => a.club).filter((c): c is string => Boolean(c)))
  ).sort()

  const filtered = analyses
    .filter((a) => !clubFilter || a.club === clubFilter)
    .filter((a) => !dateFrom || a.created_at.slice(0, 10) >= dateFrom)
    .filter((a) => !dateTo || a.created_at.slice(0, 10) <= dateTo)
    .sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortOrder === 'newest' ? -diff : diff
    })

  return (
    <div className="space-y-4">
      {/* Filter / sort controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={clubFilter} onChange={(e) => setClubFilter(e.target.value)} className={selectClass}>
          <option value="">All clubs</option>
          {clubs.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
          className={selectClass}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs shrink-0">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={selectClass}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs shrink-0">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={selectClass}
          />
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-turf-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <BarChart2 className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">No analyses match your filters</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Try adjusting the club, date range, or sort order.
          </p>
        </div>
      ) : (
        filtered.map((analysis) => (
          <HistoryItem key={analysis.id} analysis={analysis} onDelete={handleDelete} />
        ))
      )}
    </div>
  )
}
