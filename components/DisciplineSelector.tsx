'use client'

import { useLang } from '@/lib/i18n'
import { HandArrow } from './HandArrow'
import { motion } from 'framer-motion'

const WA_BASE = 'https://wa.me/51944629513'
const WA_MSG = {
  es: '?text=Hola%20Lorenzo%2C%20quiero%20reservar%20una%20sesi%C3%B3n%20de%20paddle.',
  en: '?text=Hi%20Lorenzo%2C%20I%27d%20like%20to%20book%20a%20paddle%20session.',
}

export function DisciplineSelector() {
  const { lang, t } = useLang()

  return (
    <motion.section
      className="bg-rojo text-white px-6 md:px-10 lg:px-16 py-20 md:py-28 relative overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Section border — solid, architectural */}
      <div className="absolute top-0 left-0 right-0 h-px bg-black/10" />

      <div className="max-w-4xl">
        {/* Discipline label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase select-none">
            01
          </span>
          <span className="w-8 h-px bg-white/20" />
        </div>

        {/* Title — massive, rotulacion artesanal */}
        <h2
          className="font-grotesk font-bold tracking-wide-display leading-none mb-8"
          style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}
        >
          {t.paddle.title}
        </h2>

        {/* Description — documentary microcopy */}
        <p className="font-grotesk text-base md:text-lg text-white/75 max-w-md mb-12 leading-relaxed">
          {t.paddle.desc}
        </p>

        {/* CTA — links to WhatsApp with pre-filled message per language */}
        <motion.a
          href={`${WA_BASE}${WA_MSG[lang]}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 font-grotesk font-bold text-sm tracking-display
                     bg-white text-rojo px-6 py-4 rounded-brutal
                     focus-visible:outline-white focus-visible:outline-2 focus-visible:outline-offset-2"
          whileHover={{ scale: 0.975, backgroundColor: 'rgba(255,255,255,0.92)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        >
          {t.paddle.cta}
          <HandArrow color="#960800" size={22} />
        </motion.a>
      </div>

      {/* Structural accent — bottom right, like an exposed corner */}
      <div className="absolute bottom-0 right-0 w-32 h-32 border-l border-t border-white/[0.08]" />
    </motion.section>
  )
}
