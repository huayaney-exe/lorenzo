import { NextRequest, NextResponse } from 'next/server'
import {
  createBooking,
  getSessionById,
  getServiceById,
  getServicesByIds,
  getResourceById,
  buildWhatsAppUrl,
  materializeSlot,
} from '@/lib/booking-data'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { sessionId, name, phone, seats, addons, lang } = body as {
    sessionId?: string
    name?: string
    phone?: string
    seats?: number
    addons?: string[]
    lang?: string
  }

  // Required fields
  if (!sessionId || !name || !phone || !seats) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // Validate seats: integer between 1 and 20
  const seatsNum = Number(seats)
  if (!Number.isInteger(seatsNum) || seatsNum < 1 || seatsNum > 20) {
    return NextResponse.json({ error: 'Cantidad de personas invalida (1-20)' }, { status: 400 })
  }

  // Validate name: non-empty, max 100 chars, no HTML
  const cleanName = String(name).trim()
  if (cleanName.length === 0 || cleanName.length > 100 || /<[^>]*>/.test(cleanName)) {
    return NextResponse.json({ error: 'Nombre invalido' }, { status: 400 })
  }

  // Validate phone: digits, spaces, dashes, plus sign; 7-20 chars
  const cleanPhone = String(phone).trim()
  if (!/^\+?[\d\s\-()]{7,20}$/.test(cleanPhone)) {
    return NextResponse.json({ error: 'Telefono invalido' }, { status: 400 })
  }

  // Validate lang
  const validLang = lang === 'en' ? 'en' : 'es'

  // Validate addons array
  const cleanAddons = Array.isArray(addons) ? addons.filter((a): a is string => typeof a === 'string') : []

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

  if (session.availableSpots < seatsNum) {
    return NextResponse.json({ error: 'No hay suficientes lugares disponibles' }, { status: 400 })
  }

  try {
    const booking = await createBooking({
      sessionId: session.id,
      name: cleanName,
      phone: cleanPhone,
      seats: seatsNum,
      addons: cleanAddons,
      lang: validLang,
    })

    // Batch-fetch service + addons in parallel (1-2 queries instead of N+1)
    const [service, addonServices] = await Promise.all([
      getServiceById(session.serviceId),
      cleanAddons.length > 0 ? getServicesByIds(cleanAddons) : Promise.resolve([]),
    ])
    const resource = service?.resourceId ? await getResourceById(service.resourceId) : null
    const whatsappUrl = service ? buildWhatsAppUrl(booking, session, service, addonServices, resource) : ''

    return NextResponse.json({ bookingId: booking.id, whatsappUrl })
  } catch (err) {
    console.error('Booking creation failed:', err)
    return NextResponse.json({ error: 'Error al crear reserva' }, { status: 400 })
  }
}
