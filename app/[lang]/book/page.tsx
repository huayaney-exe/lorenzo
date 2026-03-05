'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ServiceGrid } from '@/components/booking/ServiceGrid'
import { useLang } from '@/lib/i18n'

export default function BookPage() {
  const { lang, t } = useLang()
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((data) => {
        setServices(data.services || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <main>
      <Navbar />

      <section className="px-6 md:px-10 lg:px-16 py-10 md:py-16">
        <div className="max-w-3xl">
          {/* Header — exhibition label style */}
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-[10px] tracking-widest text-mid-gray uppercase select-none">
              01
            </span>
            <span className="w-8 h-px bg-black/10" />
            <span className="font-mono text-[10px] tracking-widest text-mid-gray/50 uppercase select-none">
              La Punta
            </span>
          </div>

          {/* Title block */}
          <h1
            className="font-grotesk font-bold tracking-wide-display text-asphalt leading-none mb-2"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
          >
            {t.services.title}
          </h1>

          <p className="font-grotesk text-base text-cement mb-10">
            {t.services.subtitle}
          </p>

          {/* Services grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-white/50 border border-black/[0.06] rounded-brutal animate-pulse"
                />
              ))}
            </div>
          ) : (
            <ServiceGrid services={services} lang={lang} />
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
