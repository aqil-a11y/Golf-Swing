import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { filename, contentType } = await request.json() as { filename: string; contentType: string }

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType are required.' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storageKey = `temp/${Date.now()}-${safeFilename}`

    const { data, error } = await supabase.storage
      .from('golf-videos')
      .createSignedUploadUrl(storageKey)

    if (error || !data?.signedUrl) {
      console.error('Signed upload URL error:', error)
      return NextResponse.json({ error: 'Could not create upload URL.' }, { status: 500 })
    }

    return NextResponse.json({ storageKey, signedUploadUrl: data.signedUrl })
  } catch (err) {
    console.error('Upload route error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Request failed.' },
      { status: 500 }
    )
  }
}
