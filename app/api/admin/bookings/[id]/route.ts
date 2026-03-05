import { NextRequest, NextResponse } from 'next/server'
import { getBookingById, approveBooking, rejectBooking } from '@/lib/booking-data'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  const booking = await getBookingById(id)
  if (!booking) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }

  if (body.status === 'approved') {
    const updated = await approveBooking(id)
    if (!updated) {
      return NextResponse.json({ error: 'No se puede aprobar esta reserva' }, { status: 400 })
    }
    return NextResponse.json({ booking: updated })
  }

  if (body.status === 'rejected') {
    const updated = await rejectBooking(id)
    if (!updated) {
      return NextResponse.json({ error: 'No se puede rechazar esta reserva' }, { status: 400 })
    }
    return NextResponse.json({ booking: updated })
  }

  return NextResponse.json({ error: 'Accion no valida' }, { status: 400 })
}
