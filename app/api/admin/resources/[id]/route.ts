import { NextRequest, NextResponse } from 'next/server'
import { getResourceById, updateResource, deleteResource } from '@/lib/booking-data'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const resource = await updateResource(id, body)

  if (!resource) {
    return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ resource })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const resource = await getResourceById(id)

  if (!resource) {
    return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })
  }

  try {
    await deleteResource(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Resource delete failed:', err)
    return NextResponse.json({ error: 'Error al eliminar recurso' }, { status: 409 })
  }
}
