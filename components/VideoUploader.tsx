'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Video, X, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CLUBS = [
  'Driver', '3 Wood', '5 Wood', '3 Iron', '4 Iron', '5 Iron',
  '6 Iron', '7 Iron', '8 Iron', '9 Iron', 'Pitching Wedge',
  'Gap Wedge', 'Sand Wedge', 'Lob Wedge', 'Putter',
]

interface VideoUploaderProps {
  onAnalyze: (signedUrl: string, storageKey: string, mimeType: string, club: string | null, title: string | null) => void
  isAnalyzing: boolean
  analysisStep: string
}

const MAX_SIZE = 200 * 1024 * 1024
const COMPRESS_THRESHOLD = 52_428_800  // 50 MB
const COMPRESS_TARGET = 41_943_040     // 40 MB
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime']

function getRecorderMimeType(): string {
  const candidates = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm']
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'
}

function compressVideo(file: File, targetBytes = COMPRESS_TARGET): Promise<File> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const videoEl = document.createElement('video')
    videoEl.muted = true
    videoEl.playsInline = true

    videoEl.onloadedmetadata = () => {
      const { duration, videoWidth, videoHeight } = videoEl
      if (!duration || !isFinite(duration)) {
        URL.revokeObjectURL(objectUrl)
        resolve(file)
        return
      }

      const videoBitsPerSecond = Math.floor((targetBytes * 8) / duration)
      const canvas = document.createElement('canvas')
      canvas.width = videoWidth || 1280
      canvas.height = videoHeight || 720
      const ctx = canvas.getContext('2d')!

      const mimeType = getRecorderMimeType()
      const stream = canvas.captureStream(30)
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond })
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        URL.revokeObjectURL(objectUrl)
        const blob = new Blob(chunks, { type: mimeType })
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const baseName = file.name.replace(/\.[^.]+$/, '')
        resolve(new File([blob], `${baseName}.${ext}`, { type: mimeType.split(';')[0] }))
      }
      recorder.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Compression failed.'))
      }

      const drawFrame = () => {
        if (!videoEl.paused && !videoEl.ended) {
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
        }
        if (!videoEl.ended) requestAnimationFrame(drawFrame)
      }

      recorder.start(250)
      videoEl.play().then(() => drawFrame()).catch(reject)
      videoEl.onended = () => recorder.stop()
    }

    videoEl.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read video file.'))
    }
    videoEl.src = objectUrl
  })
}

