'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { upload } from '@vercel/blob/client'
import { Upload, Video, X, Play } from 'lucide-react'

interface VideoUploaderProps {
  onAnalyze: (blobUrl: string, mimeType: string) => void
  isAnalyzing: boolean
  analysisStep: string
}

const MAX_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime']

export function VideoUploader({ onAnalyze, isAnalyzing, analysisStep }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isAnalyzing) setIsUploading(false)
  }, [isAnalyzing])

  const setVideoFile = (f: File) => {
    setError(null)
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Please upload an MP4 or MOV video file.')
      return
    }
    if (f.size > MAX_SIZE) {
      setError('File is too large. Maximum size is 50MB.')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const dropped = e.dataTransfer.files[0]
      if (dropped) setVideoFile(dropped)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [previewUrl]
  )

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAnalyzeClick = async () => {
    if (!file) return
    setError(null)
    setIsUploading(true)
    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })
      onAnalyze(blob.url, file.type)
    } catch {
      setError('Upload failed. Please try again.')
      setIsUploading(false)
    }
  }

  const effectiveStep = isUploading && !isAnalyzing ? 'Uploading video...' : analysisStep
  const showLoading = isAnalyzing || isUploading

  const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(0)} KB`

  return (
    <div className="w-full">
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
            ${isDragging
              ? 'border-flag bg-flag/10 scale-[1.01]'
              : 'border-turf-600 hover:border-flag/50 hover:bg-turf-800/50'
            }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
              ${isDragging ? 'bg-flag/20' : 'bg-turf-800'}`}>
              <Upload className={`w-7 h-7 transition-colors ${isDragging ? 'text-flag' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="text-white font-semibold text-lg mb-1">
                {isDragging ? 'Drop your video here' : 'Upload your swing video'}
              </p>
              <p className="text-slate-400 text-sm">Drag & drop or click to browse</p>
              <p className="text-slate-600 text-xs mt-2">MP4 or MOV · Max 50MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Video preview */}
          <div className="relative rounded-2xl overflow-hidden bg-black border border-turf-600">
            <video
              src={previewUrl!}
              controls
              className="w-full max-h-80 object-contain"
            />
            {!showLoading && (
              <button
                onClick={clearFile}
                className="absolute top-3 right-3 w-8 h-8 bg-black/70 hover:bg-black rounded-full flex items-center justify-center transition-colors"
                aria-label="Remove video"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>

          {/* File info */}
          <div className="flex items-center gap-3 bg-turf-800 border border-turf-600 rounded-xl px-4 py-3">
            <div className="w-9 h-9 bg-flag/10 rounded-lg flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-flag" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{file.name}</p>
              <p className="text-slate-500 text-xs">{formatSize(file.size)}</p>
            </div>
          </div>

          {/* Analyze button / loading state */}
          {showLoading ? (
            <div className="card text-center py-8">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-turf-700 border-t-flag animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-4 h-4 text-flag" />
                  </div>
                </div>
              </div>
              <p className="text-white font-semibold mb-1">{effectiveStep || 'Analyzing...'}</p>
              <p className="text-slate-500 text-sm">This may take up to 60 seconds</p>

              {/* Progress steps */}
              <div className="flex items-center justify-center gap-2 mt-5">
                {['Uploading', 'Processing', 'Analyzing'].map((step, i) => {
                  const stepIdx = effectiveStep.includes('Uploading')
                    ? 0
                    : effectiveStep.includes('Processing') || effectiveStep.includes('AI')
                    ? 1
                    : 2
                  return (
                    <div key={step} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full transition-colors ${
                        i < stepIdx ? 'bg-flag' : i === stepIdx ? 'bg-flag animate-pulse' : 'bg-turf-700'
                      }`} />
                      <span className={`text-xs ${i <= stepIdx ? 'text-slate-300' : 'text-slate-600'}`}>{step}</span>
                      {i < 2 && <div className="w-4 h-px bg-turf-700" />}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <button
              onClick={handleAnalyzeClick}
              className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Analyze My Swing
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) setVideoFile(f)
        }}
      />
    </div>
  )
}
