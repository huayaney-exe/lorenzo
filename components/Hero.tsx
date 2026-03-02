'use client'

import { useLang } from '@/lib/i18n'
import { motion } from 'framer-motion'

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

export function Hero() {
  const { t } = useLang()

  return (
    <section className="min-h-[75vh] md:min-h-screen flex flex-col md:flex-row">
      {/* Left — Typographic canvas */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-10 lg:px-16 py-14 md:py-0">
        <div className="max-w-xl">
          {/* Main statement */}
          <div className="mb-10 md:mb-14">
            <motion.h1
              className="font-grotesk font-bold text-asphalt leading-[0.92] tracking-display"
              style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
            >
              <motion.span
                className="block"
                custom={0}
                initial="hidden"
                animate="visible"
                variants={reveal}
              >
                {t.hero.line1}
              </motion.span>
              <motion.span
                className="block"
                custom={1}
                initial="hidden"
                animate="visible"
                variants={reveal}
              >
                {t.hero.line2}
              </motion.span>
              <motion.span
                className="block"
                custom={2}
                initial="hidden"
                animate="visible"
                variants={reveal}
              >
                {t.hero.line3}
              </motion.span>
            </motion.h1>
          </div>

          {/* Sub-identifier */}
          <motion.p
            className="font-mono text-[11px] tracking-wide-display text-mid-gray uppercase mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {t.hero.sub}
          </motion.p>

          {/* Statement */}
          <motion.p
            className="font-grotesk text-base md:text-lg text-cement leading-relaxed max-w-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {t.hero.statement}
          </motion.p>
        </div>
      </div>

      {/* Right — Video canvas with B&W filter and brand overlay */}
      <motion.div
        className="flex-1 relative min-h-[40vh] md:min-h-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Video background — B&W, looping, muted */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover grayscale"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Darkening overlay for text readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Text overlay — film title card */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
          {/* LA PUNTA */}
          <motion.span
            className="font-grotesk font-bold text-rojo tracking-wide-display leading-none block"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
          >
            LA PUNTA
          </motion.span>

          {/* Separator dot */}
          <motion.span
            className="block w-1 h-1 rounded-full bg-rojo my-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          />

          {/* LIKE A LOCAL */}
          <motion.span
            className="font-grotesk font-medium text-rojo tracking-wide-display uppercase block"
            style={{ fontSize: 'clamp(0.75rem, 1.5vw, 1.1rem)' }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            LIKE A LOCAL
          </motion.span>
        </div>

        {/* Construction index */}
        <span className="absolute bottom-4 right-5 font-mono text-[10px] tracking-widest text-white/30 select-none z-10">
          001
        </span>

        {/* Hard border — brick meeting plaster */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-black/10" />
      </motion.div>
    </section>
  )
}
