import { NextRequest, NextResponse } from 'next/server'
import { getAllSessions } from '@/lib/booking-data'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const serviceId = searchParams.get('serviceId') || undefined
  const from = searchParams.get('from') || undefined
  const to = searchParams.get('to') || undefined

  const sessions = await getAllSessions({ serviceId, from, to })
  return NextResponse.json({ sessions })
}
