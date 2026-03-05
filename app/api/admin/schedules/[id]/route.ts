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
    const message = err instanceof Error ? err.message : 'Error deleting schedule'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
