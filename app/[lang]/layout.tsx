import { notFound } from 'next/navigation'
import { LangProvider } from '@/lib/i18n'
import { locales, type Lang } from '@/lib/i18n-config'

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!locales.includes(lang as Lang)) {
    notFound()
  }

  return <LangProvider lang={lang as Lang}>{children}</LangProvider>
}
