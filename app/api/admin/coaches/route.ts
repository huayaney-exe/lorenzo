import { NextRequest, NextResponse } from 'next/server'
import { getCoaches, createCoach } from '@/lib/booking-data'

export async function GET() {
  const coaches = await getCoaches()
  return NextResponse.json({ coaches })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, phone, role } = body

  if (!name || !phone) {
    return NextResponse.json({ error: 'Nombre y telefono requeridos' }, { status: 400 })
  }

  const coach = await createCoach({ name, phone, role: role || 'operator' })
  return NextResponse.json({ coach }, { status: 201 })
}
