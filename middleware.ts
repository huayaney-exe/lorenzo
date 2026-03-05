import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''
  const isAdmin = host.startsWith('admin.')

  // Admin subdomain: rewrite to /admin/* routes
  if (isAdmin) {
    // Already on /admin path — pass through
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return NextResponse.next()
    }
    const url = request.nextUrl.clone()
    url.pathname = `/admin${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)
  }

  // www redirect
  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone()
    url.host = host.replace('www.', '')
    return NextResponse.redirect(url)
  }

  // Customer subdomain: i18n redirect for root
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/es', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
