'use client'

import { useEffect, useState, useCallback } from 'react'
import { BookingStatusBadge } from '@/components/admin/StatusBadge'
import DayTimeline from '@/components/admin/DayTimeline'

interface BookingSession {
  date: string
  time: string
  durationMinutes: number
  maxSpots: number
  service?: {
    name: { es: string; en: string }
    type: string
  }
}

interface BookingService {
  pricingModel: 'per_person' | 'flat'
}

interface BookingEntry {
  id: string
  sessionId: string
  name: string
  phone: string
  seats: number
  totalPen: number
  addons: string[]
  status: 'pending' | 'approved' | 'rejected'
  lang: string
  createdAt: string
  session?: BookingSession
  service?: BookingService
}

interface ServiceOption {
  id: string
  name: { es: string; en: string }
}

interface CalendarData {
  date: string
  resources: Array<{
    id: string
    name: string
    capacity: number
    sessions: Array<{
      id: string
      serviceName: string
      time: string
      endTime: string
      durationMinutes: number
      maxSpots: number
      bookedSpots: number
      status: string
      bookings: Array<{
        id: string
        name: string
        phone: string
        seats: number
        status: 'pending' | 'approved' | 'rejected'
      }>
    }>
  }>
  unassigned: Array<{
    id: string
    serviceName: string
    time: string
    endTime: string
    durationMinutes: number
    maxSpots: number
    bookedSpots: number
    status: string
    bookings: Array<{
      id: string
      name: string
      phone: string
      seats: number
      status: 'pending' | 'approved' | 'rejected'
    }>
  }>
}

type ViewMode = 'list' | 'calendar'

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function todayLima(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
}

