import { NextRequest, NextResponse } from 'next/server'
import { getAllBookings, getCalendarData, type BookingStatus } from '@/lib/booking-data'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Calendar view mode
  if (searchParams.get('view') === 'calendar') {
    const date = searchParams.get('date')
    if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })
    const data = await getCalendarData(date)
    return NextResponse.json(data)
  }

  // Default list view
  const serviceId = searchParams.get('serviceId') || undefined
  const status = (searchParams.get('status') as BookingStatus) || undefined
  const from = searchParams.get('from') || undefined
  const to = searchParams.get('to') || undefined

  const bookings = await getAllBookings({ serviceId, status, from, to })
  return NextResponse.json({ bookings })
}
