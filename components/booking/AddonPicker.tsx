'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface AddonItem {
  id: string
  name: Record<string, string>
  pricingModel: string
  pricePen: number
}

interface Props {
  addons: AddonItem[]
  selectedAddons: string[]
  onToggle: (addonId: string) => void
  seats: number
  lang: string
}

export function AddonPicker({ addons, selectedAddons, onToggle, seats, lang }: Props) {
  if (addons.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Section header */}
      <span className="block font-mono text-xs tracking-widest text-mid-gray uppercase mb-3 font-bold">
        {lang === 'es' ? 'Complementos' : 'Add-ons'}
      </span>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {addons.map((addon, i) => {
            const isSelected = selectedAddons.includes(addon.id)
            const unitPrice =
              addon.pricePen >= 1000
                ? `S/${addon.pricePen.toLocaleString('es-PE')}`
                : `S/${addon.pricePen}`

            return (
              <motion.label
                key={addon.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.04 + i * 0.05,
                  duration: 0.35,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className={`
                  flex items-center justify-between gap-4 px-4 py-3.5 rounded-brutal cursor-pointer
                  transition-all duration-200 select-none
                  ${isSelected
                    ? 'bg-asphalt text-white ring-1 ring-asphalt'
                    : 'bg-white border border-black/[0.08] hover:border-black/15'
                  }
                `}
              >
                {/* Checkbox + name */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`
                      flex-shrink-0 w-4 h-4 rounded-[2px] border flex items-center justify-center
                      transition-all duration-200
                      ${isSelected
                        ? 'bg-white border-white'
                        : 'border-black/15 bg-transparent'
                      }
                    `}
                  >
                    {isSelected && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M2 5l2.5 2.5L8 3"
                          stroke="#1A1A1A"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </motion.svg>
                    )}
                  </span>

                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(addon.id)}
                    className="sr-only"
                    aria-label={addon.name[lang]}
                  />

                  <span
                    className={`font-grotesk text-sm font-medium truncate ${
                      isSelected ? 'text-white' : 'text-asphalt'
                    }`}
                  >
                    {addon.name[lang]}
                  </span>
                </div>

                {/* Price info */}
                <div className="flex-shrink-0 text-right">
                  {addon.pricingModel === 'per_person' ? (
                    <div className="flex flex-col items-end">
                      <span
                        className={`font-mono text-xs tracking-wide ${
                          isSelected ? 'text-white/60' : 'text-mid-gray'
                        }`}
                      >
                        {unitPrice} pp
                      </span>
                      {seats > 1 && (
                        <span
                          className={`font-mono text-[11px] tracking-wide ${
                            isSelected ? 'text-white/40' : 'text-cement'
                          }`}
                        >
                          x {seats} = S/{addon.pricePen * seats}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span
                      className={`font-mono text-xs tracking-wide ${
                        isSelected ? 'text-white/60' : 'text-mid-gray'
                      }`}
                    >
                      {unitPrice}
                    </span>
                  )}
                </div>
              </motion.label>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
