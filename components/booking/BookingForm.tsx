'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '@/lib/i18n'

interface SessionData {
  id: string
  date: string
  time: string
  durationMinutes: number
  pricePen: number
  availableSpots: number
}

interface ServiceData {
  pricingModel: string
  pricePen: number
}

interface Props {
  session: SessionData
  service: ServiceData
  onSubmit: (data: { name: string; phone: string; countryCode: string; seats: number }) => void
  submitting: boolean
}

const COUNTRY_CODES = [
  { code: '+51', country: 'PE', flag: '🇵🇪' },
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+54', country: 'AR', flag: '🇦🇷' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+56', country: 'CL', flag: '🇨🇱' },
  { code: '+57', country: 'CO', flag: '🇨🇴' },
  { code: '+593', country: 'EC', flag: '🇪🇨' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
]

function formatPrice(amount: number): string {
  return amount >= 1000 ? `S/${amount.toLocaleString('es-PE')}` : `S/${amount}`
}

function formatDateFull(dateStr: string, lang: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const formReveal = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
}

export function BookingForm({ session, service, onSubmit, submitting }: Props) {
  const { lang, t } = useLang()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState(lang === 'es' ? '+51' : '+1')
  const [seats, setSeats] = useState(1)
  const [focused, setFocused] = useState<string | null>(null)

  const maxSeats = Math.min(session.availableSpots, service.pricingModel === 'flat' ? session.availableSpots : 6)
  const isFlat = service.pricingModel === 'flat'
  const total = isFlat ? session.pricePen : session.pricePen * seats
  const endTime = addMinutes(session.time, session.durationMinutes)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ name, phone, countryCode, seats })
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial="hidden"
      animate="visible"
      variants={formReveal}
      className="space-y-6"
    >
      {/* Session summary */}
      <div className="flex items-start justify-between pb-5 border-b border-black/[0.06]">
        <div>
          <span className="font-mono text-xs tracking-widest text-mid-gray uppercase">
            {t.book.yourSelection}
          </span>
          <p className="font-grotesk font-bold text-asphalt mt-1 capitalize">
            {formatDateFull(session.date, lang)}
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono font-bold text-lg text-asphalt">
            {session.time} — {endTime}
          </span>
          <span className="block font-mono text-[10px] text-mid-gray mt-0.5">
            {session.durationMinutes} {t.book.duration}
          </span>
        </div>
      </div>

      {/* Name field */}
      <div>
        <label className={`block font-mono text-xs tracking-widest uppercase mb-2.5 transition-colors duration-200 ${
          focused === 'name' ? 'text-asphalt' : 'text-mid-gray'
        }`}>
          {t.book.form.name}
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setFocused('name')}
          onBlur={() => setFocused(null)}
          placeholder={t.book.form.namePlaceholder}
          autoComplete="name"
          className="w-full font-grotesk text-[15px] text-asphalt bg-transparent
                     border-b-2 border-black/10 pb-2.5 outline-none
                     focus:border-asphalt transition-colors duration-300 placeholder:text-mid-gray/30"
        />
      </div>

      {/* Phone field */}
      <div>
        <label className={`block font-mono text-xs tracking-widest uppercase mb-2.5 transition-colors duration-200 ${
          focused === 'phone' ? 'text-asphalt' : 'text-mid-gray'
        }`}>
          {t.book.form.phone}
        </label>
        <div className="flex gap-0 border-b-2 border-black/10 focus-within:border-asphalt transition-colors duration-300">
          <div className="relative flex-shrink-0">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="appearance-none bg-transparent font-mono text-sm text-asphalt
                         pr-5 pb-2.5 outline-none cursor-pointer"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
            <svg className="absolute right-0.5 top-1/2 -translate-y-[60%] w-3 h-3 text-mid-gray/40 pointer-events-none" viewBox="0 0 12 12" fill="none">
              <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="self-stretch w-px bg-black/10 mx-2.5 mb-2.5" />
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onFocus={() => setFocused('phone')}
            onBlur={() => setFocused(null)}
            placeholder={t.book.form.phonePlaceholder}
            autoComplete="tel-national"
            className="flex-1 font-grotesk text-[15px] text-asphalt bg-transparent
                       pb-2.5 outline-none placeholder:text-mid-gray/30"
          />
        </div>
      </div>

      {/* Seats selector */}
      <div>
        <label className="block font-mono text-xs tracking-widest text-mid-gray uppercase mb-2.5">
          {t.book.form.seats}
        </label>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
            <motion.button
              key={n}
              type="button"
              onClick={() => setSeats(n)}
              className={`
                w-11 h-11 font-mono text-sm font-bold rounded-brutal transition-all duration-200
                ${seats === n
                  ? 'bg-asphalt text-white'
                  : 'bg-white border border-black/[0.08] text-cement hover:border-black/20'
                }
              `}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            >
              {n}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Total + Submit */}
      <div className="pt-5 border-t border-black/[0.06] space-y-4">
        <div>
          <span className="block font-mono text-xs tracking-widest text-mid-gray uppercase">
            {t.book.form.total}
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <AnimatePresence mode="wait">
              <motion.span
                key={total}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="font-grotesk font-bold text-3xl text-asphalt leading-none"
              >
                {formatPrice(total)}
              </motion.span>
            </AnimatePresence>
            {!isFlat && seats > 1 && (
              <span className="font-mono text-[10px] text-mid-gray">
                {seats} × {formatPrice(session.pricePen)}
              </span>
            )}
            {isFlat && (
              <span className="font-mono text-[10px] text-mid-gray">
                {lang === 'es' ? 'grupo' : 'group'}
              </span>
            )}
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={submitting || !name || !phone}
          className="w-full font-grotesk font-bold text-sm tracking-display
                     bg-rojo text-white py-4 rounded-brutal
                     disabled:opacity-30 disabled:cursor-not-allowed
                     focus-visible:outline-rojo focus-visible:outline-2 focus-visible:outline-offset-2"
          whileHover={!submitting && name && phone ? { scale: 0.985, backgroundColor: '#7A0600' } : undefined}
          whileTap={!submitting && name && phone ? { scale: 0.975 } : undefined}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        >
          {submitting ? '...' : t.book.form.submit}
        </motion.button>
      </div>
    </motion.form>
  )
}
