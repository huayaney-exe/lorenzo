'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/lib/i18n'
import { LogoMark, LogoWordmark } from './Logo'
import { motion } from 'framer-motion'

export function Navbar() {
  const { lang, t } = useLang()
  const pathname = usePathname()
  const altLang = lang === 'es' ? 'en' : 'es'

  const isBookingPage = pathname?.includes('/book')

  return (
    <nav className="w-full px-6 md:px-10 py-4 md:py-5 flex items-center justify-between">
      {/* Logo — always links home */}
      <Link href={`/${lang}`} className="flex items-center gap-3">
        <LogoMark size={36} />
        <LogoWordmark className="hidden sm:inline text-asphalt" />
      </Link>

      {/* Right side — Book CTA + Language toggle */}
      <div className="flex items-center gap-3">
        {/* Book link — hidden when already on booking page */}
        {!isBookingPage && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Link
              href={`/${lang}/book`}
              className="font-grotesk font-bold text-xs tracking-display text-white
                         bg-rojo px-4 py-2.5 md:py-2 rounded-brutal
                         min-h-[44px] md:min-h-0 flex items-center justify-center
                         hover:bg-rojo-dark transition-colors duration-200"
            >
              {t.nav.book}
            </Link>
          </motion.div>
        )}

        {/* Language toggle */}
        <motion.div
          whileHover={{ scale: 0.97 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        >
          <Link
            href={`/${altLang}${isBookingPage ? '/book' : ''}`}
            className="font-mono text-xs font-bold tracking-wide-display text-asphalt
                       border border-black/15 px-3.5 py-2.5 md:py-1.5 rounded-brutal select-none
                       min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={`Switch to ${t.nav.localeAlt}`}
          >
            <span>{t.nav.locale}</span>
            <span className="mx-1.5 opacity-30">/</span>
            <span className="opacity-40">{t.nav.localeAlt}</span>
          </Link>
        </motion.div>
      </div>
    </nav>
  )
}
