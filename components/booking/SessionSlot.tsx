'use client'

import { motion } from 'framer-motion'
import { useLang } from '@/lib/i18n'

interface SessionData {
  id: string
  serviceId: string
  date: string
  time: string
  durationMinutes: number
  pricePen: number
  maxSpots: number
  bookedSpots: number
  availableSpots: number
  occupationPct: number
  coach?: { name: string }
}

interface ServiceData {
  pricingModel: string
}

interface Props {
  session: SessionData
  isSelected: boolean
  onSelect: (session: SessionData) => void
  index: number
  service?: ServiceData
}

function formatPrice(amount: number): string {
  return amount >= 1000 ? `S/${amount.toLocaleString('es-PE')}` : `S/${amount}`
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function SessionSlot({ session, isSelected, onSelect, index, service }: Props) {
  const { t } = useLang()
  const isFull = session.availableSpots <= 0
  const isLow = session.availableSpots <= 2 && !isFull
  const endTime = addMinutes(session.time, session.durationMinutes)
  const occupationColor = session.occupationPct >= 80 ? 'bg-rojo' : session.occupationPct >= 50 ? 'bg-amber-500' : 'bg-asphalt/20'

  return (
    <motion.button
      onClick={() => !isFull && onSelect(session)}
      disabled={isFull}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.04 + index * 0.06,
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={`
        w-full text-left px-5 py-4 rounded-brutal transition-all duration-200 relative overflow-hidden
        ${isSelected
          ? 'bg-asphalt text-white ring-1 ring-asphalt'
          : isFull
            ? 'bg-bone/30 cursor-not-allowed'
            : 'bg-white border border-black/[0.08] hover:border-black/15'
        }
      `}
      whileHover={!isFull && !isSelected ? { scale: 0.985 } : undefined}
      whileTap={!isFull ? { scale: 0.975 } : undefined}
    >
      <div className="flex items-center justify-between">
        {/* Time range */}
        <div className="flex items-baseline gap-3">
          <span className={`font-mono font-bold text-[1.4rem] leading-none tracking-tight ${
            isFull ? 'text-mid-gray/30' : ''
          }`}>
            {session.time} — {endTime}
          </span>
        </div>

        {/* Price or full */}
        <div className="text-right">
          {isFull ? (
            <span className="font-mono text-xs tracking-widest text-mid-gray/40 uppercase">
              {t.book.full}
            </span>
          ) : (
            <div>
              <span className={`font-mono text-sm font-bold ${
                isSelected ? 'text-white' : 'text-asphalt'
              }`}>
                {formatPrice(session.pricePen)}
              </span>
              {service?.pricingModel === 'per_person' && (
                <span className={`block font-mono text-[9px] ${
                  isSelected ? 'text-white/40' : 'text-mid-gray/60'
                }`}>
                  pp
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Availability bar + info */}
      {!isFull && (
        <div className={`flex items-center justify-between mt-2.5 ${
          isSelected ? 'text-white/50' : 'text-mid-gray'
        }`}>
          <div className="flex items-center gap-2">
            {/* Occupation bar */}
            <div className="w-16 h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isSelected ? 'bg-white/40' : occupationColor
                }`}
                style={{ width: `${Math.min(100, session.occupationPct)}%` }}
              />
            </div>
            <span className="font-mono text-[11px]">
              {session.availableSpots} {t.book.spotsLeft}
            </span>
          </div>

          {/* Coach */}
          {session.coach?.name && (
            <span className={`font-mono text-[9px] ${
              isSelected ? 'text-white/30' : 'text-mid-gray/50'
            }`}>
              {session.coach.name}
            </span>
          )}
        </div>
      )}
    </motion.button>
  )
}
