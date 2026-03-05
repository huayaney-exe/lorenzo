import { Suspense } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SuccessContent } from './SuccessContent'

export default function SuccessPage() {
  return (
    <main>
      <Navbar />
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
      <Footer />
    </main>
  )
}
