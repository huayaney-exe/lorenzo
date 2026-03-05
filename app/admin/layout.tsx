import { cookies } from 'next/headers'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const isAuth = cookieStore.has('admin-session')

  if (!isAuth) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-bone font-grotesk flex flex-col lg:flex-row">
      <AdminSidebar />
      <main className="flex-1 min-h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
