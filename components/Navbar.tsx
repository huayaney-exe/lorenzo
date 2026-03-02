'use client'

import { useLang } from '@/lib/i18n'
import { LogoMark, LogoWordmark } from './Logo'
import { motion } from 'framer-motion'

export function Navbar() {
  const { lang, setLang, t } = useLang()

  const toggle = () => setLang(lang === 'es' ? 'en' : 'es')

  return (
    <nav className="w-full px-6 md:px-10 py-4 md:py-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <LogoMark size={36} />
        <LogoWordmark className="hidden sm:inline text-asphalt" />
      </div>

      {/* Language toggle — crude typographic switch, 44px min touch target */}
      <motion.button
        onClick={toggle}
        className="font-mono text-xs font-bold tracking-wide-display text-asphalt
                   border border-black/15 px-3.5 py-2.5 md:py-1.5 rounded-brutal select-none
                   min-h-[44px] min-w-[44px] flex items-center justify-center"
        whileHover={{ scale: 0.97 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        aria-label={`Switch to ${t.nav.localeAlt}`}
      >
        <span>{t.nav.locale}</span>
        <span className="mx-1.5 opacity-30">/</span>
        <span className="opacity-40">{t.nav.localeAlt}</span>
      </motion.button>
    </nav>
  )
}
