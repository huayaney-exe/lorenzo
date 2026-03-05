import { NextRequest, NextResponse } from 'next/server'
import { getServiceById, updateService, deleteService } from '@/lib/booking-data'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()

  try {
    const service = await updateService(id, body)
    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ service })
  } catch (err) {
    console.error('Service update failed:', err)
    return NextResponse.json({ error: 'Error al actualizar servicio' }, { status: 400 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const found = await getServiceById(id)
  if (!found) {
    return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  try {
    await deleteService(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Service delete failed:', err)
    return NextResponse.json({ error: 'Error al eliminar servicio' }, { status: 409 })
  }
}
