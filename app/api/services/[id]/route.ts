import { NextRequest, NextResponse } from 'next/server'
import {
  getServiceById,
  generateAvailableSlots,
  getAddonsByResource,
  getResourceById,
} from '@/lib/booking-data'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const service = await getServiceById(id)

  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 })
  }

  const sessions = await generateAvailableSlots(id)
  const addons = await getAddonsByResource(service.resourceId)
  const resource = service.resourceId ? await getResourceById(service.resourceId) : null

  return NextResponse.json({
    service: {
      ...service,
      resource: resource ? { id: resource.id, name: resource.name, capacity: resource.capacity } : null,
    },
    sessions,
    addons,
  })
}
