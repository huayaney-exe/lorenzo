'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import type { Lang } from './i18n-config'

const copy = {
  es: {
    nav: {
      locale: 'ES',
      localeAlt: 'EN',
    },
    hero: {
      line1: 'VIVE',
      line2: 'LA PUNTA',
      line3: 'COMO LOCAL',
      sub: 'Experiencias · Cultura · Deportes',
      statement: 'El punto de encuentro que estabas esperando está tomando forma.',
    },
    paddle: {
      title: 'PADDLE',
      desc: 'Sesiones en el mar de La Punta. Reserva directo, sin trámites.',
      cta: 'RESERVAR SESIÓN',
    },
    photos: {
      label: 'OBRA EN CURSO',
    },
    footer: {
      address: 'Av. Bolognesi, La Punta, Callao',
      country: 'Perú',
      rights: '© 2026 Lorenzo Active Hub',
      contact: 'Contacto',
      hub: 'Hub',
      hubDesc: 'Experiencias · Cultura · Deportes',
    },
  },
  en: {
    nav: {
      locale: 'EN',
      localeAlt: 'ES',
    },
    hero: {
      line1: 'LIVE',
      line2: 'LA PUNTA',
      line3: 'LIKE A LOCAL',
      sub: 'Experiences · Culture · Sports',
      statement: 'The meeting point you\u2019ve been waiting for is taking shape.',
    },
    paddle: {
      title: 'PADDLE',
      desc: 'Sessions on the water at La Punta. Book direct, zero red tape.',
      cta: 'BOOK A SESSION',
    },
    photos: {
      label: 'WORK IN PROGRESS',
    },
    footer: {
      address: 'Av. Bolognesi, La Punta, Callao',
      country: 'Peru',
      rights: '© 2026 Lorenzo Active Hub',
      contact: 'Contact',
      hub: 'Hub',
      hubDesc: 'Experiences · Culture · Sports',
    },
  },
}

type Copy = typeof copy.es

interface LangContextValue {
  lang: Lang
  t: Copy
}

const LangContext = createContext<LangContextValue>({
  lang: 'es',
  t: copy.es,
})

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, t: copy[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
