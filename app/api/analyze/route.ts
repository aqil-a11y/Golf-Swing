import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 120

const ALLOWED_TYPES = ['video/mp4', 'video/quicktime']
const MAX_SIZE = 50 * 1024 * 1024

const ANALYSIS_PROMPT = `You are an expert golf coach. Analyze this golf swing video and provide structured feedback on: 1) Swing mechanics (posture, stance, grip, backswing, downswing, follow-through), 2) Club path and angle at impact, 3) Tempo and timing across the full swing. For each area give a rating out of 10, a 2-3 sentence observation, and one specific improvement tip. Return the response as JSON with EXACTLY this structure and no other text:
{
  "categories": [
    {
      "name": "Swing Mechanics",
      "rating": <number 1-10>,
      "observation": "<2-3 sentences>",
      "tip": "<one specific tip>"
    },
    {
      "name": "Club Path & Impact",
      "rating": <number 1-10>,
      "observation": "<2-3 sentences>",
      "tip": "<one specific tip>"
    },
    {
      "name": "Tempo & Timing",
      "rating": <number 1-10>,
      "observation": "<2-3 sentences>",
      "tip": "<one specific tip>"
    }
  ],
  "overall_rating": <average of the three ratings, rounded to 1 decimal>,
  "summary": "<2-3 sentence overall coaching summary>"
}`

export async function POST(request: NextRequest) {
  let tempPath: string | null = null

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Parse multipart form data
    const formData = await request.formData()
    const videoFile = formData.get('video') as File | null

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(videoFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an MP4 or MOV video.' },
        { status: 400 }
      )
    }

    if (videoFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    const videoBuffer = Buffer.from(await videoFile.arrayBuffer())

    // — Upload to Supabase Storage (authenticated users only) —
    let videoUrl: string | null = null

    if (user) {
      const safeFileName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `${user.id}/${Date.now()}-${safeFileName}`

      const { error: storageError } = await supabase.storage
        .from('golf-videos')
        .upload(storagePath, videoBuffer, {
          contentType: videoFile.type,
          upsert: false,
        })

      if (storageError) {
        console.error('Storage upload error:', storageError)
        return NextResponse.json({ error: 'Failed to upload video. Please try again.' }, { status: 500 })
      }

      const { data: urlData } = supabase.storage.from('golf-videos').getPublicUrl(storagePath)
      videoUrl = urlData.publicUrl
    }

    // — Write to temp file for Gemini File API —
    const ext = videoFile.type === 'video/quicktime' ? 'mov' : 'mp4'
    tempPath = join(tmpdir(), `swing-${Date.now()}.${ext}`)
    writeFileSync(tempPath, videoBuffer)

    // — Upload to Gemini File API —
    const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!)
    const uploadResult = await fileManager.uploadFile(tempPath, {
      mimeType: videoFile.type,
      displayName: 'Golf Swing Analysis',
    })

    // — Wait for Gemini to finish processing the video —
    const getFileWithRetry = async (name: string) => {
      for (let i = 0; i < 3; i++) {
        try {
          return await fileManager.getFile(name)
        } catch (err) {
          if (i === 2) throw err
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
      }
      throw new Error('Unreachable')
    }

    let geminiFile = await getFileWithRetry(uploadResult.file.name)
    let attempts = 0

    while (geminiFile.state === FileState.PROCESSING && attempts < 24) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      geminiFile = await getFileWithRetry(uploadResult.file.name)
      attempts++
    }

    if (geminiFile.state === FileState.FAILED) {
      throw new Error('Gemini could not process the video. Please try a shorter or simpler clip.')
    }

    if (geminiFile.state === FileState.PROCESSING) {
      throw new Error('Video processing timed out. Please try again with a shorter clip.')
    }

    // — Run Gemini analysis —
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const geminiResult = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      { text: ANALYSIS_PROMPT },
    ])

    const responseText = geminiResult.response.text()

    // — Parse JSON (handle optional markdown fencing) —
    let analysisJson
    try {
      const cleaned = responseText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
      analysisJson = JSON.parse(cleaned)
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/)
      if (match) {
        analysisJson = JSON.parse(match[0])
      } else {
        throw new Error('Could not parse the AI response. Please try again.')
      }
    }

    // Clean up the Gemini file (best-effort)
    fileManager.deleteFile(uploadResult.file.name).catch(() => {})

    // — Save to database for authenticated users; return raw JSON for guests —
    if (user && videoUrl) {
      const { data: dbData, error: dbError } = await supabase
        .from('analyses')
        .insert({
          user_id: user.id,
          video_url: videoUrl,
          analysis_json: analysisJson,
        })
        .select()
        .single()

      if (dbError) {
        console.error('DB insert error:', dbError)
        throw new Error('Failed to save the analysis. Please try again.')
      }

      return NextResponse.json({ analysis: dbData })
    }

    // Guest: return analysis without persisting
    return NextResponse.json({ analysis: { analysis_json: analysisJson } })
  } catch (err) {
    console.error('Analysis error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed. Please try again.' },
      { status: 500 }
    )
  } finally {
    if (tempPath) {
      try { unlinkSync(tempPath) } catch {}
    }
  }
}
