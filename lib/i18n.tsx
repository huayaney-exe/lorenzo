'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Lang = 'es' | 'en'

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
      sub: 'Experiencias \u00b7 Cultura \u00b7 Deportes',
      statement: 'El punto de encuentro que estabas esperando est\u00e1 tomando forma.',
    },
    paddle: {
      title: 'PADDLE',
      desc: 'Sesiones en el mar de La Punta. Reserva directo, sin tr\u00e1mites.',
      cta: 'RESERVAR SESI\u00d3N',
    },
    photos: {
      label: 'OBRA EN CURSO',
    },
    footer: {
      address: 'Av. Bolognesi, La Punta, Callao',
      country: 'Per\u00fa',
      rights: '\u00a9 2026 Lorenzo Active Hub',
      contact: 'Contacto',
      hub: 'Hub',
      hubDesc: 'Experiencias \u00b7 Cultura \u00b7 Deportes',
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
      sub: 'Experiences \u00b7 Culture \u00b7 Sports',
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
      rights: '\u00a9 2026 Lorenzo Active Hub',
      contact: 'Contact',
      hub: 'Hub',
      hubDesc: 'Experiences \u00b7 Culture \u00b7 Sports',
    },
  },
}

type Copy = typeof copy.es

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: Copy
}

const LangContext = createContext<LangContextValue>({
  lang: 'es',
  setLang: () => {},
  t: copy.es,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('es')

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t: copy[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
