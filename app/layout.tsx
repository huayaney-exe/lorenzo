import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '700'],
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Lorenzo Active Hub',
  description: 'Vive La Punta como local. Experiencias, cultura y deportes en La Punta, Callao.',
  metadataBase: new URL('https://lorenzo.club'),
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Lorenzo Active Hub',
    description: 'Vive La Punta como local.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#960800',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="font-grotesk">
        {/* SVG filter definitions — grain texture for documentary feel */}
        <svg
          className="absolute"
          style={{ width: 0, height: 0, position: 'absolute' }}
          aria-hidden="true"
        >
          <defs>
            <filter id="grain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65"
                numOctaves="3"
                stitchTiles="stitch"
              />
            </filter>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  )
}
