'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'
import { LogoMark } from './Logo'
import { motion } from 'framer-motion'
import { WHATSAPP_URL, INSTAGRAM_URL, PHONE_DISPLAY } from '@/lib/config'

export function Footer() {
  const { lang, t } = useLang()
  const altLang = lang === 'es' ? 'en' : 'es'

  return (
    <footer className="border-t border-black/10 px-6 md:px-10 lg:px-16 py-16 md:py-20">
      <div className="max-w-5xl">
        {/* Header line — exhibition colophon style */}
        <div className="flex items-start justify-between mb-12">
          <div className="flex items-center gap-3">
            <LogoMark size={28} />
            <span className="font-grotesk font-bold text-sm tracking-display text-asphalt">
              LORENZO ACTIVE HUB
            </span>
          </div>

          {/* Footer language toggle — adequate touch target */}
          <motion.div
            whileHover={{ scale: 0.97 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          >
            <Link
              href={`/${altLang}`}
              className="font-mono text-[10px] font-bold tracking-widest text-mid-gray
                         py-2 px-2 -mr-2 min-h-[44px] flex items-center"
              aria-label={`Switch to ${t.nav.localeAlt}`}
            >
              {t.nav.locale}
              <span className="mx-1 opacity-30">/</span>
              <span className="opacity-40">{t.nav.localeAlt}</span>
            </Link>
          </motion.div>
        </div>

        {/* Info grid — technical sheet of an art exhibition */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-16">
          {/* Address */}
          <div>
            <span className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-3">
              {t.footer.address.split(',')[0]}
            </span>
            <p className="font-mono text-xs text-cement leading-relaxed">
              {t.footer.address}
              <br />
              {t.footer.country}
            </p>
          </div>

          {/* Book */}
          <div>
            <span className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-3">
              {t.footer.book}
            </span>
            <Link
              href={`/${lang}/book`}
              className="block font-mono text-xs text-cement hover:text-rojo
                         transition-colors duration-200 py-1.5 -ml-1 pl-1"
            >
              {t.experiences.cta}
            </Link>
          </div>

          {/* Contact */}
          <div>
            <span className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-3">
              {t.footer.contact}
            </span>
            <div className="space-y-1">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-mono text-xs text-cement hover:text-rojo
                           transition-colors duration-200 py-1.5 -ml-1 pl-1"
              >
                {PHONE_DISPLAY}
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-mono text-xs text-cement hover:text-rojo
                           transition-colors duration-200 py-1.5 -ml-1 pl-1"
              >
                @hub_lorenzo
              </a>
            </div>
          </div>

          {/* Identifier */}
          <div>
            <span className="block font-mono text-[10px] tracking-widest text-mid-gray uppercase mb-3">
              {t.footer.hub}
            </span>
            <p className="font-mono text-xs text-cement leading-relaxed">
              {t.footer.hubDesc}
            </p>
          </div>
        </div>

        {/* Baseline — minimal, like exhibition small print */}
        <div className="flex items-center justify-between pt-8 border-t border-black/[0.06]">
          <span className="font-mono text-[10px] text-mid-gray/60 tracking-widest">
            {t.footer.rights}
          </span>
          <span className="font-mono text-[10px] text-mid-gray/40 tracking-widest select-none">
            LA PUNTA
          </span>
        </div>
      </div>
    </footer>
  )
}
