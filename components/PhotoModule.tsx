'use client'

import { useEffect, useRef } from 'react'
import { useLang } from '@/lib/i18n'
import { motion } from 'framer-motion'

const INSTAGRAM_USERNAME = 'casalorenzo_'

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } }
  }
}

export function PhotoModule() {
  const { t } = useLang()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Re-process embeds when the component mounts (script may already be loaded)
    if (window.instgrm) {
      window.instgrm.Embeds.process()
    }
  }, [])

  return (
    <section className="px-6 md:px-10 lg:px-16 py-20 md:py-28">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-10">
        <span className="font-mono text-[10px] tracking-widest text-mid-gray uppercase">
          {t.photos.label}
        </span>
        <span className="flex-1 h-px bg-black/8" />
      </div>

      {/* Instagram embed */}
      <motion.div
        ref={containerRef}
        className="flex justify-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={`https://www.instagram.com/${INSTAGRAM_USERNAME}/`}
          data-instgrm-version="14"
          style={{
            background: '#FFF',
            border: 0,
            borderRadius: '2px',
            margin: '0 auto',
            maxWidth: '540px',
            width: '100%',
            minWidth: '326px',
            padding: 0,
          }}
        />
      </motion.div>

      {/* Caption */}
      <div className="mt-6 flex items-center justify-between">
        <a
          href={`https://www.instagram.com/${INSTAGRAM_USERNAME}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] text-mid-gray tracking-widest hover:text-asphalt transition-colors"
        >
          @{INSTAGRAM_USERNAME}
        </a>
        <span className="font-mono text-[10px] text-mid-gray/50 tracking-widest">
          LA PUNTA, CALLAO
        </span>
      </div>
    </section>
  )
}
