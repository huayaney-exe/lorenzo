import { NextRequest, NextResponse } from 'next/server'
import {
  createBooking,
  getSessionById,
  getServiceById,
  buildWhatsAppUrl,
  materializeSlot,
} from '@/lib/booking-data'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sessionId, name, phone, seats, addons, lang } = body

  if (!sessionId || !name || !phone || !seats) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // Try to find existing session, or materialize a virtual slot
  let session = await getSessionById(sessionId)
  if (!session) {
    const materialized = await materializeSlot(sessionId)
    if (materialized) {
      session = await getSessionById(materialized.id)
    }
  }
  if (!session) {
    return NextResponse.json({ error: 'Sesion no encontrada' }, { status: 404 })
  }

  if (session.availableSpots < seats) {
    return NextResponse.json({ error: 'No hay suficientes lugares disponibles' }, { status: 400 })
  }

  try {
    const booking = await createBooking({
      sessionId: session.id,
      name,
      phone,
      seats,
      addons: addons || [],
      lang: lang || 'es',
    })

    const service = await getServiceById(session.serviceId)
    const whatsappUrl = service ? buildWhatsAppUrl(booking, session, service) : ''

    return NextResponse.json({ bookingId: booking.id, whatsappUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear reserva'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
