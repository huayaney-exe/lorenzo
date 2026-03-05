import { NextRequest, NextResponse } from 'next/server'
import { updateCoach, deleteCoach, getCoachById } from '@/lib/booking-data'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const coach = await updateCoach(id, body)

  if (!coach) {
    return NextResponse.json({ error: 'Coach no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ coach })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const found = await getCoachById(id)
  if (!found) {
    return NextResponse.json({ error: 'Coach no encontrado' }, { status: 404 })
  }

  await deleteCoach(id) // soft delete
  return NextResponse.json({ ok: true })
}
