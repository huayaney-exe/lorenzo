import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { DisciplineSelector } from '@/components/DisciplineSelector'
import { PhotoModule } from '@/components/PhotoModule'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <DisciplineSelector />
      <PhotoModule />
      <Footer />
    </main>
  )
}
