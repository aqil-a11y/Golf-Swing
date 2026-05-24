export interface AnalysisCategory {
  name: string
  observation: string
  drill: string
}

export interface AnalysisResult {
  categories: AnalysisCategory[]
  summary: string
}

export interface Analysis {
  id: string
  user_id: string
  video_url: string | null
  analysis_json: AnalysisResult
  title: string | null
  club: string | null
  created_at: string
}
