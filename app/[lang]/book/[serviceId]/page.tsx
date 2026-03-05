'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { BookingFlow } from '@/components/booking/BookingFlow'
import { useLang } from '@/lib/i18n'

function formatPrice(amount: number): string {
  return amount >= 1000 ? `S/${amount.toLocaleString('es-PE')}` : `S/${amount}`
}

export default function ServiceBookingPage() {
  const { lang, t } = useLang()
  const params = useParams()
  const serviceId = params.serviceId as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/services/${serviceId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [serviceId])

  if (loading) {
    return (
      <main>
        <Navbar />
        <section className="px-5 md:px-10 lg:px-16 py-8 md:py-14">
          <div className="max-w-xl">
            <div className="h-8 w-48 bg-black/[0.06] rounded-brutal animate-pulse mb-4" />
            <div className="h-6 w-32 bg-black/[0.06] rounded-brutal animate-pulse mb-10" />
            <div className="h-64 bg-black/[0.04] rounded-brutal animate-pulse" />
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  if (!data) {
    return (
      <main>
        <Navbar />
        <section className="px-6 md:px-10 lg:px-16 py-16">
          <div className="max-w-md">
            <p className="font-grotesk text-cement">Servicio no encontrado.</p>
            <Link href={`/${lang}/book`} className="font-mono text-xs text-rojo mt-4 inline-block">
              {t.book.back}
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  const { service, sessions, addons } = data
  const pricingLabel = service.pricingModel === 'per_person'
    ? t.services.perPerson
    : t.services.flatRate

  return (
    <main>
      <Navbar />

      <section className="px-5 md:px-10 lg:px-16 py-8 md:py-14">
        <div className="max-w-xl">
          {/* Back link */}
          <Link
            href={`/${lang}/book`}
            className="font-mono text-xs tracking-widest text-mid-gray uppercase mb-6 inline-flex items-center gap-2
                       hover:text-asphalt transition-colors"
          >
            {t.book.back}
          </Link>

          {/* Service header */}
          <h1
            className="font-grotesk font-bold tracking-wide-display text-asphalt leading-none mb-3"
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
          >
            {service.name[lang]}
          </h1>

          {service.resource && (
            <p className="font-mono text-xs tracking-widest text-mid-gray uppercase mb-1">
              {service.resource.name} · {service.resource.capacity} {lang === 'es' ? 'personas' : 'people'}
            </p>
          )}

          <div className="flex items-baseline gap-3 mb-8">
            <span className="font-mono text-base font-bold text-rojo">
              {formatPrice(service.pricePen)}
            </span>
            <span className="font-mono text-xs tracking-widest text-mid-gray uppercase">
              {pricingLabel} · {service.durationMinutes} min
            </span>
          </div>

          {/* Booking flow */}
          <BookingFlow
            sessions={sessions}
            service={service}
            addons={addons}
          />
        </div>
      </section>

      <Footer />
    </main>
  )
}
