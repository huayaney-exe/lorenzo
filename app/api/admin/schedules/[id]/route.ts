import { NextRequest, NextResponse } from 'next/server'
import { deleteSchedule } from '@/lib/booking-data'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await deleteSchedule(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Schedule delete failed:', err)
    return NextResponse.json({ error: 'Error al eliminar horario' }, { status: 400 })
  }
}