export function VideoUploader({ onAnalyze, isAnalyzing, analysisStep }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [club, setClub] = useState('')
  const [title, setTitle] = useState('')
  const [compressedFile, setCompressedFile] = useState<File | null>(null)
  const [showCompressionModal, setShowCompressionModal] = useState(false)
  const [compressionPass, setCompressionPass] = useState(0)
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
      setError('File is too large. Maximum size is 200MB.')
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
    setClub('')
    setTitle('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const runUpload = async (uploadFile: File) => {
    setIsUploading(true)

    // Step 1: get a signed upload URL (no file bytes hit Vercel)
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: uploadFile.name, contentType: uploadFile.type }),
    })
    if (!uploadRes.ok) throw new Error('Upload failed. Please try again.')

    const { storageKey, signedUploadUrl } = await uploadRes.json() as { storageKey: string; signedUploadUrl: string }

    // Step 2: PUT file directly to Supabase Storage (bypasses Vercel size limit)
    const putRes = await fetch(signedUploadUrl, {
      method: 'PUT',
      body: uploadFile,
      headers: { 'Content-Type': uploadFile.type },
    })
    if (!putRes.ok) throw new Error('Upload failed. Please try again.')

    // Step 3: get a signed download URL for the analyze step
    const supabase = createClient()
    const { data: signedData, error: signedError } = await supabase.storage
      .from('golf-videos')
      .createSignedUrl(storageKey, 600)

    if (signedError || !signedData?.signedUrl) {
      throw new Error('Could not get video URL. Please try again.')
    }

    return { storageKey, signedUrl: signedData.signedUrl }
  }

  const handleAnalyzeClick = async () => {
    if (!file) return
    setError(null)

    try {
      if (file.size > COMPRESS_THRESHOLD) {
        setIsCompressing(true)
        const result = await compressVideo(file)
        setIsCompressing(false)
        setCompressedFile(result)
        setShowCompressionModal(true)
        return
      }

      const { storageKey, signedUrl } = await runUpload(file)
      onAnalyze(signedUrl, storageKey, file.type, club || null, title.trim() || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setIsCompressing(false)
      setIsUploading(false)
    }
  }

  const handleRecompress = async () => {
    if (!file) return
    setIsCompressing(true)
    const newPass = compressionPass + 1
    setCompressionPass(newPass)
    const target = newPass === 1 ? 31_457_280 : 20_971_520
    try {
      const recompressed = await compressVideo(file, target)
      setCompressedFile(recompressed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compression failed.')
    } finally {
      setIsCompressing(false)
    }
  }

  const handleUploadCompressed = async () => {
    if (!compressedFile) return
    setError(null)
    setShowCompressionModal(false)
    setIsUploading(true)
    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: compressedFile.name, contentType: compressedFile.type }),
      })
      if (!uploadRes.ok) throw new Error(`Upload failed — file is ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB. Supabase requires files under 50MB. Try compressing again.`)

      const { storageKey, signedUploadUrl } = await uploadRes.json() as { storageKey: string; signedUploadUrl: string }

      const putRes = await fetch(signedUploadUrl, {
        method: 'PUT',
        body: compressedFile,
        headers: { 'Content-Type': compressedFile.type },
      })
      if (!putRes.ok) throw new Error(`Upload failed — file is ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB. Supabase requires files under 50MB. Try compressing again.`)

      const supabase = createClient()
      const { data: signedData, error: signedError } = await supabase.storage
        .from('golf-videos')
        .createSignedUrl(storageKey, 600)

      if (signedError || !signedData?.signedUrl) throw new Error('Could not get video URL. Please try again.')

      setShowCompressionModal(false)
      setCompressedFile(null)
      onAnalyze(signedData.signedUrl, storageKey, compressedFile.type, club || null, title.trim() || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      setIsUploading(false)
    }
  }

  const isBusy = isCompressing || isUploading || isAnalyzing
  const effectiveStep = isCompressing
    ? 'Compressing video...'
    : isUploading && !isAnalyzing
    ? 'Uploading video...'
    : analysisStep

  const stepIdx = effectiveStep.includes('Compressing') || effectiveStep.includes('Uploading')
    ? 0
    : effectiveStep.includes('Processing') || effectiveStep.includes('AI')
    ? 1
    : 2

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
            {!isBusy && (
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

          {/* Club selection and notes */}
          {!isBusy && (
            <>
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">Club (optional)</label>
                <select
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="w-full bg-turf-800 border border-turf-600 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-flag/50"
                >
                  <option value="">Select club (optional)</option>
                  {CLUBS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1.5">Notes (optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                  placeholder="e.g. Range session, working on takeaway"
                  maxLength={200}
                  className="w-full bg-turf-800 border border-turf-600 text-white rounded-xl px-3 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:border-flag/50"
                />
              </div>
            </>
          )}

          {/* Analyze button / loading state */}
          {isBusy ? (
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
                {['Uploading', 'Processing', 'Analyzing'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full transition-colors ${
                      i < stepIdx ? 'bg-flag' : i === stepIdx ? 'bg-flag animate-pulse' : 'bg-turf-700'
                    }`} />
                    <span className={`text-xs ${i <= stepIdx ? 'text-slate-300' : 'text-slate-600'}`}>{step}</span>
                    {i < 2 && <div className="w-4 h-px bg-turf-700" />}
                  </div>
                ))}
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

      {/* Compression confirmation modal */}
      {showCompressionModal && compressedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-turf-900 border border-turf-600 rounded-2xl p-8 max-w-sm w-full mx-4 space-y-5">
            <h2 className="text-white text-xl font-semibold">Video Compressed</h2>

            <p className="text-slate-300 text-sm">
              Compressed size: {(compressedFile.size / 1024 / 1024).toFixed(1)} MB
            </p>

            {compressedFile.size > 52_428_800 && (
              <p className="text-amber-400 text-sm">
                Still over 50MB — compress again or use a shorter clip
              </p>
            )}

            <button
              onClick={handleRecompress}
              disabled={isCompressing}
              className="w-full flex items-center justify-center gap-2 bg-turf-800 hover:bg-turf-700 border border-turf-600 text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCompressing ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-turf-600 border-t-white animate-spin" />
                  Compressing...
                </>
              ) : (
                'Compress Again'
              )}
            </button>

            <div className="space-y-1.5">
              <button
                onClick={handleUploadCompressed}
                disabled={compressedFile.size > 52_428_800 || isCompressing}
                className={`btn-primary w-full py-3 flex items-center justify-center gap-2 ${
                  compressedFile.size > 52_428_800 ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <Play className="w-4 h-4" />
                Upload & Analyze
              </button>
              {compressedFile.size > 52_428_800 && (
                <p className="text-slate-500 text-xs text-center">File must be under 50MB to upload</p>
              )}
            </div>

            <button
              onClick={() => {
                setCompressedFile(null)
                setShowCompressionModal(false)
                setCompressionPass(0)
                setIsCompressing(false)
              }}
              className="w-full text-slate-400 hover:text-white text-sm transition-colors py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
