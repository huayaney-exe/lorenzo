import { NextRequest, NextResponse } from 'next/server'
import { getServices, getResources, createService } from '@/lib/booking-data'
import { supabase } from '@/lib/supabase'

function trimTime(t: string): string {
  return t.slice(0, 5)
}

export async function GET() {
  const [services, resources, schedulesRes] = await Promise.all([
    getServices(),
    getResources(),
    supabase
      .from('service_schedules')
      .select('service_id, day_of_week, start_time, end_time, active')
      .eq('active', true)
      .order('day_of_week')
      .order('start_time'),
  ])

  const resourceMap = new Map(resources.map((r) => [r.id, r]))

  const schedulesByService: Record<string, Array<{ dayOfWeek: number; startTime: string; endTime: string }>> = {}
  for (const row of schedulesRes.data ?? []) {
    const sid = row.service_id as string
    if (!schedulesByService[sid]) schedulesByService[sid] = []
    schedulesByService[sid].push({
      dayOfWeek: row.day_of_week as number,
      startTime: trimTime(row.start_time as string),
      endTime: trimTime(row.end_time as string),
    })
  }

  const result = services.map((svc) => ({
    ...svc,
    resource: svc.resourceId ? resourceMap.get(svc.resourceId) ?? null : null,
  }))

  return NextResponse.json({ services: result, schedulesByService })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  try {
    const service = await createService({
      slug: body.slug || '',
      name: body.name,
      description: body.description,
      type: body.type,
      resourceId: body.resourceId || null,
      pricingModel: body.pricingModel,
      pricePen: body.pricePen,
      maxSpots: body.maxSpots,
      durationMinutes: body.durationMinutes,
      isAddon: body.isAddon ?? false,
      active: body.active ?? true,
    })
    return NextResponse.json({ service }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Service create failed:', msg)
    return NextResponse.json({ error: `Error al crear servicio: ${msg}` }, { status: 400 })
  }
}
