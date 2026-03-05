'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/i18n'
import { HandArrow } from './HandArrow'
import { motion } from 'framer-motion'

interface ServicePreview {
  id: string
  slug: string
  name: Record<string, string>
  type: string
  pricingModel: string
  pricePen: number
  durationMinutes: number
  hasAvailability: boolean
  resource: { name: string } | null
}

function formatPrice(amount: number): string {
  return amount >= 1000 ? `S/${amount.toLocaleString('es-PE')}` : `S/${amount}`
}

const cardReveal = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.15 + i * 0.08,
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
}

export function DisciplineSelector() {
  const { lang, t } = useLang()
  const [services, setServices] = useState<ServicePreview[]>([])

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((data) => setServices(data.services ?? []))
      .catch(() => {})
  }, [])

  // Show up to 4 services with availability
  const featured = services.filter((s) => s.hasAvailability).slice(0, 4)

  return (
    <motion.section
      className="bg-rojo text-white px-6 md:px-10 lg:px-16 py-20 md:py-28 relative overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-black/10" />

      <div className="max-w-4xl">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase select-none">
            01
          </span>
          <span className="w-8 h-px bg-white/20" />
        </div>

        {/* Title */}
        <h2
          className="font-grotesk font-bold tracking-wide-display leading-none mb-4"
          style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}
        >
          {t.experiences.title}
        </h2>

        {/* Description */}
        <p className="font-grotesk text-base md:text-lg text-white/75 max-w-md mb-12 leading-relaxed">
          {t.experiences.desc}
        </p>

        {/* Service preview cards */}
        {featured.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
            {featured.map((svc, i) => {
              const pricingLabel = svc.pricingModel === 'per_person'
                ? (lang === 'es' ? 'pp' : 'pp')
                : (lang === 'es' ? 'grupo' : 'group')

              return (
                <motion.div
                  key={svc.id}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={cardReveal}
                >
                  <Link
                    href={`/${lang}/book/${svc.slug}`}
                    className="block bg-white/[0.08] backdrop-blur-sm border border-white/[0.1]
                               rounded-brutal px-5 py-4 hover:bg-white/[0.14] transition-colors duration-200 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-grotesk font-bold text-white text-base leading-tight truncate">
                          {svc.name[lang]}
                        </h3>
                        {svc.resource && (
                          <span className="font-mono text-[11px] tracking-wide text-white/40 block mt-0.5">
                            {svc.resource.name}
                          </span>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="font-mono font-bold text-sm text-white">
                          {formatPrice(svc.pricePen)}
                        </span>
                        <span className="font-mono text-[10px] text-white/40 block">
                          {pricingLabel} · {svc.durationMinutes}min
                        </span>
                      </div>
                    </div>

                    {/* Subtle arrow on hover */}
                    <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                      </svg>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <Link href={`/${lang}/book`}>
          <motion.span
            className="inline-flex items-center gap-2.5 font-grotesk font-bold text-sm tracking-display
                       bg-white text-rojo px-6 py-4 rounded-brutal
                       focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2"
            whileHover={{ scale: 0.975, backgroundColor: 'rgba(255,255,255,0.92)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          >
            {t.experiences.cta}
            <HandArrow color="#960800" size={22} />
          </motion.span>
        </Link>
      </div>

      <div className="absolute bottom-0 right-0 w-32 h-32 border-l border-t border-white/[0.08]" />
    </motion.section>
  )
}
