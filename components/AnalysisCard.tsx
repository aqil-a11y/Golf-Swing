import { AnalysisCategory } from '@/lib/types'
import { Lightbulb, MessageSquare } from 'lucide-react'

interface AnalysisCardProps {
  category: AnalysisCategory
  index: number
}

export function AnalysisCard({ category, index }: AnalysisCardProps) {
  return (
    <div
      className="card animate-slide-up hover:bg-turf-800 transition-colors duration-200"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <h3 className="text-white font-semibold text-base leading-tight">{category.name}</h3>
      </div>

      {/* Observation */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">
          <MessageSquare className="w-3 h-3" />
          Observation
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{category.observation}</p>
      </div>

      {/* Drill */}
      <div className="bg-flag/8 border border-flag/20 rounded-lg p-3">
        <div className="flex items-center gap-1.5 text-flag text-xs font-medium mb-1.5 uppercase tracking-wider">
          <Lightbulb className="w-3 h-3" />
          Practice Drill
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{category.drill}</p>
      </div>
    </div>
  )
}
