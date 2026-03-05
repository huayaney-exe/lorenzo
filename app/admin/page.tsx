'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/format'

// --- Types ---

interface Booking {
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

interface ForecastDay {
  date: string
  dayOfWeek: number
  totalCapacity: number
  bookedSeats: number
  occupationPct: number
}

interface WebTraffic {
  visitorsToday: number
  pageviewsToday: number
  visitors3d: number
  pageviews3d: number
  topPages: Array<{ page: string; views: number }>
}

interface DashboardData {
  tomorrowBookings: { approved: Booking[]; pending: Booking[] }
  tomorrowOccupation: number
  forecast: ForecastDay[]
  revenue: {
    today: number
    yesterday: number
    thisWeek: number
    prevWeek: number
    thisMonth: number
    prevMonth: number
    bookingsThisMonth: number
  }
  webTraffic: WebTraffic | null
}

// --- Helpers ---

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function formatTomorrowHeader(): string {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }))
  d.setDate(d.getDate() + 1)
  const weekday = d.toLocaleDateString('es-PE', { weekday: 'long', timeZone: 'America/Lima' })
  const day = d.getDate()
  const month = d.toLocaleDateString('es-PE', { month: 'long', timeZone: 'America/Lima' })
  return `${weekday} ${day} de ${month}`
}

function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
}

