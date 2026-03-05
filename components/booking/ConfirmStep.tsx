'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useLang } from '@/lib/i18n'

interface ConfirmSession {
  id: string
  date: string
  time: string
  durationMinutes: number
  pricePen: number
  maxSpots: number
}

interface ConfirmService {
  name: Record<string, string>
  pricingModel: string
  pricePen: number
  resourceId: string | null
  resource: { name: string; capacity: number } | null
}

interface ConfirmBooking {
  name: string
  phone: string
  countryCode: string
  seats: number
}

interface AddonItem {
  id: string
  name: Record<string, string>
  pricingModel: string
  pricePen: number
}

interface Props {
  session: ConfirmSession
  service: ConfirmService
  booking: ConfirmBooking
  addons: AddonItem[]
  onBack: () => void
  lang: string
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function formatDateFull(dateStr: string, lang: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function formatAmount(amount: number): string {
  return amount >= 1000 ? `S/${amount.toLocaleString('es-PE')}` : `S/${amount}`
}

function computeLineTotal(pricingModel: string, pricePen: number, seats: number): number {
  return pricingModel === 'per_person' ? pricePen * seats : pricePen
}

const reveal = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 + i * 0.06,
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
}

export function ConfirmStep({ session, service, booking, addons, onBack, lang }: Props) {
  const router = useRouter()
  const { t } = useLang()
  const [submitting, setSubmitting] = useState(false)

  const endTime = addMinutes(session.time, session.durationMinutes)
  const baseTotal = computeLineTotal(service.pricingModel, session.pricePen, booking.seats)

  let grandTotal = baseTotal
  for (const addon of addons) {
    grandTotal += computeLineTotal(addon.pricingModel, addon.pricePen, booking.seats)
  }

  async function handleConfirm() {
    setSubmitting(true)

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          name: booking.name,
          phone: `${booking.countryCode}${booking.phone}`,
          seats: booking.seats,
          addons: addons.map((a) => a.id),
          lang,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        router.push(`/${lang}/book/failure`)
        return
      }

      // Open WhatsApp
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank')
      }

      router.push(`/${lang}/book/success?booking=${data.bookingId}`)
    } catch {
      router.push(`/${lang}/book/failure`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="space-y-5"
    >
      {/* Review card */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={reveal}
        className="bg-white border border-black/[0.08] rounded-brutal overflow-hidden"
      >
        {/* Dark header */}
        <div className="bg-asphalt px-5 py-4">
          <h3 className="font-grotesk font-bold text-white text-lg leading-tight">
            {service.name[lang]}
          </h3>
          <p className="font-mono text-sm tracking-wide text-white/50 mt-1 capitalize">
            {formatDateFull(session.date, lang)} · {session.time} - {endTime}
          </p>
        </div>

        {/* Details section */}
        <div className="px-5 py-4 space-y-3">
          {/* Seats */}
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-xs tracking-widest text-mid-gray uppercase">
              {t.book.form.seats}
            </span>
            <span className="font-grotesk text-sm text-asphalt">
              {booking.seats}
            </span>
          </div>

          {/* Contact */}
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-xs tracking-widest text-mid-gray uppercase">
              {t.footer.contact}
            </span>
            <div className="text-right">
              <span className="font-grotesk text-sm text-asphalt block">{booking.name}</span>
              <span className="font-mono text-xs text-mid-gray">
                {booking.countryCode} {booking.phone}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-black/[0.06]" />

          {/* Base price */}
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-xs tracking-widest text-mid-gray uppercase">
              {service.name[lang]}
            </span>
            <span className="font-mono text-sm text-cement">
              {service.pricingModel === 'per_person' ? (
                <>
                  {formatAmount(session.pricePen)} x {booking.seats} ={' '}
                  <span className="text-asphalt font-bold">{formatAmount(baseTotal)}</span>
                </>
              ) : (
                <span className="text-asphalt font-bold">{formatAmount(session.pricePen)}</span>
              )}
            </span>
          </div>

          {/* Addon prices */}
          {addons.map((addon) => {
            const addonTotal = computeLineTotal(addon.pricingModel, addon.pricePen, booking.seats)
            return (
              <div key={addon.id} className="flex justify-between items-baseline">
                <span className="font-mono text-xs tracking-widest text-mid-gray uppercase">
                  {addon.name[lang]}
                </span>
                <span className="font-mono text-sm text-cement">
                  {addon.pricingModel === 'per_person' ? (
                    <>
                      {formatAmount(addon.pricePen)} x {booking.seats} ={' '}
                      <span className="text-asphalt font-bold">{formatAmount(addonTotal)}</span>
                    </>
                  ) : (
                    <span className="text-asphalt font-bold">{formatAmount(addon.pricePen)}</span>
                  )}
                </span>
              </div>
            )
          })}

          {/* Separator */}
          <div className="h-px bg-black/[0.06]" />

          {/* Total */}
          <div className="flex justify-between items-baseline pt-1">
            <span className="font-mono text-xs tracking-widest text-asphalt uppercase font-bold">
              Total
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={grandTotal}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="font-grotesk font-bold text-2xl text-asphalt"
              >
                {formatAmount(grandTotal)}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Info note */}
      <motion.p
        custom={1}
        initial="hidden"
        animate="visible"
        variants={reveal}
        className="font-mono text-xs tracking-wide text-mid-gray text-center px-4"
      >
        {t.book.confirm.note}
      </motion.p>

      {/* CTA button */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={reveal}
      >
        <motion.button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full relative overflow-hidden font-grotesk font-bold text-sm tracking-display
                     bg-rojo text-white py-5 rounded-brutal
                     disabled:cursor-not-allowed
                     focus-visible:outline-rojo focus-visible:outline-2 focus-visible:outline-offset-2"
          whileHover={!submitting ? { scale: 0.985, backgroundColor: '#7A0600' } : undefined}
          whileTap={!submitting ? { scale: 0.975 } : undefined}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            {submitting ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                {lang === 'es' ? 'Enviando…' : 'Sending…'}
              </>
            ) : (
              t.book.confirm.whatsapp
            )}
          </span>
        </motion.button>
      </motion.div>

      {/* Back link */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={reveal}
        className="text-center"
      >
        <button
          onClick={onBack}
          className="font-mono text-xs tracking-widest text-mid-gray uppercase
                     hover:text-asphalt transition-colors inline-flex items-center gap-2"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="rotate-180"
          >
            <path
              d="M5 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t.book.confirm.edit}
        </button>
      </motion.div>
    </motion.div>
  )
}
