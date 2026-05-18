import { AnalysisCategory } from '@/lib/types'
import { Lightbulb, MessageSquare } from 'lucide-react'

interface AnalysisCardProps {
  category: AnalysisCategory
  index: number
}

function getRatingColor(rating: number): string {
  if (rating >= 8) return 'bg-flag'
  if (rating >= 6) return 'bg-yellow-500'
  if (rating >= 4) return 'bg-orange-500'
  return 'bg-red-500'
}

function getRatingLabel(rating: number): string {
  if (rating >= 9) return 'Excellent'
  if (rating >= 7) return 'Good'
  if (rating >= 5) return 'Fair'
  if (rating >= 3) return 'Needs Work'
  return 'Poor'
}

export function AnalysisCard({ category, index }: AnalysisCardProps) {
  const ratingColor = getRatingColor(category.rating)
  const ratingLabel = getRatingLabel(category.rating)
  const fillPercent = (category.rating / 10) * 100

  return (
    <div
      className="card animate-slide-up hover:bg-turf-800 transition-colors duration-200"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <h3 className="text-white font-semibold text-base leading-tight pr-4">{category.name}</h3>
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl font-bold text-white">{category.rating}</span>
            <span className="text-slate-500 text-sm">/10</span>
          </div>
          <span
            className={`text-xs font-medium mt-0.5 ${
              category.rating >= 8
                ? 'text-flag'
                : category.rating >= 6
                ? 'text-yellow-400'
                : category.rating >= 4
                ? 'text-orange-400'
                : 'text-red-400'
            }`}
          >
            {ratingLabel}
          </span>
        </div>
      </div>

      {/* Rating bar */}
      <div className="rating-bar mb-5">
        <div
          className={`rating-fill ${ratingColor}`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      {/* Observation */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">
          <MessageSquare className="w-3 h-3" />
          Observation
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{category.observation}</p>
      </div>

      {/* Tip */}
      <div className="bg-flag/8 border border-flag/20 rounded-lg p-3">
        <div className="flex items-center gap-1.5 text-flag text-xs font-medium mb-1.5 uppercase tracking-wider">
          <Lightbulb className="w-3 h-3" />
          Improvement Tip
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{category.tip}</p>
      </div>
    </div>
  )
}
