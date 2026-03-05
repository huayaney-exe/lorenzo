import { NextRequest, NextResponse } from 'next/server'
import { getAllBookings, type BookingStatus } from '@/lib/booking-data'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const serviceId = searchParams.get('serviceId') || undefined
  const status = (searchParams.get('status') as BookingStatus) || undefined
  const from = searchParams.get('from') || undefined
  const to = searchParams.get('to') || undefined

  const bookings = await getAllBookings({ serviceId, status, from, to })
  return NextResponse.json({ bookings })
}
