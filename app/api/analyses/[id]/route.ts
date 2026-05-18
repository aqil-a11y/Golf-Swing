import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the analysis to verify ownership and get the video URL
    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('id, user_id, video_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !analysis) {
      return NextResponse.json({ error: 'Analysis not found.' }, { status: 404 })
    }

    // Extract the storage path from the public URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/golf-videos/<path>
    const storageMatch = analysis.video_url.match(/\/golf-videos\/(.+)$/)
    if (storageMatch) {
      const storagePath = storageMatch[1]
      await supabase.storage.from('golf-videos').remove([storagePath]).catch(console.error)
    }

    // Delete the database record
    const { error: deleteError } = await supabase
      .from('analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete analysis.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
