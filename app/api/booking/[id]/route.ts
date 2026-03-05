import { NextRequest, NextResponse } from 'next/server'
import { getBookingById, getSessionById, getServiceById } from '@/lib/booking-data'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const booking = await getBookingById(id)

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const session = await getSessionById(booking.sessionId)
  const service = session ? await getServiceById(session.serviceId) : null

  return NextResponse.json({ booking, session, service })
}
