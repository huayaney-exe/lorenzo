import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// --- Date helpers (Lima timezone) ---

function limaDate(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }))
}

function limaToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
}

function limaTomorrow(): string {
  const d = limaDate()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function limaYesterday(): string {
  const d = limaDate()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

function limaWeekStart(): string {
  const d = limaDate()
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  return d.toISOString().split('T')[0]
}

function limaPrevWeekRange(): { start: string; end: string } {
  const d = limaDate()
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  // Previous week: Monday-Sunday before current week
  const prevEnd = new Date(d)
  prevEnd.setDate(d.getDate() - diff - 1) // Sunday before this Monday
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevEnd.getDate() - 6) // Monday of prev week
  return {
    start: prevStart.toISOString().split('T')[0],
    end: prevEnd.toISOString().split('T')[0],
  }
}

function limaMonthStart(): string {
  const d = limaDate()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function limaMonthEnd(): string {
  const d = limaDate()
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return last.toISOString().split('T')[0]
}

function limaPrevMonthRange(): { start: string; end: string } {
  const d = limaDate()
  const prevMonthEnd = new Date(d.getFullYear(), d.getMonth(), 0)
  const prevMonthStart = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1)
  return {
    start: prevMonthStart.toISOString().split('T')[0],
    end: prevMonthEnd.toISOString().split('T')[0],
  }
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function dayOfWeekJS(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDay()
}

function trimTime(t: string): string {
  return t.slice(0, 5)
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// --- PostHog helper ---

async function queryPostHog(hogql: string) {
  const key = process.env.POSTHOG_PERSONAL_API_KEY
  const projectId = process.env.POSTHOG_PROJECT_ID
  if (!key || !projectId) return null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(
      `https://us.i.posthog.com/api/projects/${projectId}/query/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: { kind: 'HogQLQuery', query: hogql } }),
        signal: controller.signal,
      }
    )
    clearTimeout(timeout)
    if (!res.ok) return null
    const data = await res.json()
    return data.results ?? null
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const today = limaToday()
    const yesterday = limaYesterday()
    const tomorrow = limaTomorrow()
    const weekStart = limaWeekStart()
    const prevWeek = limaPrevWeekRange()
    const monthStart = limaMonthStart()
    const monthEnd = limaMonthEnd()
    const prevMonth = limaPrevMonthRange()
    const forecastEnd = addDays(today, 27)

    // --- 6 Supabase queries (parallel) ---
    const [q1Sessions, q2Schedules, q3Forecast, q4Revenue, q5PrevMonth, q6PrevWeek] = await Promise.all([
      // Q1: Tomorrow's sessions
      supabase
        .from('sessions')
        .select('id, date, time, duration_minutes, max_spots, service_id, services!inner(name_es)')
        .eq('date', tomorrow)
        .eq('status', 'scheduled'),

      // Q2: Active schedules for capacity
      supabase
        .from('service_schedules')
        .select('day_of_week, start_time, end_time, services!inner(max_spots, duration_minutes, is_addon, active)')
        .eq('active', true),

      // Q3: 28-day forecast
      supabase
        .from('sessions_with_availability')
        .select('date, booked_spots')
        .eq('status', 'scheduled')
        .gte('date', today)
        .lte('date', forecastEnd),

      // Q4: Revenue — current month
      supabase
        .from('bookings')
        .select('total_pen, seats, sessions!inner(date)')
        .neq('status', 'rejected')
        .gte('sessions.date', monthStart)
        .lte('sessions.date', monthEnd),

      // Q5: Revenue — previous month (for delta)
      supabase
        .from('bookings')
        .select('total_pen, sessions!inner(date)')
        .neq('status', 'rejected')
        .gte('sessions.date', prevMonth.start)
        .lte('sessions.date', prevMonth.end),

      // Q6: Revenue — previous week (for delta)
      supabase
        .from('bookings')
        .select('total_pen, sessions!inner(date)')
        .neq('status', 'rejected')
        .gte('sessions.date', prevWeek.start)
        .lte('sessions.date', prevWeek.end),
    ])

    // --- PostHog queries (parallel, 3s timeout each — never blocks response) ---
    const phResult = await Promise.allSettled([
      queryPostHog(`
        SELECT
          countIf(DISTINCT person_id, timestamp > now() - interval 1 day) as visitors_today,
          countIf(timestamp > now() - interval 1 day) as pageviews_today,
          count(DISTINCT person_id) as visitors_3d,
          count() as pageviews_3d
        FROM events
        WHERE event = '$pageview' AND timestamp > now() - interval 3 day
      `),
      queryPostHog(`
        SELECT properties."$pathname" as page, count() as views
        FROM events
        WHERE event = '$pageview' AND timestamp > now() - interval 3 day
        GROUP BY page ORDER BY views DESC LIMIT 5
      `),
    ])
    const phTraffic = phResult[0].status === 'fulfilled' ? phResult[0].value : null
    const phPages = phResult[1].status === 'fulfilled' ? phResult[1].value : null

    // --- Q1b: Bookings for tomorrow's sessions (with created_at for urgency) ---
    const tomorrowSessionIds = (q1Sessions.data ?? []).map((s: Record<string, unknown>) => s.id as string)
    const q1Bookings = tomorrowSessionIds.length > 0
      ? await supabase
          .from('bookings')
          .select('id, name, phone, seats, total_pen, status, session_id, created_at')
          .in('session_id', tomorrowSessionIds)
          .in('status', ['pending', 'approved'])
      : { data: [], error: null }

    // --- Process Q1: Tomorrow's kanban ---
    type TomorrowSession = { id: string; time: string; duration_minutes: number; services: { name_es: string } }
    const sessionMap = new Map<string, TomorrowSession>()
    for (const s of (q1Sessions.data ?? []) as Record<string, unknown>[]) {
      const svc = Array.isArray(s.services) ? s.services[0] : s.services
      sessionMap.set(s.id as string, {
        id: s.id as string,
        time: trimTime(s.time as string),
        duration_minutes: s.duration_minutes as number,
        services: svc as { name_es: string },
      })
    }

    type BookingRow = { id: string; name: string; phone: string; seats: number; total_pen: number; status: string; session_id: string; created_at: string }
    const tomorrowBookingsRaw = (q1Bookings.data ?? []) as BookingRow[]

    type MappedBooking = {
      id: string
      name: string
      phone: string
      seats: number
      totalPen: number
      serviceName: string
      time: string
      durationMinutes: number
      createdAt: string
    }

    function mapBooking(b: BookingRow): MappedBooking {
      const session = sessionMap.get(b.session_id)
      return {
        id: b.id,
        name: b.name,
        phone: b.phone,
        seats: b.seats,
        totalPen: b.total_pen,
        serviceName: session?.services?.name_es ?? 'Servicio',
        time: session?.time ?? '',
        durationMinutes: session?.duration_minutes ?? 0,
        createdAt: b.created_at,
      }
    }

    const approved = tomorrowBookingsRaw.filter((b) => b.status === 'approved').map(mapBooking)
    const pending = tomorrowBookingsRaw.filter((b) => b.status === 'pending').map(mapBooking)

    // --- Process Q2: Capacity map ---
    const capacityByDay = new Map<number, number>()

    type ScheduleRow = {
      day_of_week: number
      start_time: string
      end_time: string
      services: { max_spots: number; duration_minutes: number; is_addon: boolean; active: boolean }
        | Array<{ max_spots: number; duration_minutes: number; is_addon: boolean; active: boolean }>
    }

    for (const row of (q2Schedules.data ?? []) as ScheduleRow[]) {
      const svc = Array.isArray(row.services) ? row.services[0] : row.services
      if (!svc || !svc.active || svc.is_addon) continue
      const startMin = timeToMinutes(trimTime(row.start_time))
      const endMin = timeToMinutes(trimTime(row.end_time))
      if (endMin <= startMin || svc.duration_minutes <= 0) continue
      const slots = Math.floor((endMin - startMin) / svc.duration_minutes)
      const dayCap = slots * svc.max_spots
      capacityByDay.set(row.day_of_week, (capacityByDay.get(row.day_of_week) ?? 0) + dayCap)
    }

    // --- Process Q3: 28-day forecast ---
    const bookedByDate = new Map<string, number>()
    for (const row of (q3Forecast.data ?? []) as { date: string; booked_spots: number }[]) {
      bookedByDate.set(row.date, (bookedByDate.get(row.date) ?? 0) + Number(row.booked_spots))
    }

    type ForecastDay = {
      date: string
      dayOfWeek: number
      totalCapacity: number
      bookedSeats: number
      occupationPct: number
    }

    const forecast: ForecastDay[] = []
    for (let i = 0; i < 28; i++) {
      const date = addDays(today, i)
      const dow = dayOfWeekJS(date)
      const totalCapacity = capacityByDay.get(dow) ?? 0
      const bookedSeats = bookedByDate.get(date) ?? 0
      const occupationPct = totalCapacity > 0
        ? Math.round((bookedSeats / totalCapacity) * 100)
        : 0
      forecast.push({ date, dayOfWeek: dow, totalCapacity, bookedSeats, occupationPct })
    }

    // Tomorrow occupation
    const tomorrowDow = dayOfWeekJS(tomorrow)
    const tomorrowCapacity = capacityByDay.get(tomorrowDow) ?? 0
    const tomorrowBooked = approved.reduce((s, b) => s + b.seats, 0) +
      pending.reduce((s, b) => s + b.seats, 0)
    const tomorrowOccupation = tomorrowCapacity > 0
      ? Math.round((tomorrowBooked / tomorrowCapacity) * 100)
      : 0

    // --- Process Q4: Current revenue ---
    type RevenueRow = { total_pen: number; seats?: number; sessions: { date: string } | Array<{ date: string }> }
    const revenueRows = (q4Revenue.data ?? []) as RevenueRow[]

    let revenueToday = 0
    let revenueYesterday = 0
    let revenueWeek = 0
    let revenueMonth = 0
    let bookingsMonth = 0

    for (const row of revenueRows) {
      const sess = Array.isArray(row.sessions) ? row.sessions[0] : row.sessions
      const date = sess?.date
      if (!date) continue

      const amount = Number(row.total_pen)
      revenueMonth += amount
      bookingsMonth++

      if (date === today) revenueToday += amount
      if (date === yesterday) revenueYesterday += amount
      if (date >= weekStart && date <= today) revenueWeek += amount
    }

    // --- Process Q5: Previous month revenue ---
    let prevMonthRevenue = 0
    for (const row of (q5PrevMonth.data ?? []) as RevenueRow[]) {
      prevMonthRevenue += Number(row.total_pen)
    }

    // --- Process Q6: Previous week revenue ---
    let prevWeekRevenue = 0
    for (const row of (q6PrevWeek.data ?? []) as RevenueRow[]) {
      prevWeekRevenue += Number(row.total_pen)
    }

    // --- Process PostHog ---
    let webTraffic: {
      visitorsToday: number
      pageviewsToday: number
      visitors3d: number
      pageviews3d: number
      topPages: Array<{ page: string; views: number }>
    } | null = null

    if (phTraffic && phTraffic.length > 0) {
      const [visitorsToday, pageviewsToday, visitors3d, pageviews3d] = phTraffic[0]
      webTraffic = {
        visitorsToday: Number(visitorsToday),
        pageviewsToday: Number(pageviewsToday),
        visitors3d: Number(visitors3d),
        pageviews3d: Number(pageviews3d),
        topPages: (phPages ?? []).map((r: [string, number]) => ({
          page: r[0],
          views: Number(r[1]),
        })),
      }
    }

    return NextResponse.json({
      tomorrowBookings: { approved, pending },
      tomorrowOccupation,
      forecast,
      revenue: {
        today: revenueToday,
        yesterday: revenueYesterday,
        thisWeek: revenueWeek,
        prevWeek: prevWeekRevenue,
        thisMonth: revenueMonth,
        prevMonth: prevMonthRevenue,
        bookingsThisMonth: bookingsMonth,
      },
      webTraffic,
    })
  } catch (err) {
    console.error('Dashboard API error:', err)
    return NextResponse.json({ error: 'Error loading dashboard' }, { status: 500 })
  }
}
