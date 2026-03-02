'use client'

import { useLang } from '@/lib/i18n'
import { motion } from 'framer-motion'

/**
 * Documentary photo grid — masonry-like asymmetry.
 * Photo slots use brand colors as architectural placeholders
 * until real photography is placed. Each slot communicates
 * the material palette: cement, rojo, asphalt, bone.
 *
 * One tile carries the blue painter's tape easter egg.
 */

interface PhotoTile {
  id: string
  bg: string
  textColor: string
  span: string
  label?: string
  hasTape?: boolean
}

const tiles: PhotoTile[] = [
  {
    id: '002',
    bg: 'bg-asphalt',
    textColor: 'text-white/30',
    span: 'row-span-2',
    label: 'TABLA',
  },
  {
    id: '003',
    bg: 'bg-cement',
    textColor: 'text-white/30',
    span: '',
  },
  {
    id: '004',
    bg: 'bg-bone-dark',
    textColor: 'text-asphalt/25',
    span: '',
    hasTape: true,
  },
  {
    id: '005',
    bg: 'bg-rojo',
    textColor: 'text-white/30',
    span: '',
    label: 'LOLO',
  },
  {
    id: '006',
    bg: 'bg-[#4A3F38]',
    textColor: 'text-white/30',
    span: 'col-span-2',
  },
]

const tileReveal = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
}

export function PhotoModule() {
  const { t } = useLang()

  return (
    <section className="px-6 md:px-10 lg:px-16 py-20 md:py-28">
      {/* Section label — exhibition-style */}
      <div className="flex items-center gap-3 mb-10">
        <span className="font-mono text-[10px] tracking-widest text-mid-gray uppercase">
          {t.photos.label}
        </span>
        <span className="flex-1 h-px bg-black/8" />
      </div>

      {/* Masonry grid */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 gap-[2px] auto-rows-[180px] md:auto-rows-[220px] lg:auto-rows-[260px]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {tiles.map((tile, i) => (
          <motion.div
            key={tile.id}
            className={`${tile.bg} ${tile.span} relative grain-overlay rounded-brutal overflow-hidden
                        cursor-pointer transition-[filter] duration-200 hover:brightness-[0.94]`}
            custom={i}
            variants={tileReveal}
            whileHover={{ scale: 0.99 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          >
            {/* Tile content */}
            {tile.label && (
              <span
                className={`absolute top-3 left-4 font-grotesk font-bold text-[11px] tracking-wide-display uppercase ${tile.textColor}`}
              >
                {tile.label}
              </span>
            )}

            {/* Contact sheet index */}
            <span className={`tile-index ${tile.textColor}`}>
              {tile.id}
            </span>

            {/* Blue painter's tape easter egg */}
            {tile.hasTape && (
              <>
                <div className="tape-strip tape-strip-tl" />
                <div className="tape-strip tape-strip-br" />
              </>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Grid caption — documentary */}
      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-[10px] text-mid-gray tracking-widest">
          LORENZO ACTIVE HUB
        </span>
        <span className="font-mono text-[10px] text-mid-gray/50 tracking-widest">
          LA PUNTA, CALLAO
        </span>
      </div>
    </section>
  )
}
