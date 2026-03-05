import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isAdminAuthenticated(request: NextRequest): boolean {
  const cookie = request.cookies.get('admin-session')?.value
  const adminKey = process.env.ADMIN_API_KEY
  // No key configured — allow in development, block in production
  if (!adminKey) return process.env.NODE_ENV !== 'production'
  return cookie === adminKey
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''
  const isAdmin = host.startsWith('admin.')

  // Admin API auth — protect /api/admin/* (except /api/admin/auth)
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth')) {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Admin page auth — protect /admin/* (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

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
