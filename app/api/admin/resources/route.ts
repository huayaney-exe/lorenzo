import { NextRequest, NextResponse } from 'next/server'
import { getResources, createResource } from '@/lib/booking-data'

export async function GET() {
  const resources = await getResources()
  return NextResponse.json({ resources })
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
