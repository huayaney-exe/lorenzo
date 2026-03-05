'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useLang } from '@/lib/i18n'
import { WHATSAPP_URL } from '@/lib/config'

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

export function FailureContent() {
  const { lang, t } = useLang()

  return (
    <section className="px-6 md:px-10 lg:px-16 py-16 md:py-24">
      <div className="max-w-md">
        {/* Failure mark */}
        <motion.div
          className="w-14 h-14 bg-bone-dark rounded-brutal flex items-center justify-center mb-8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
        >
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <motion.path
              d="M8 8l8 8M16 8l-8 8"
              stroke="#8A8A8A"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4, duration: 0.4, ease: 'easeOut' }}
            />
          </motion.svg>
        </motion.div>

        <motion.h1
          custom={0}
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="font-grotesk font-bold tracking-wide-display text-asphalt leading-none mb-3"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t.book.failure.title}
        </motion.h1>

        <motion.p
          custom={1}
          initial="hidden"
          animate="visible"
          variants={reveal}
          className="font-grotesk text-base text-cement mb-10 max-w-sm leading-relaxed"
        >
          {t.book.failure.subtitle}
        </motion.p>

        <motion.div
          custom={2}
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
            {t.book.failure.retry}
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
            {t.book.failure.contact}
          </a>
        </motion.div>
      </div>
    </section>
  )
}