function timeAgo(isoDate: string): string {
  const now = new Date()
  const created = new Date(isoDate)
  const diffMs = now.getTime() - created.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin}min`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `hace ${diffHrs}h`
  const diffDays = Math.floor(diffHrs / 24)
  return `hace ${diffDays}d`
}

function pctDelta(current: number, previous: number): { pct: number; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0 && current === 0) return { pct: 0, direction: 'flat' }
  if (previous === 0) return { pct: 100, direction: 'up' }
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return { pct: 0, direction: 'flat' }
  return { pct: Math.abs(pct), direction: pct > 0 ? 'up' : 'down' }
}

const DAY_HEADERS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']

function dayOfWeekToGridCol(dow: number): number {
  return dow === 0 ? 6 : dow - 1
}

// --- Component ---

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="h-16 bg-black/[0.06] rounded-brutal animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-black/[0.06] rounded-brutal animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-48 bg-black/[0.06] rounded-brutal animate-pulse" />
          <div className="h-48 bg-black/[0.06] rounded-brutal animate-pulse" />
        </div>
        <div className="h-52 bg-black/[0.06] rounded-brutal animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="font-mono text-sm text-mid-gray">Error al cargar el dashboard</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 border border-black/10 rounded-brutal bg-white
            font-mono text-xs tracking-widest text-asphalt
            hover:bg-asphalt hover:text-white transition-colors"
        >
          REINTENTAR
        </button>
      </div>
    )
  }

  const { tomorrowBookings, tomorrowOccupation, forecast, revenue } = data
  const allTomorrowBookings = [...tomorrowBookings.approved, ...tomorrowBookings.pending]
  const avgTicket = revenue.bookingsThisMonth > 0
    ? Math.round(revenue.thisMonth / revenue.bookingsThisMonth)
    : 0

  // Deltas
  const monthDelta = pctDelta(revenue.thisMonth, revenue.prevMonth)
  const weekDelta = pctDelta(revenue.thisWeek, revenue.prevWeek)
  const todayDelta = pctDelta(revenue.today, revenue.yesterday)

  // Forecast grid alignment
  const firstDow = forecast[0]?.dayOfWeek ?? 1
  const leadingEmpty = dayOfWeekToGridCol(firstDow)

  // Executive summary
  const summaryParts: string[] = []
  if (allTomorrowBookings.length > 0) {
    summaryParts.push(`${allTomorrowBookings.length} reserva${allTomorrowBookings.length === 1 ? '' : 's'} manana`)
    if (tomorrowBookings.pending.length > 0) {
      summaryParts.push(`${tomorrowBookings.pending.length} por confirmar`)
    }
  } else {
    summaryParts.push('Sin reservas manana')
  }
  if (revenue.thisMonth > 0 && revenue.prevMonth > 0) {
    const dir = monthDelta.direction === 'up' ? '+' : monthDelta.direction === 'down' ? '-' : ''
    summaryParts.push(`mes va ${dir}${monthDelta.pct}% vs anterior`)
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ── EXECUTIVE SUMMARY ── */}
      <div className="p-4 border border-black/10 rounded-brutal bg-white">
        <p className="font-grotesk text-base text-asphalt">
          {summaryParts.join('. ')}.
        </p>
      </div>

      {/* ── LENS 1: FINANCIAL PULSE ── */}
      <div>
        <SectionLabel>Ingresos</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <RevenueCard
            label="Hoy"
            value={formatPrice(revenue.today)}
            delta={todayDelta}
            deltaLabel="vs ayer"
          />
          <RevenueCard
            label="Semana"
            value={formatPrice(revenue.thisWeek)}
            delta={weekDelta}
            deltaLabel="vs sem ant"
          />
          <RevenueCard
            label="Mes"
            value={formatPrice(revenue.thisMonth)}
            delta={monthDelta}
            deltaLabel="vs mes ant"
          />
          <RevenueCard
            label="Ticket promedio"
            value={avgTicket > 0 ? formatPrice(avgTicket) : '\u2014'}
          />
        </div>
      </div>

      {/* ── LENS 1.5: WEB TRAFFIC ── */}
      {data.webTraffic && (
        <div>
          <SectionLabel>Trafico web</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <RevenueCard label="Visitantes hoy" value={String(data.webTraffic.visitorsToday)} />
            <RevenueCard label="Paginas hoy" value={String(data.webTraffic.pageviewsToday)} />
            <RevenueCard label="Visitantes 3d" value={String(data.webTraffic.visitors3d)} />
            <RevenueCard label="Paginas 3d" value={String(data.webTraffic.pageviews3d)} />
          </div>
          {data.webTraffic.topPages.length > 0 && (
            <div className="mt-3 p-4 border border-black/10 rounded-brutal bg-white">
              <span className="font-mono text-xs tracking-widest text-mid-gray uppercase block mb-2">
                Paginas mas visitadas
              </span>
              <div className="space-y-1.5">
                {data.webTraffic.topPages.map((p) => (
                  <div key={p.page} className="flex items-center justify-between">
                    <span className="font-mono text-sm text-asphalt truncate">{p.page}</span>
                    <span className="font-mono text-xs text-mid-gray whitespace-nowrap ml-3">
                      {p.views} vistas
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LENS 2: OPERATIONAL READINESS — Tomorrow ── */}
      <div>
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="font-grotesk text-lg font-bold text-asphalt tracking-tight uppercase">
            Manana &mdash; {formatTomorrowHeader()}
          </h1>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <SectionLabel noMargin>
            {allTomorrowBookings.length} {allTomorrowBookings.length === 1 ? 'reserva' : 'reservas'}
          </SectionLabel>
          {allTomorrowBookings.length > 0 && (
            <OccupationBadge pct={tomorrowOccupation} />
          )}
        </div>

        {allTomorrowBookings.length === 0 ? (
          <div className="p-8 border border-black/10 rounded-brutal bg-white text-center">
            <p className="font-mono text-sm text-mid-gray">Sin reservas para manana</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Confirmed column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="font-mono text-xs tracking-widest text-asphalt uppercase font-bold">
                  Confirmadas ({tomorrowBookings.approved.length})
                </span>
              </div>
              <div className="space-y-2">
                {tomorrowBookings.approved.length === 0 ? (
                  <EmptyColumn>Ninguna confirmada</EmptyColumn>
                ) : (
                  tomorrowBookings.approved.map((b) => (
                    <BookingCard key={b.id} booking={b} variant="approved" />
                  ))
                )}
              </div>
            </div>

            {/* Pending column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-mono text-xs tracking-widest text-asphalt uppercase font-bold">
                  Por confirmar ({tomorrowBookings.pending.length})
                </span>
              </div>
              <div className="space-y-2">
                {tomorrowBookings.pending.length === 0 ? (
                  <EmptyColumn>Ninguna pendiente</EmptyColumn>
                ) : (
                  tomorrowBookings.pending.map((b) => (
                    <BookingCard key={b.id} booking={b} variant="pending" />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── LENS 3: DEMAND SIGNAL — 28-day forecast ── */}
      <div>
        <SectionLabel>Ocupacion &mdash; Proximas 4 semanas</SectionLabel>

        <div className="p-4 sm:p-5 border border-black/10 rounded-brutal bg-white">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="text-center font-mono text-[11px] font-bold text-mid-gray tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {[...Array(leadingEmpty)].map((_, i) => (
              <div key={`empty-${i}`} className="h-12 sm:h-14" />
            ))}

            {forecast.map((day) => {
              const dayNum = parseInt(day.date.split('-')[2], 10)
              const hasCap = day.totalCapacity > 0
              const pct = day.occupationPct
              const bg = !hasCap
                ? 'bg-black/[0.03]'
                : pct >= 100
                  ? 'bg-rojo/15'
                  : pct >= 80
                    ? 'bg-amber-200'
                    : pct >= 50
                      ? 'bg-amber-50'
                      : pct > 0
                        ? 'bg-green-50'
                        : 'bg-white'

              return (
                <div
                  key={day.date}
                  className={`h-12 sm:h-14 flex flex-col items-center justify-center rounded-brutal border border-black/[0.06] ${bg}`}
                  title={`${day.date}: ${day.bookedSeats}/${day.totalCapacity} spots`}
                >
                  <span className="font-mono text-sm font-bold text-asphalt leading-none">
                    {dayNum}
                  </span>
                  <span className="font-mono text-[11px] text-mid-gray leading-none mt-0.5">
                    {hasCap ? `${pct}%` : '\u2014'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <LegendItem color="bg-black/[0.06]" label="Sin servicio" />
            <LegendItem color="bg-white border border-black/[0.08]" label="0%" />
            <LegendItem color="bg-green-100" label="1-49%" />
            <LegendItem color="bg-amber-100" label="50-79%" />
            <LegendItem color="bg-amber-300" label="80-99%" />
            <LegendItem color="bg-rojo/20" label="100%+" />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <SectionLabel>Acciones rapidas</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <QuickAction href="/admin/schedules" label="Horarios" />
          <QuickAction href="/admin/bookings" label="Reservas" />
          <QuickAction href="/admin/services" label="Servicios" />
        </div>
      </div>
    </div>
  )
}

// --- Sub-components ---

function SectionLabel({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) {
  return (
    <h2 className={`font-mono text-xs tracking-widest text-mid-gray uppercase ${noMargin ? '' : 'mb-3'}`}>
      {children}
    </h2>
  )
}

function OccupationBadge({ pct }: { pct: number }) {
  const style =
    pct >= 80
      ? 'bg-rojo/10 text-rojo'
      : pct >= 50
        ? 'bg-amber-100 text-amber-700'
        : 'bg-black/[0.06] text-mid-gray'

  return (
    <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-brutal ${style}`}>
      {pct}% ocupado
    </span>
  )
}

