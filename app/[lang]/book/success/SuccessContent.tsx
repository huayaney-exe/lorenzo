'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '@/lib/i18n'
import { WHATSAPP_URL } from '@/lib/config'

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

const reveal = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 + i * 0.08,
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
}

export function SuccessContent() {
  const { lang, t } = useLang()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (bookingId) {
      fetch(`/api/booking/${bookingId}`)
        .then((r) => r.json())
        .then(setData)
        .catch(() => {})
    }
  }, [bookingId])

  const booking = data?.booking
  const session = data?.session
  const service = data?.service

  return (
    <section className="px-6 md:px-10 lg:px-16 py-16 md:py-24">
      <div className="max-w-md">
        {/* Animated success mark */}
        <motion.div
          className="w-14 h-14 bg-rojo rounded-brutal flex items-center justify-center mb-8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
        >
          <motion.svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
          >
            <motion.path
              d="M7 14l5 5L21 9"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
            />
          </motion.svg>
        </motion.div>

        {/* Confirmed label */}
        <motion.span
          custom={0}
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="block font-mono text-[10px] tracking-widest text-rojo uppercase mb-3"
        >
          {t.book.success.confirmed}
        </motion.span>

        <motion.h1
          custom={1}
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="font-grotesk font-bold tracking-wide-display text-asphalt leading-none mb-3"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
        >
          {t.book.success.title}
        </motion.h1>

        <motion.p
          custom={2}
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="font-grotesk text-lg text-cement mb-10"
        >
          {t.book.success.whatsappNote}
        </motion.p>

        {/* Booking details card */}
        {session && service && booking && (
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={reveal}
            className="bg-white border border-black/[0.08] rounded-brutal overflow-hidden mb-8"
          >
            {/* Card header */}
            <div className="bg-asphalt px-5 py-3.5">
              <span className="font-grotesk font-bold text-white text-sm uppercase tracking-display">
                {service.name?.[lang] || service.name?.es || 'Reserva'}
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-grotesk font-bold text-white/80 text-sm capitalize">
                  {formatDateFull(session.date, lang)}
                </span>
                <span className="font-mono font-bold text-white text-lg">
                  {session.time} — {addMinutes(session.time, session.durationMinutes)}
                </span>
              </div>
            </div>

            {/* Card body */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="font-grotesk text-sm text-cement">
                  {booking.seats} {booking.seats === 1 ? t.book.spot : t.book.spots}
                </span>
                <span className="font-mono text-sm font-bold text-asphalt">
                  {formatPrice(booking.totalPen)}
                </span>
              </div>

              <div className="h-px bg-black/[0.06]" />

              <div className="space-y-1.5 pt-1">
                <div className="flex items-start gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-mid-gray/50 mt-0.5 flex-shrink-0">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1" />
                    <path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                  <span className="font-mono text-xs text-cement leading-relaxed">
                    {session.durationMinutes} min — {t.book.success.arrive}
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-mid-gray/50 mt-0.5 flex-shrink-0">
                    <path d="M7 1.5c-2.5 0-4.5 2-4.5 4.5C2.5 9 7 12.5 7 12.5s4.5-3.5 4.5-6.5c0-2.5-2-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1" />
                    <circle cx="7" cy="6" r="1.5" stroke="currentColor" strokeWidth="1" />
                  </svg>
                  <span className="font-mono text-xs text-cement leading-relaxed">
                    {t.book.success.address}
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-mid-gray/50 mt-0.5 flex-shrink-0">
                    <path d="M12 7A5 5 0 112 7a5 5 0 0110 0z" stroke="currentColor" strokeWidth="1" />
                    <path d="M5 7.5l1.5 1.5L9 5.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-mono text-xs text-cement leading-relaxed">
                    {t.book.success.what}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link
            href={`/${lang}/book`}
            className="inline-flex items-center justify-center font-grotesk font-bold text-sm tracking-display
                       bg-rojo text-white px-6 py-4 rounded-brutal
                       hover:bg-rojo-dark transition-colors"
          >
            {t.book.success.another}
          </Link>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 font-mono text-xs text-cement
                       border border-black/[0.08] px-5 py-4 rounded-brutal
                       hover:border-black/20 hover:text-asphalt transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-current">
              <path d="M13.6 10.3a1 1 0 01.3.7v2.3a.7.7 0 01-.7.7A11.3 11.3 0 012 2.7a.7.7 0 01.7-.7H5a1 1 0 01.7.3l.9 1.9a1 1 0 01-.1.9L5.6 6.4a8.5 8.5 0 004 4l1.3-.9a1 1 0 01.9-.1z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.book.success.contact}
          </a>
        </motion.div>
      </div>
    </section>
  )
}
