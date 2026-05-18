export interface AnalysisCategory {
  name: string
  rating: number
  observation: string
  tip: string
}

export interface AnalysisResult {
  categories: AnalysisCategory[]
  overall_rating: number
  summary: string
}

export interface Analysis {
  id: string
  user_id: string
  video_url: string
  analysis_json: AnalysisResult
  created_at: string
}
