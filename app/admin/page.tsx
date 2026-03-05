'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { OccupationBar } from '@/components/admin/OccupationBar'

// --- Inline types (client component, no server imports) ---

interface SessionData {
  id: string
  serviceId: string
  date: string
  time: string
  durationMinutes: number
  maxSpots: number
  pricePen: number
  coachId: string | null
  status: string
  bookedSpots: number
  availableSpots: number
  occupationPct: number
  service_name_es?: string
  service?: {
    id: string
    name: { es: string; en: string }
    type: string
    resourceId: string | null
    durationMinutes: number
  }
  coach?: { id: string; name: string }
  resource?: { id: string; name: string }
}

interface BookingData {
  id: string
  sessionId: string
  name: string
  phone: string
  seats: number
  totalPen: number
  status: string
  lang: string
  createdAt: string
  session?: {
    id: string
    date: string
    time: string
    maxSpots: number
    service?: { name: { es: string; en: string } }
  }
}

// --- Helpers ---

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function formatTodayHeader(): string {
  const now = new Date()
  return now.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getServiceName(session: SessionData): string {
  return session.service_name_es || session.service?.name?.es || 'Servicio'
}

// --- Component ---

export default function AdminDashboard() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/sessions').then((r) => r.json()),
      fetch('/api/admin/bookings').then((r) => r.json()),
    ])
      .then(([sessionsRes, bookingsRes]) => {
        setSessions(sessionsRes.sessions ?? [])
        setBookings(bookingsRes.bookings ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  const today = getToday()

  // --- Derived data ---

  const todaySessions = sessions.filter(
    (s) => s.date === today && s.status === 'scheduled'
  )

  const todayBookings = bookings.filter(
    (b) => b.session?.date === today
  )

  const pendingBookings = bookings.filter((b) => b.status === 'pending')

  const avgOccupation =
    todaySessions.length > 0
      ? Math.round(
          todaySessions.reduce((sum, s) => sum + s.occupationPct, 0) /
            todaySessions.length
        )
      : 0

  const upcomingSessions = sessions
    .filter((s) => s.status === 'scheduled' && s.date >= today)
    .sort((a, b) => {
      const keyA = `${a.date}T${a.time}`
      const keyB = `${b.date}T${b.time}`
      return keyA.localeCompare(keyB)
    })
    .slice(0, 12)

  // --- Render ---

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-mono text-xs text-mid-gray tracking-widest animate-pulse">
          CARGANDO...
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-grotesk text-xl font-bold text-asphalt tracking-tight">
          Hoy &mdash; {formatTodayHeader()}
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Reservas hoy"
          value={todayBookings.length}
        />
        <StatCard
          label="Sesiones hoy"
          value={todaySessions.length}
        />
        <StatCard
          label="Pendientes"
          value={pendingBookings.length}
          badge={pendingBookings.length > 0 ? 'amber' : undefined}
        />
      </div>

      {/* Occupation bar */}
      <div className="p-4 border border-black/10 rounded-brutal bg-white">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] tracking-widest text-mid-gray uppercase">
            Ocupacion promedio hoy
          </span>
          <span
            className={`font-mono text-sm font-bold ${
              avgOccupation >= 80
                ? 'text-rojo'
                : avgOccupation >= 50
                  ? 'text-amber-600'
                  : 'text-mid-gray'
            }`}
          >
            {avgOccupation}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-black/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              avgOccupation >= 80
                ? 'bg-rojo'
                : avgOccupation >= 50
                  ? 'bg-amber-500'
                  : 'bg-asphalt/30'
            }`}
            style={{ width: `${Math.min(100, avgOccupation)}%` }}
          />
        </div>
      </div>

      {/* Upcoming sessions */}
      <div>
        <h2 className="font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-3">
          Proximas sesiones
        </h2>

        {upcomingSessions.length === 0 ? (
          <p className="font-mono text-xs text-mid-gray py-4">
            Sin sesiones programadas
          </p>
        ) : (
          <div className="space-y-1">
            {upcomingSessions.map((session) => {
              const endTime = addMinutes(session.time, session.durationMinutes)
              const serviceName = getServiceName(session)
              const isToday = session.date === today

              return (
                <div
                  key={session.id}
                  className="flex items-center gap-4 p-3 border border-black/10 rounded-brutal bg-white"
                >
                  {/* Date + time */}
                  <div className="flex-shrink-0 w-28">
                    {!isToday && (
                      <span className="font-mono text-[10px] text-mid-gray block">
                        {session.date}
                      </span>
                    )}
                    {isToday && (
                      <span className="font-mono text-[10px] text-rojo font-bold block">
                        HOY
                      </span>
                    )}
                    <span className="font-mono text-sm font-bold text-asphalt">
                      {session.time}
                    </span>
                    <span className="font-mono text-[10px] text-mid-gray">
                      {' '}&ndash;{' '}{endTime}
                    </span>
                  </div>

                  {/* Service + resource */}
                  <div className="flex-1 min-w-0">
                    <span className="font-grotesk text-sm font-medium text-asphalt block truncate">
                      {serviceName}
                    </span>
                    {session.resource && (
                      <span className="font-mono text-[10px] text-mid-gray">
                        {session.resource.name}
                      </span>
                    )}
                  </div>

                  {/* Occupation */}
                  <div className="flex-shrink-0">
                    <OccupationBar
                      bookedSpots={session.bookedSpots}
                      maxSpots={session.maxSpots}
                      occupationPct={session.occupationPct}
                      size="sm"
                    />
                  </div>

                  {/* Coach */}
                  {session.coach && (
                    <div className="flex-shrink-0 hidden sm:block">
                      <span className="font-mono text-[10px] text-cement">
                        {session.coach.name}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-3">
          Acciones rapidas
        </h2>
        <div className="flex flex-wrap gap-2">
          <QuickAction href="/admin/schedules" label="Horarios" />
          <QuickAction href="/admin/bookings" label="Ver reservas" />
          <QuickAction href="/admin/services" label="Servicios" />
        </div>
      </div>
    </div>
  )
}

// --- Sub-components ---

function StatCard({
  label,
  value,
  badge,
}: {
  label: string
  value: number
  badge?: 'amber'
}) {
  return (
    <div className="p-4 border border-black/10 rounded-brutal bg-white">
      <span className="font-mono text-[10px] tracking-widest text-mid-gray uppercase block mb-1">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="font-grotesk text-2xl font-bold text-asphalt">
          {value}
        </span>
        {badge === 'amber' && (
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        )}
      </div>
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
