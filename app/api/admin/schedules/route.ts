import { NextRequest, NextResponse } from 'next/server'
import { getSchedulesByService, bulkSetSchedules } from '@/lib/booking-data'

export async function GET(req: NextRequest) {
  const serviceId = req.nextUrl.searchParams.get('serviceId')
  if (!serviceId) {
    return NextResponse.json({ error: 'serviceId required' }, { status: 400 })
  }
  const schedules = await getSchedulesByService(serviceId)
  return NextResponse.json({ schedules })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { serviceId, schedules: entries } = body

  if (!serviceId || !Array.isArray(entries)) {
    return NextResponse.json({ error: 'serviceId and schedules array required' }, { status: 400 })
  }

  // Validate entries
  for (const entry of entries) {
    if (entry.dayOfWeek === undefined || !entry.startTime || !entry.endTime) {
      return NextResponse.json({ error: 'Each schedule needs dayOfWeek, startTime, endTime' }, { status: 400 })
    }
    if (entry.startTime >= entry.endTime) {
      return NextResponse.json({ error: 'startTime must be before endTime' }, { status: 400 })
    }
  }

  try {
    const created = await bulkSetSchedules(serviceId, entries)
    return NextResponse.json({ schedules: created })
  } catch (err) {
    console.error('Schedule save failed:', err)
    return NextResponse.json({ error: 'Error al guardar horarios' }, { status: 400 })
  }
}
