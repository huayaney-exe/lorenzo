import { NextResponse } from 'next/server'
import { getActiveServices, getResources, generateAvailableSlots } from '@/lib/booking-data'

export async function GET() {
  // 2 queries: all active services + all resources (instead of N+1)
  const [services, resources] = await Promise.all([
    getActiveServices(),
    getResources(),
  ])

  const resourceMap = new Map(resources.map((r) => [r.id, r]))

  const result = await Promise.all(
    services.map(async (svc) => {
      const sessions = await generateAvailableSlots(svc.id)
      const nextSession = sessions[0]
      const resource = svc.resourceId ? resourceMap.get(svc.resourceId) ?? null : null

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
