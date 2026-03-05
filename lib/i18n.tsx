'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import type { Lang } from './i18n-config'

const copy = {
  es: {
    nav: {
      locale: 'ES',
      localeAlt: 'EN',
      book: 'RESERVAR',
    },
    hero: {
      line1: 'VIVE',
      line2: 'LA PUNTA',
      line3: 'COMO LOCAL',
      sub: 'Experiencias · Cultura · Deportes',
      statement: 'El punto de encuentro que estabas esperando está tomando forma.',
    },
    experiences: {
      title: 'EXPERIENCIAS',
      desc: 'Actividades en el mar y La Punta. Reserva directo, sin trámites.',
      cta: 'VER EXPERIENCIAS',
    },
    photos: {
      label: 'OBRA EN CURSO',
    },
    services: {
      title: 'EXPERIENCIAS',
      subtitle: 'Elige tu actividad.',
      perPerson: 'por persona',
      flatRate: 'grupo completo',
      addon: 'complemento',
      choose: 'ELEGIR',
      noServices: 'No hay experiencias disponibles.',
      available: 'disponibles',
      full: 'LLENO',
    },
    book: {
      back: '← Experiencias',
      steps: {
        date: 'Fecha',
        time: 'Hora',
        details: 'Datos',
        confirm: 'Confirmar',
      },
      selectDay: 'Fecha',
      selectSession: 'Horario',
      spotsLeft: 'disponibles',
      yourSelection: 'Tu selección',
      form: {
        name: 'Nombre completo',
        namePlaceholder: 'Franco Lorenzo',
        phone: 'WhatsApp',
        phonePlaceholder: '999 888 777',
        seats: 'Personas',
        total: 'Total',
        submit: 'CONTINUAR',
        step: 'Paso',
        of: 'de',
      },
      full: 'COMPLETO',
      spots: 'lugares',
      spot: 'lugar',
      perPerson: 'persona',
      duration: 'min',
      backToDate: 'Volver',
      addons: {
        title: 'Complementos',
        subtitle: 'Mejora tu experiencia.',
      },
      confirm: {
        title: 'CONFIRMAR RESERVA',
        subtitle: 'Revisa tu reserva.',
        whatsapp: 'CONFIRMAR POR WHATSAPP',
        note: 'Se abrirá WhatsApp para coordinar el pago.',
        edit: '← Editar datos',
      },
      success: {
        title: 'LISTO',
        subtitle: 'Te esperamos en La Punta.',
        confirmed: 'Reserva recibida',
        whatsappNote: 'Te confirmaremos por WhatsApp.',
        session: 'Tu sesión',
        arrive: 'Llega 10 minutos antes.',
        address: 'Av. Bolognesi, La Punta, Callao',
        what: 'Trae ropa cómoda y ganas.',
        contact: 'Preguntas? Escríbenos.',
        another: 'RESERVAR OTRA',
      },
      failure: {
        title: 'NO COMPLETADO',
        subtitle: 'Algo salió mal. Tu lugar sigue reservado por 10 minutos.',
        retry: 'INTENTAR DE NUEVO',
        contact: 'Problemas? Escríbenos.',
      },
    },
    footer: {
      address: 'Av. Bolognesi, La Punta, Callao',
      country: 'Perú',
      rights: '© 2026 Lorenzo Active Hub',
      contact: 'Contacto',
      book: 'Reservar',
      hub: 'Hub',
      hubDesc: 'Experiencias · Cultura · Deportes',
    },
  },
  en: {
    nav: {
      locale: 'EN',
      localeAlt: 'ES',
      book: 'BOOK',
    },
    hero: {
      line1: 'LIVE',
      line2: 'LA PUNTA',
      line3: 'LIKE A LOCAL',
      sub: 'Experiences · Culture · Sports',
      statement: 'The meeting point you\u2019ve been waiting for is taking shape.',
    },
    experiences: {
      title: 'EXPERIENCES',
      desc: 'Activities on the water and at La Punta. Book direct, zero red tape.',
      cta: 'SEE EXPERIENCES',
    },
    photos: {
      label: 'WORK IN PROGRESS',
    },
    services: {
      title: 'EXPERIENCES',
      subtitle: 'Choose your activity.',
      perPerson: 'per person',
      flatRate: 'full group',
      addon: 'add-on',
      choose: 'CHOOSE',
      noServices: 'No experiences available.',
      available: 'available',
      full: 'FULL',
    },
    book: {
      back: '← Experiences',
      steps: {
        date: 'Date',
        time: 'Time',
        details: 'Details',
        confirm: 'Confirm',
      },
      selectDay: 'Date',
      selectSession: 'Time',
      spotsLeft: 'available',
      yourSelection: 'Your selection',
      form: {
        name: 'Full name',
        namePlaceholder: 'Franco Lorenzo',
        phone: 'WhatsApp',
        phonePlaceholder: '999 888 777',
        seats: 'People',
        total: 'Total',
        submit: 'CONTINUE',
        step: 'Step',
        of: 'of',
      },
      full: 'FULL',
      spots: 'spots',
      spot: 'spot',
      perPerson: 'person',
      duration: 'min',
      backToDate: 'Back',
      addons: {
        title: 'Add-ons',
        subtitle: 'Enhance your experience.',
      },
      confirm: {
        title: 'CONFIRM BOOKING',
        subtitle: 'Review your booking.',
        whatsapp: 'CONFIRM VIA WHATSAPP',
        note: 'WhatsApp will open to coordinate payment.',
        edit: '← Edit details',
      },
      success: {
        title: 'DONE',
        subtitle: 'See you at La Punta.',
        confirmed: 'Booking received',
        whatsappNote: "We'll confirm via WhatsApp.",
        session: 'Your session',
        arrive: 'Arrive 10 minutes early.',
        address: 'Av. Bolognesi, La Punta, Callao',
        what: 'Bring comfortable clothes and good vibes.',
        contact: 'Questions? Write us.',
        another: 'BOOK ANOTHER',
      },
      failure: {
        title: 'INCOMPLETE',
        subtitle: 'Something went wrong. Your spot is held for 10 minutes.',
        retry: 'TRY AGAIN',
        contact: 'Issues? Write us.',
      },
    },
    footer: {
      address: 'Av. Bolognesi, La Punta, Callao',
      country: 'Peru',
      rights: '© 2026 Lorenzo Active Hub',
      contact: 'Contact',
      book: 'Book',
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
