import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { key } = await req.json()
  const adminKey = process.env.ADMIN_API_KEY

  if (!adminKey) {
    // No key configured — allow in development
    if (process.env.NODE_ENV !== 'production') {
      const res = NextResponse.json({ ok: true })
      res.cookies.set('admin-session', 'dev', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      return res
    }
    return NextResponse.json({ error: 'Admin access not configured' }, { status: 503 })
  }

  if (key !== adminKey) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin-session', adminKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('admin-session')
  return res
}
