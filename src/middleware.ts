import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/start', '/dashboard']
const AUTH_PATHS = ['/auth']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Redirect unauthenticated users away from protected paths
  if (!user && PROTECTED_PATHS.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth page
  if (user && AUTH_PATHS.some((p) => path.startsWith(p))) {
    const next = request.nextUrl.searchParams.get('next') ?? '/dashboard'
    const url = request.nextUrl.clone()
    url.pathname = next
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
