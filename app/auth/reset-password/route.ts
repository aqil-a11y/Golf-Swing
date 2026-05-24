import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')

  // Neither a code nor a token_hash present — nothing we can do
  if (!code && (!token_hash || type !== 'recovery')) {
    return NextResponse.redirect(new URL('/login?error=reset_failed', request.url))
  }

  const redirectTo = new URL('/reset-password', request.url)
  const errorRedirect = new URL('/login?error=reset_failed', request.url)

  // Build the redirect response first so we can attach cookies to it
  const response = NextResponse.redirect(redirectTo)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // PKCE flow — exchange authorization code for a session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(errorRedirect)
    }
    return response
  }

  // OTP / token_hash flow (implicit / non-PKCE)
  const { error } = await supabase.auth.verifyOtp({ token_hash: token_hash!, type: 'recovery' })
  if (error) {
    return NextResponse.redirect(errorRedirect)
  }
  return response
}
