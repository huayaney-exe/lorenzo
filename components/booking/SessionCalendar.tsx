'use client'

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

const tileReveal = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.06 + i * 0.04,
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
}

export function SessionCalendar({ sessions, selectedDate, onSelectDate }: Props) {
  const { lang, t } = useLang()

  const dates = [...new Set(sessions.map((s) => s.date))].sort()

  if (dates.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="font-mono text-sm text-mid-gray">
          {lang === 'es'
            ? 'No hay fechas disponibles esta semana.'
            : 'No dates available this week.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <span className="block font-mono text-xs tracking-widest text-mid-gray uppercase mb-4">
        {t.book.selectDay}
      </span>

      <div className="flex gap-2.5 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-none">
        {dates.map((date, i) => {
          const d = new Date(date + 'T12:00:00')
          const dayName = d.toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-US', { weekday: 'short' }).toUpperCase()
          const dayNum = d.getDate()
          const monthName = d.toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-US', { month: 'short' }).toUpperCase().replace('.', '')
          const isSelected = selectedDate === date
          const sessionsForDate = sessions.filter((s) => s.date === date)
          const hasAvailability = sessionsForDate.some((s) => s.availableSpots > 0)
          const totalSlots = sessionsForDate.length
          const avgOccupation = totalSlots > 0
            ? Math.round(sessionsForDate.reduce((sum, s) => sum + s.occupationPct, 0) / totalSlots)
            : 0

          return (
            <motion.button
              key={date}
              onClick={() => hasAvailability && onSelectDate(date)}
              disabled={!hasAvailability}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={tileReveal}
              className={`
                flex-shrink-0 w-[88px] py-4 px-3 rounded-brutal text-center relative
                transition-colors duration-200
                ${isSelected
                  ? 'bg-asphalt text-white'
                  : hasAvailability
                    ? 'bg-white border border-black/[0.08] text-asphalt hover:border-black/20'
                    : 'bg-bone/40 border border-transparent text-mid-gray/30 cursor-not-allowed'
                }
              `}
              whileHover={hasAvailability && !isSelected ? { scale: 0.97 } : undefined}
              whileTap={hasAvailability ? { scale: 0.94 } : undefined}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            >
              <span className={`block font-mono text-[10px] tracking-widest leading-none ${
                isSelected ? 'text-white/60' : hasAvailability ? 'text-mid-gray' : 'text-mid-gray/30'
              }`}>
                {dayName}
              </span>
              <span className="block font-grotesk font-bold text-3xl leading-none mt-2 mb-1.5">
                {dayNum}
              </span>
              <span className={`block font-mono text-[10px] tracking-widest leading-none ${
                isSelected ? 'text-white/50' : hasAvailability ? 'text-mid-gray/60' : 'text-mid-gray/20'
              }`}>
                {monthName}
              </span>

              {/* Occupation dot */}
              {hasAvailability && (
                <span className={`block mx-auto mt-2.5 w-1.5 h-1.5 rounded-full ${
                  isSelected ? 'bg-white/40' : avgOccupation >= 80 ? 'bg-rojo' : avgOccupation >= 50 ? 'bg-amber-500' : 'bg-mid-gray/30'
                }`} />
              )}

              {/* Session count badge */}
              {hasAvailability && totalSlots > 1 && (
                <span className={`absolute -top-1.5 -right-1.5 font-mono text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-rojo text-white' : 'bg-asphalt text-white'
                }`}>
                  {totalSlots}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
