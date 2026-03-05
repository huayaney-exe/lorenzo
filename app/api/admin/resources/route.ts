import { NextRequest, NextResponse } from 'next/server'
import { getResources, getServices, createResource } from '@/lib/booking-data'

export async function GET() {
  const [resources, services] = await Promise.all([getResources(), getServices()])
  const servicesByResource: Record<string, Array<{ id: string; name: string; type: string }>> = {}
  for (const svc of services) {
    if (svc.resourceId) {
      if (!servicesByResource[svc.resourceId]) servicesByResource[svc.resourceId] = []
      servicesByResource[svc.resourceId].push({ id: svc.id, name: svc.name.es, type: svc.type })
    }
  }
  return NextResponse.json({ resources, servicesByResource })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, capacity } = body

  if (!name || !capacity || capacity < 1) {
    return NextResponse.json({ error: 'Nombre y capacidad requeridos' }, { status: 400 })
  }

  const resource = await createResource({ name, capacity })
  return NextResponse.json({ resource }, { status: 201 })
}
