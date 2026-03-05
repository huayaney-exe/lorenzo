'use client'

import { useState } from 'react'
import { BookingStatusBadge } from './StatusBadge'

interface CalendarBooking {
  id: string
  name: string
  phone: string
  seats: number
  status: 'pending' | 'approved' | 'rejected'
}

interface CalendarSession {
  id: string
  serviceName: string
  time: string
  endTime: string
  durationMinutes: number
  maxSpots: number
  bookedSpots: number
  status: string
  bookings: CalendarBooking[]
}

interface CalendarResource {
  id: string
  name: string
  capacity: number
  sessions: CalendarSession[]
}

interface CalendarData {
  date: string
  resources: CalendarResource[]
  unassigned: CalendarSession[]
}

const HOUR_START = 6
const HOUR_END = 20
const TOTAL_HOURS = HOUR_END - HOUR_START
const HOUR_WIDTH_PX = 120

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function blockStyle(time: string, durationMinutes: number) {
  const startMin = timeToMinutes(time) - HOUR_START * 60
  const leftPx = (startMin / 60) * HOUR_WIDTH_PX
  const widthPx = (durationMinutes / 60) * HOUR_WIDTH_PX
  return { left: `${leftPx}px`, width: `${Math.max(widthPx, 40)}px` }
}

function statusColor(status: string, selected: boolean): string {
  if (selected) {
    switch (status) {
      case 'confirmed':
        return 'bg-green-200 border-green-600 ring-2 ring-green-400/40'
      case 'has_pending':
        return 'bg-amber-200 border-amber-600 ring-2 ring-amber-400/40'
      default:
        return 'bg-black/10 border-black/20 ring-2 ring-black/10'
    }
  }
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 border-green-400 hover:bg-green-200'
    case 'has_pending':
      return 'bg-amber-100 border-amber-400 hover:bg-amber-200'
    default:
      return 'bg-black/5 border-black/10 hover:bg-black/10'
  }
}

function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
}

function SessionBlock({
  session,
  selected,
  onSelect,
}: {
  session: CalendarSession
  selected: boolean
  onSelect: () => void
}) {
  const style = blockStyle(session.time, session.durationMinutes)

  return (
    <div className="absolute top-1 bottom-1" style={style}>
      <button
        onClick={onSelect}
        className={`w-full h-full rounded-brutal border px-2 py-1 text-left cursor-pointer transition-all ${statusColor(session.status, selected)}`}
      >
        <div className="font-grotesk text-[11px] font-bold text-asphalt truncate leading-tight">
          {session.serviceName}
        </div>
        <div className="font-mono text-[10px] text-mid-gray leading-tight">
          {session.bookedSpots}/{session.maxSpots} pax
        </div>
      </button>
    </div>
  )
}

function SessionDetail({
  session,
  resourceName,
  onClose,
}: {
  session: CalendarSession
  resourceName: string
  onClose: () => void
}) {
  return (
    <div className="border-t border-black/10 bg-bone/30 px-4 py-4 animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-grotesk font-bold text-sm text-asphalt">
            {session.serviceName}
          </h3>
          <p className="font-mono text-[11px] text-mid-gray mt-0.5">
            {session.time} – {session.endTime} &middot; {resourceName} &middot; {session.bookedSpots}/{session.maxSpots} pax
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-brutal border border-black/10 bg-white text-mid-gray hover:text-asphalt hover:border-black/20 transition-colors text-sm leading-none"
          aria-label="Cerrar detalle"
        >
          &times;
        </button>
      </div>

      {session.bookings.length === 0 ? (
        <p className="font-mono text-[11px] text-cement italic">Sin reservas para esta sesion.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {session.bookings.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-3 p-2.5 bg-white border border-black/10 rounded-brutal"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <BookingStatusBadge status={b.status} />
                  <span className="font-grotesk text-xs font-bold text-asphalt truncate">
                    {b.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={waLink(b.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] text-mid-gray hover:text-asphalt underline underline-offset-2 transition-colors"
                  >
                    {b.phone}
                  </a>
                  <span className="font-mono text-[10px] text-mid-gray">
                    {b.seats} {b.seats === 1 ? 'pers.' : 'pers.'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DayTimeline({ data }: { data: CalendarData }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i)
  const gridWidth = TOTAL_HOURS * HOUR_WIDTH_PX

  const allRows = [
    ...data.resources.map((r) => ({ type: 'resource' as const, ...r })),
    ...(data.unassigned.length > 0
      ? [{ type: 'unassigned' as const, id: '_unassigned', name: 'Sin recurso', capacity: 0, sessions: data.unassigned }]
      : []),
  ]

  // Find selected session and its resource name
  let selectedSession: CalendarSession | null = null
  let selectedResourceName = ''
  if (selectedId) {
    for (const row of allRows) {
      const found = row.sessions.find((s) => s.id === selectedId)
      if (found) {
        selectedSession = found
        selectedResourceName = row.name
        break
      }
    }
  }

  if (allRows.length === 0) {
    return (
      <p className="font-mono text-xs text-mid-gray py-8 text-center">
        No hay recursos configurados.
      </p>
    )
  }

  const hasAnySessions = allRows.some((r) => r.sessions.length > 0)

  return (
    <div className="border border-black/10 rounded-brutal bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${gridWidth + 120}px` }}>
          {/* Hour header */}
          <div className="flex border-b border-black/10">
            <div className="w-[120px] shrink-0 px-3 py-2 bg-bone border-r border-black/10">
              <span className="font-mono text-[10px] tracking-widest text-mid-gray uppercase">
                Recurso
              </span>
            </div>
            <div className="flex relative">
              {hours.map((h) => (
                <div
                  key={h}
                  className="border-r border-black/5 px-1 py-2"
                  style={{ width: `${HOUR_WIDTH_PX}px` }}
                >
                  <span className="font-mono text-[10px] text-mid-gray">
                    {String(h).padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Resource rows */}
          {allRows.map((row) => (
            <div key={row.id} className="flex border-b border-black/5 last:border-b-0">
              <div className="w-[120px] shrink-0 px-3 py-3 bg-bone/50 border-r border-black/10 flex flex-col justify-center">
                <span className="font-grotesk text-xs font-bold text-asphalt leading-tight">
                  {row.name}
                </span>
                {row.type === 'resource' && (
                  <span className="font-mono text-[10px] text-cement">
                    cap. {row.capacity}
                  </span>
                )}
              </div>
              <div className="relative flex-1" style={{ height: '52px' }}>
                {/* Hour grid lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0 border-r border-black/5"
                    style={{ left: `${(h - HOUR_START) * HOUR_WIDTH_PX}px`, width: `${HOUR_WIDTH_PX}px` }}
                  />
                ))}

                {/* Session blocks */}
                {row.sessions.map((session) => (
                  <SessionBlock
                    key={session.id}
                    session={session}
                    selected={selectedId === session.id}
                    onSelect={() => setSelectedId(selectedId === session.id ? null : session.id)}
                  />
                ))}

                {/* Empty state for this row */}
                {row.sessions.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-[10px] text-cement italic">sin sesiones</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel — renders outside the scroll container */}
      {selectedSession && (
        <SessionDetail
          session={selectedSession}
          resourceName={selectedResourceName}
          onClose={() => setSelectedId(null)}
        />
      )}

      {!hasAnySessions && (
        <div className="py-6 text-center">
          <p className="font-mono text-xs text-mid-gray">Sin sesiones para este dia.</p>
        </div>
      )}
    </div>
  )
}
