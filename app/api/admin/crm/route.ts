import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const sort = url.searchParams.get('sort') ?? 'name'
  const search = url.searchParams.get('q') ?? ''
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const limit = 30
  const offset = (page - 1) * limit

  // Aggregate customers from bookings (excluding rejected)
  // Group by phone to deduplicate
  const { data, error } = await supabase.rpc('get_crm_customers', {
    p_search: search,
    p_sort: sort,
    p_limit: limit,
    p_offset: offset,
  })

  if (error) {
    // Fallback: direct query if RPC doesn't exist yet
    console.error('CRM RPC error, using fallback:', error.message)
    return fallbackQuery(search, sort, limit, offset)
  }

  // Count total for pagination
  const { count } = await supabase
    .from('bookings')
    .select('phone', { count: 'exact', head: true })
    .neq('status', 'rejected')

  // Deduplicated count estimate
  const totalEstimate = Math.ceil((count ?? 0) / 2)

  return NextResponse.json({ customers: data ?? [], total: totalEstimate, page, limit })
}

async function fallbackQuery(search: string, sort: string, limit: number, offset: number) {
  // Raw SQL via supabase — aggregate bookings by phone
  let query = supabase
    .from('bookings')
    .select('name, phone, total_pen, seats, status, created_at, sessions!inner(date, services!inner(name_es))')
    .neq('status', 'rejected')

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(500)

  if (error) {
    console.error('CRM fallback error:', error)
    return NextResponse.json({ error: 'Error loading CRM' }, { status: 500 })
  }

  // Aggregate by phone in JS
  const customerMap = new Map<
    string,
    {
      name: string
      phone: string
      totalSpent: number
      totalBookings: number
      totalSeats: number
      lastVisit: string
      services: Set<string>
    }
  >()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (data ?? []) as any[]) {
    const sess = Array.isArray(row.sessions) ? row.sessions[0] : row.sessions
    const svc = sess?.services ? (Array.isArray(sess.services) ? sess.services[0] : sess.services) : null
    const existing = customerMap.get(row.phone)
    const serviceName: string = svc?.name_es ?? ''

    if (existing) {
      existing.totalSpent += Number(row.total_pen)
      existing.totalBookings += 1
      existing.totalSeats += Number(row.seats)
      if (sess?.date && sess.date > existing.lastVisit) {
        existing.lastVisit = sess.date
      }
      if (serviceName) existing.services.add(serviceName)
      // Keep most recent name
      if (row.created_at > existing.name) existing.name = row.name
    } else {
      customerMap.set(row.phone, {
        name: row.name,
        phone: row.phone,
        totalSpent: Number(row.total_pen),
        totalBookings: 1,
        totalSeats: Number(row.seats),
        lastVisit: sess?.date ?? '',
        services: new Set(serviceName ? [serviceName] : []),
      })
    }
  }

  let customers = Array.from(customerMap.values()).map((c) => ({
    ...c,
    services: Array.from(c.services),
  }))

  // Sort
  switch (sort) {
    case 'last_visit_asc':
      customers.sort((a, b) => a.lastVisit.localeCompare(b.lastVisit))
      break
    case 'last_visit_desc':
      customers.sort((a, b) => b.lastVisit.localeCompare(a.lastVisit))
      break
    case 'spent_desc':
      customers.sort((a, b) => b.totalSpent - a.totalSpent)
      break
    case 'bookings_desc':
      customers.sort((a, b) => b.totalBookings - a.totalBookings)
      break
    default: // name
      customers.sort((a, b) => a.name.localeCompare(b.name))
  }

  const total = customers.length
  customers = customers.slice(offset, offset + limit)

  return NextResponse.json({ customers, total, page: Math.floor(offset / limit) + 1, limit })
}
