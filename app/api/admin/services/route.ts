import { NextRequest, NextResponse } from 'next/server'
import { getServices, createService, getResourceById } from '@/lib/booking-data'

export async function GET() {
  const services = await getServices()
  const result = await Promise.all(
    services.map(async (svc) => {
      const resource = svc.resourceId ? await getResourceById(svc.resourceId) : null
      return { ...svc, resource }
    })
  )
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
    const message = err instanceof Error ? err.message : 'Error al crear servicio'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
