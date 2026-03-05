'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SessionCalendar } from './SessionCalendar'
import { SessionSlot } from './SessionSlot'
import { BookingForm } from './BookingForm'
import { AddonPicker } from './AddonPicker'
import { ConfirmStep } from './ConfirmStep'
import { useLang } from '@/lib/i18n'

interface SessionData {
  id: string
  serviceId: string
  date: string
  time: string
  durationMinutes: number
  maxSpots: number
  pricePen: number
  bookedSpots: number
  availableSpots: number
  occupationPct: number
  coach?: { name: string }
}

interface ServiceData {
  id: string
  name: Record<string, string>
  pricingModel: string
  pricePen: number
  resourceId: string | null
  resource: { id: string; name: string; capacity: number } | null
  durationMinutes: number
}

interface AddonData {
  id: string
  name: Record<string, string>
  pricingModel: string
  pricePen: number
}

interface Props {
  sessions: SessionData[]
  service: ServiceData
  addons: AddonData[]
}

type Step = 'date' | 'time' | 'form' | 'confirm'

interface BookingData {
  name: string
  phone: string
  countryCode: string
  seats: number
}

const stepTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
}

export function BookingFlow({ sessions, service, addons }: Props) {
  const { t } = useLang()
  const [step, setStep] = useState<Step>('date')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null)
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])

  const sessionsForDate = selectedDate
    ? sessions.filter((s) => s.date === selectedDate)
    : []

  const stepLabels = [
    { key: 'date' as const, label: t.book.steps.date },
    { key: 'time' as const, label: t.book.steps.time },
    { key: 'form' as const, label: t.book.steps.details },
    { key: 'confirm' as const, label: t.book.steps.confirm },
  ]

  const currentStepIndex = stepLabels.findIndex((s) => s.key === step)

  function handleSelectDate(date: string) {
    setSelectedDate(date)
    setSelectedSession(null)
    setStep('time')
  }

  function handleSelectSession(session: SessionData) {
    setSelectedSession(session)
    setStep('form')
  }

  function handleFormSubmit(data: BookingData) {
    setBookingData(data)
    setStep('confirm')
  }

  function handleToggleAddon(addonId: string) {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    )
  }

  const selectedAddonServices = addons.filter((a) => selectedAddons.includes(a.id))

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="flex items-center">
        {stepLabels.map((s, i) => (
          <div key={s.key} className="flex items-center">
            {i > 0 && (
              <div className={`w-8 md:w-14 h-px mx-1.5 transition-colors duration-500 ${
                i <= currentStepIndex ? 'bg-asphalt' : 'bg-black/[0.08]'
              }`} />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <motion.span
                className={`w-8 h-8 rounded-full flex items-center justify-center
                  font-mono text-xs font-bold transition-all duration-500
                  ${i < currentStepIndex
                    ? 'bg-asphalt text-white'
                    : i === currentStepIndex
                      ? 'bg-rojo text-white'
                      : 'bg-transparent border border-black/[0.12] text-mid-gray/40'
                  }
                `}
                animate={i === currentStepIndex ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {i < currentStepIndex ? (
                  <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </motion.span>
              <span className={`font-mono text-[10px] tracking-wider ${
                i <= currentStepIndex ? 'text-asphalt' : 'text-mid-gray/40'
              }`}>
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 'date' && (
          <motion.div key="date" {...stepTransition}>
            <SessionCalendar
              sessions={sessions}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          </motion.div>
        )}

        {step === 'time' && selectedDate && (
          <motion.div key="time" {...stepTransition} className="space-y-4">
            <motion.button
              onClick={() => setStep('date')}
              className="font-mono text-xs tracking-widest text-mid-gray uppercase
                         hover:text-asphalt transition-colors flex items-center gap-2"
              whileTap={{ scale: 0.95 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="rotate-180">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t.book.steps.date}
            </motion.button>

            <span className="block font-mono text-xs tracking-widest text-mid-gray uppercase mb-3">
              {t.book.selectSession}
            </span>
            <div className="grid gap-2">
              {sessionsForDate.map((session, i) => (
                <SessionSlot
                  key={session.id}
                  session={session}
                  isSelected={selectedSession?.id === session.id}
                  onSelect={handleSelectSession}
                  index={i}
                  service={service}
                />
              ))}
            </div>
          </motion.div>
        )}

        {step === 'form' && selectedSession && (
          <motion.div key="form" {...stepTransition} className="space-y-6">
            <motion.button
              onClick={() => setStep('time')}
              className="font-mono text-xs tracking-widest text-mid-gray uppercase
                         hover:text-asphalt transition-colors flex items-center gap-2"
              whileTap={{ scale: 0.95 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="rotate-180">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t.book.steps.time}
            </motion.button>

            <BookingForm
              session={selectedSession}
              service={service}
              onSubmit={handleFormSubmit}
              submitting={false}
            />

            {addons.length > 0 && bookingData && (
              <AddonPicker
                addons={addons}
                selectedAddons={selectedAddons}
                onToggle={handleToggleAddon}
                seats={bookingData.seats}
                lang={service.name.es ? 'es' : 'en'}
              />
            )}
          </motion.div>
        )}

        {step === 'confirm' && selectedSession && bookingData && (
          <motion.div key="confirm" {...stepTransition}>
            <ConfirmStep
              session={selectedSession}
              service={service}
              booking={bookingData}
              addons={selectedAddonServices}
              onBack={() => setStep('form')}
              lang={service.name.es ? 'es' : 'en'}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
