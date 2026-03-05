import { NextRequest, NextResponse } from 'next/server'
import { getServices, getResources, createService } from '@/lib/booking-data'

export async function GET() {
  const [services, resources] = await Promise.all([getServices(), getResources()])
  const resourceMap = new Map(resources.map((r) => [r.id, r]))
  const result = services.map((svc) => ({
    ...svc,
    resource: svc.resourceId ? resourceMap.get(svc.resourceId) ?? null : null,
  }))
  return NextResponse.json({ services: result })
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
  } catch (err) {
    console.error('Service create failed:', err)
    return NextResponse.json({ error: 'Error al crear servicio' }, { status: 400 })
  }
}