function EmptyColumn({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs text-mid-gray py-4 px-4 border border-dashed border-black/10 rounded-brutal text-center">
      {children}
    </p>
  )
}

function DeltaBadge({ delta, label }: { delta: { pct: number; direction: 'up' | 'down' | 'flat' }; label: string }) {
  if (delta.direction === 'flat') {
    return (
      <span className="font-mono text-[11px] text-cement">
        = {label}
      </span>
    )
  }

  const isUp = delta.direction === 'up'
  const color = isUp ? 'text-green-700' : 'text-rojo'
  const arrow = isUp ? '\u2191' : '\u2193'

  return (
    <span className={`font-mono text-[11px] font-bold ${color}`}>
      {arrow}{delta.pct}% <span className="font-normal text-cement">{label}</span>
    </span>
  )
}

function BookingCard({ booking, variant }: { booking: Booking; variant: 'approved' | 'pending' }) {
  const endTime = booking.time
    ? addMinutes(booking.time, booking.durationMinutes)
    : ''
  const borderColor = variant === 'approved' ? 'border-l-green-500' : 'border-l-amber-500'
  const isPending = variant === 'pending'
  const ago = booking.createdAt ? timeAgo(booking.createdAt) : ''

  return (
    <div className={`p-4 border border-black/10 rounded-brutal bg-white border-l-[3px] ${borderColor}`}>
      {/* Name + seats */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-grotesk text-base font-bold text-asphalt truncate">
          {booking.name}
        </span>
        <span className="font-mono text-xs text-mid-gray whitespace-nowrap">
          {booking.seats} {booking.seats === 1 ? 'persona' : 'personas'}
        </span>
      </div>

      {/* Service + urgency */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-xs text-cement">
          {booking.serviceName}
        </span>
        {isPending && ago && (
          <span className="font-mono text-[11px] font-bold text-amber-600">
            {ago}
          </span>
        )}
      </div>

      {/* Time + WhatsApp */}
      <div className="flex items-center justify-between">
        {booking.time ? (
          <span className="font-mono text-sm font-bold text-asphalt">
            {booking.time} &ndash; {endTime}
          </span>
        ) : (
          <span className="font-mono text-sm text-mid-gray">&mdash;</span>
        )}
        <a
          href={waLink(booking.phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white
            font-mono text-[11px] tracking-widest rounded-brutal
            hover:bg-green-700 transition-colors"
        >
          CONTACTAR
        </a>
      </div>
    </div>
  )
}

function RevenueCard({ label, value, delta, deltaLabel }: {
  label: string
  value: string
  delta?: { pct: number; direction: 'up' | 'down' | 'flat' }
  deltaLabel?: string
}) {
  return (
    <div className="p-4 border border-black/10 rounded-brutal bg-white">
      <span className="font-mono text-xs tracking-widest text-mid-gray uppercase block mb-1">
        {label}
      </span>
      <span className="font-grotesk text-2xl font-bold text-asphalt block">
        {value}
      </span>
      {delta && deltaLabel && (
        <div className="mt-1.5">
          <DeltaBadge delta={delta} label={deltaLabel} />
        </div>
      )}
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3.5 h-3.5 rounded-brutal ${color}`} />
      <span className="font-mono text-[11px] text-mid-gray">{label}</span>
    </div>
  )
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center px-4 py-2 border border-black/10 rounded-brutal bg-white
        font-mono text-xs tracking-widest text-asphalt
        hover:bg-asphalt hover:text-white transition-colors"
    >
      {label.toUpperCase()}
    </Link>
  )
}
