import { NextRequest, NextResponse } from 'next/server'
import { getSessionById, updateSession, deleteSession } from '@/lib/booking-data'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const session = await updateSession(id, body)

  if (!session) {
    return NextResponse.json({ error: 'Sesion no encontrada' }, { status: 404 })
  }

  return NextResponse.json({ session })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const found = await getSessionById(id)
  if (!found) {
    return NextResponse.json({ error: 'Sesion no encontrada' }, { status: 404 })
  }

  try {
    await deleteSession(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Session delete failed:', err)
    return NextResponse.json({ error: 'Error al eliminar sesion' }, { status: 409 })
  }
}
