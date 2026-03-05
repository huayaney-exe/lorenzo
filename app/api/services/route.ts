import { NextResponse } from 'next/server'
import { getActiveServices, generateAvailableSlots, getResourceById } from '@/lib/booking-data'

export async function GET() {
  const services = await getActiveServices()

  const result = await Promise.all(
    services.map(async (svc) => {
      const sessions = await generateAvailableSlots(svc.id)
      const nextSession = sessions[0]
      const resource = svc.resourceId ? await getResourceById(svc.resourceId) : null

      return {
        ...svc,
        resource: resource ? { id: resource.id, name: resource.name, capacity: resource.capacity } : null,
        nextAvailable: nextSession
          ? {
              date: nextSession.date,
              availableSpots: nextSession.availableSpots,
              occupationPct: nextSession.occupationPct,
            }
          : null,
        hasAvailability: sessions.some((s) => s.availableSpots > 0),
      }
    })
  )

  return NextResponse.json({ services: result })
}