export default function BookingsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [bookings, setBookings] = useState<BookingEntry[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(todayLima)
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [calendarLoading, setCalendarLoading] = useState(false)

  // List filters
  const [filterService, setFilterService] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filterService) params.set('serviceId', filterService)
      if (filterStatus) params.set('status', filterStatus)
      if (filterFrom) params.set('from', filterFrom)
      if (filterTo) params.set('to', filterTo)

      const res = await fetch(`/api/admin/bookings?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar reservas')
      const data = await res.json()
      setBookings(data.bookings)
    } catch {
      setError('Error al cargar reservas')
    } finally {
      setLoading(false)
    }
  }, [filterService, filterStatus, filterFrom, filterTo])

  const fetchCalendar = useCallback(async () => {
    setCalendarLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/bookings?view=calendar&date=${calendarDate}`)
      if (!res.ok) throw new Error('Error al cargar calendario')
      const data = await res.json()
      setCalendarData(data)
    } catch {
      setError('Error al cargar calendario')
    } finally {
      setCalendarLoading(false)
    }
  }, [calendarDate])

  useEffect(() => {
    fetch('/api/admin/services')
      .then((r) => r.json())
      .then((data) => setServices(data.services ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (viewMode === 'list') fetchBookings()
  }, [fetchBookings, viewMode])

  useEffect(() => {
    if (viewMode === 'calendar') fetchCalendar()
  }, [fetchCalendar, viewMode])

  async function handleApprove(id: string) {
    setActionLoading(id)
    setError(null)

    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      if (!res.ok) throw new Error('Error al aprobar')
      await fetchBookings()
    } catch {
      setError('Error al aprobar reserva')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(id: string) {
    const confirmed = window.confirm('Rechazar esta reserva?')
    if (!confirmed) return

    setActionLoading(id)
    setError(null)

    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      })
      if (!res.ok) throw new Error('Error al rechazar')
      await fetchBookings()
    } catch {
      setError('Error al rechazar reserva')
    } finally {
      setActionLoading(null)
    }
  }

  function waLink(phone: string): string {
    const cleaned = phone.replace(/[^0-9]/g, '')
    return `https://wa.me/${cleaned}`
  }

  function shiftDate(days: number) {
    const d = new Date(calendarDate + 'T00:00:00')
    d.setDate(d.getDate() + days)
    setCalendarDate(d.toISOString().split('T')[0])
  }

  return (
    <div>
      {/* Header + View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-grotesk font-bold text-lg tracking-display text-asphalt">
          RESERVAS
        </h1>
        <div className="flex border border-black/10 rounded-brutal overflow-hidden">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 font-mono text-[10px] tracking-widest transition-colors ${
              viewMode === 'calendar'
                ? 'bg-asphalt text-white'
                : 'bg-white text-mid-gray hover:text-asphalt'
            }`}
          >
            CALENDARIO
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 font-mono text-[10px] tracking-widest border-l border-black/10 transition-colors ${
              viewMode === 'list'
                ? 'bg-asphalt text-white'
                : 'bg-white text-mid-gray hover:text-asphalt'
            }`}
          >
            LISTA
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="mb-6">
          {/* Date nav */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => shiftDate(-1)}
              className="px-2 py-1 border border-black/10 rounded-brutal bg-white font-mono text-sm text-asphalt hover:bg-bone transition-colors"
              aria-label="Dia anterior"
            >
              &larr;
            </button>
            <input
              type="date"
              value={calendarDate}
              onChange={(e) => setCalendarDate(e.target.value)}
              className="px-3 py-1.5 border border-black/10 rounded-brutal bg-bone font-mono text-sm text-asphalt
                focus:outline-none focus:border-asphalt/30 transition-colors"
            />
            <button
              onClick={() => shiftDate(1)}
              className="px-2 py-1 border border-black/10 rounded-brutal bg-white font-mono text-sm text-asphalt hover:bg-bone transition-colors"
              aria-label="Dia siguiente"
            >
              &rarr;
            </button>
            <button
              onClick={() => setCalendarDate(todayLima())}
              className="px-3 py-1.5 border border-black/10 rounded-brutal bg-white font-mono text-[10px] tracking-widest text-mid-gray hover:text-asphalt hover:bg-bone transition-colors"
            >
              HOY
            </button>
          </div>

          {calendarLoading && (
            <p className="font-mono text-xs text-mid-gray">Cargando calendario...</p>
          )}

          {!calendarLoading && calendarData && (
            <DayTimeline data={calendarData} />
          )}

          {/* Legend */}
          {!calendarLoading && calendarData && (
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-brutal bg-green-100 border border-green-400" />
                <span className="font-mono text-[10px] text-mid-gray">Confirmada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-brutal bg-amber-100 border border-amber-400" />
                <span className="font-mono text-[10px] text-mid-gray">Tiene pendientes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-brutal bg-black/5 border border-black/10" />
                <span className="font-mono text-[10px] text-mid-gray">Sin reservas</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && <>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end mb-6 p-4 border border-black/10 rounded-brutal bg-white">
        <div className="flex-1">
          <label className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-1">
            Servicio
          </label>
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="w-full px-3 py-2 border border-black/10 rounded-brutal bg-bone
              font-grotesk text-sm text-asphalt
              focus:outline-none focus:border-asphalt/30 transition-colors"
          >
            <option value="">Todos</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.name.es}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-40">
          <label className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-1">
            Estado
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-black/10 rounded-brutal bg-bone
              font-grotesk text-sm text-asphalt
              focus:outline-none focus:border-asphalt/30 transition-colors"
          >
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Aprobada</option>
            <option value="rejected">Rechazada</option>
          </select>
        </div>

        <div className="w-full sm:w-40">
          <label className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-1">
            Desde
          </label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="w-full px-3 py-2 border border-black/10 rounded-brutal bg-bone
              font-grotesk text-sm text-asphalt
              focus:outline-none focus:border-asphalt/30 transition-colors"
          />
        </div>

        <div className="w-full sm:w-40">
          <label className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="w-full px-3 py-2 border border-black/10 rounded-brutal bg-bone
              font-grotesk text-sm text-asphalt
              focus:outline-none focus:border-asphalt/30 transition-colors"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <p className="font-mono text-xs text-mid-gray">Cargando reservas...</p>
      )}

      {/* Empty */}
      {!loading && bookings.length === 0 && (
        <p className="font-mono text-xs text-mid-gray">
          No hay reservas con estos filtros.
        </p>
      )}

      {/* Booking list */}
      {!loading && bookings.length > 0 && (
        <div className="space-y-2">
          {bookings.map((booking) => {
            const session = booking.session
            const serviceName = session?.service?.name?.es ?? '—'
            const timeRange = session
              ? `${session.time} – ${addMinutes(session.time, session.durationMinutes)}`
              : ''
            const isFlat = booking.service?.pricingModel === 'flat'
            const isActioning = actionLoading === booking.id

            return (
              <div
                key={booking.id}
                className="p-4 border border-black/10 rounded-brutal bg-white"
              >
                {/* Row 1: Status + name + phone */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <BookingStatusBadge status={booking.status} />
                  <span className="font-grotesk font-bold text-sm text-asphalt">
                    {booking.name}
                  </span>
                  <a
                    href={waLink(booking.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-mid-gray hover:text-asphalt underline underline-offset-2 transition-colors"
                    aria-label={`Contactar a ${booking.name} por WhatsApp`}
                  >
                    {booking.phone}
                  </a>
                </div>

                {/* Row 2: Service details */}
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <span className="font-grotesk text-sm text-asphalt">
                    {serviceName}
                  </span>
                  {session && (
                    <>
                      <span className="font-mono text-[10px] text-mid-gray">
                        {session.date}
                      </span>
                      <span className="font-mono text-[10px] text-mid-gray">
                        {timeRange}
                      </span>
                    </>
                  )}
                  <span className="font-mono text-[10px] text-mid-gray">
                    {booking.seats} {booking.seats === 1 ? 'persona' : 'personas'}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-asphalt">
                    S/{booking.totalPen}
                  </span>
                  {isFlat && (
                    <span className="font-mono text-[10px] text-cement italic">
                      grupo
                    </span>
                  )}
                </div>

                {/* Row 3: Addons */}
                {booking.addons.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {booking.addons.map((addon, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center font-mono text-[10px] tracking-wide px-2 py-0.5 rounded-brutal border bg-amber-50 text-amber-700 border-amber-200"
                      >
                        {addon}
                      </span>
                    ))}
                  </div>
                )}

                {/* Row 4: Actions for pending bookings */}
                {booking.status === 'pending' && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/5">
                    <button
                      onClick={() => handleApprove(booking.id)}
                      disabled={isActioning}
                      className="px-4 py-1.5 bg-green-600 text-white font-mono text-[10px] tracking-widest
                        rounded-brutal hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isActioning ? '...' : 'APROBAR'}
                    </button>
                    <button
                      onClick={() => handleReject(booking.id)}
                      disabled={isActioning}
                      className="px-4 py-1.5 bg-rojo text-white font-mono text-[10px] tracking-widest
                        rounded-brutal hover:bg-rojo/80 transition-colors disabled:opacity-50"
                    >
                      {isActioning ? '...' : 'RECHAZAR'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      </>}

      {/* Error (shared) */}
      {error && (
        <div className="mt-4 p-3 border border-rojo/20 rounded-brutal bg-rojo/5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-rojo">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-rojo/60 hover:text-rojo text-sm ml-3"
              aria-label="Cerrar error"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
