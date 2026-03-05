import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { FailureContent } from './FailureContent'

export default function FailurePage() {
  return (
    <main>
      <Navbar />
      <FailureContent />
      <Footer />
    </main>
  )
}
