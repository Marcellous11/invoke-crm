import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))

  // Nuke all supabase-related cookies so stale sessions can't loop
  for (const cookie of ['sb-access-token', 'sb-refresh-token']) {
    response.cookies.set(cookie, '', { maxAge: 0, path: '/' })
  }

  return response
}
