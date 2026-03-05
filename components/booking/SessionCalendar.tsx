'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '@/lib/i18n'

interface SessionData {
  id: string
  date: string
  time: string
  availableSpots: number
  occupationPct: number
}

interface Props {
  sessions: SessionData[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

const DAY_NAMES_ES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']
const DAY_NAMES_EN = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1)
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Monday=0 ... Sunday=6 */
function mondayBasedDay(d: Date): number {
  return (d.getDay() + 6) % 7
}

export function SessionCalendar({ sessions, selectedDate, onSelectDate }: Props) {
  const { lang, t } = useLang()

  const availableDates = useMemo(() => {
    const set = new Set<string>()
    for (const s of sessions) {
      if (s.availableSpots > 0) set.add(s.date)
    }
    return set
  }, [sessions])

  const occupationByDate = useMemo(() => {
    const map = new Map<string, { total: number; count: number; slots: number }>()
    for (const s of sessions) {
      const entry = map.get(s.date) ?? { total: 0, count: 0, slots: 0 }
      entry.total += s.occupationPct
      entry.count += 1
      entry.slots += s.availableSpots
      map.set(s.date, entry)
    }
    return map
  }, [sessions])

  // Initialize to the month of the first available date
  const firstAvailable = [...availableDates].sort()[0]
  const initDate = firstAvailable ? new Date(firstAvailable + 'T12:00:00') : new Date()
  const [viewYear, setViewYear] = useState(initDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initDate.getMonth())

  const dayNames = lang === 'es' ? DAY_NAMES_ES : DAY_NAMES_EN
  const monthLabel = new Date(viewYear, viewMonth, 1)
    .toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-US', { month: 'long', year: 'numeric' })

  const totalDays = daysInMonth(viewYear, viewMonth)
  const firstDayOffset = mondayBasedDay(startOfMonth(viewYear, viewMonth))

  const today = toDateStr(new Date())

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  // Check if there are available dates in prev/next months
  const hasAvailablePrev = [...availableDates].some((d) => {
    const dt = new Date(d + 'T12:00:00')
    return dt.getFullYear() < viewYear || (dt.getFullYear() === viewYear && dt.getMonth() < viewMonth)
  })
  const hasAvailableNext = [...availableDates].some((d) => {
    const dt = new Date(d + 'T12:00:00')
    return dt.getFullYear() > viewYear || (dt.getFullYear() === viewYear && dt.getMonth() > viewMonth)
  })

  if (availableDates.size === 0) {
    return (
      <div className="py-10 text-center">
        <p className="font-mono text-sm text-mid-gray">
          {lang === 'es'
            ? 'No hay fechas disponibles.'
            : 'No dates available.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <span className="block font-mono text-xs tracking-widest text-mid-gray uppercase mb-4">
        {t.book.selectDay}
      </span>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          disabled={!hasAvailablePrev}
          className="p-2 rounded-brutal text-mid-gray hover:text-asphalt hover:bg-bone
                     transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label={lang === 'es' ? 'Mes anterior' : 'Previous month'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <span className="font-grotesk font-bold text-sm text-asphalt capitalize">
          {monthLabel}
        </span>

        <button
          onClick={nextMonth}
          disabled={!hasAvailableNext}
          className="p-2 rounded-brutal text-mid-gray hover:text-asphalt hover:bg-bone
                     transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          aria-label={lang === 'es' ? 'Mes siguiente' : 'Next month'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((d) => (
          <span key={d} className="text-center font-mono text-[10px] tracking-widest text-mid-gray/60 py-2">
            {d}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isAvailable = availableDates.has(dateStr)
          const isSelected = selectedDate === dateStr
          const isToday = dateStr === today
          const isPast = dateStr < today

          const occ = occupationByDate.get(dateStr)
          const avgOcc = occ ? Math.round(occ.total / occ.count) : 0
          const slotsCount = occ?.count ?? 0

          return (
            <motion.button
              key={dateStr}
              onClick={() => isAvailable && onSelectDate(dateStr)}
              disabled={!isAvailable}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-brutal
                relative transition-all duration-150 text-center
                ${isSelected
                  ? 'bg-asphalt text-white'
                  : isAvailable
                    ? 'hover:bg-bone text-asphalt cursor-pointer'
                    : isPast
                      ? 'text-mid-gray/20 cursor-default'
                      : 'text-mid-gray/30 cursor-default'
                }
              `}
              whileTap={isAvailable ? { scale: 0.9 } : undefined}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            >
              <span className={`font-grotesk font-bold text-sm leading-none ${
                isSelected ? 'text-white' : ''
              }`}>
                {day}
              </span>

              {/* Availability dot */}
              {isAvailable && (
                <span className={`block w-1 h-1 rounded-full mt-1 ${
                  isSelected
                    ? 'bg-white/50'
                    : avgOcc >= 80
                      ? 'bg-rojo'
                      : avgOcc >= 50
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                }`} />
              )}

              {/* Today marker */}
              {isToday && !isSelected && (
                <span className="absolute bottom-0.5 w-4 h-0.5 rounded-full bg-rojo/40" />
              )}

              {/* Multiple slots badge */}
              {isAvailable && slotsCount > 1 && (
                <span className={`absolute -top-0.5 -right-0.5 font-mono text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-rojo text-white' : 'bg-asphalt text-white'
                }`}>
                  {slotsCount}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-black/[0.04]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="font-mono text-[9px] tracking-wide text-mid-gray">
            {lang === 'es' ? 'Disponible' : 'Available'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="font-mono text-[9px] tracking-wide text-mid-gray">
            {lang === 'es' ? 'Llenándose' : 'Filling up'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rojo" />
          <span className="font-mono text-[9px] tracking-wide text-mid-gray">
            {lang === 'es' ? 'Casi lleno' : 'Almost full'}
          </span>
        </div>
      </div>
    </div>
  )
}
