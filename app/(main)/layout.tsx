import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="md:ml-64 md:mr-80 min-h-screen pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto px-4">
          {children}
        </div>
      </main>

      {/* Desktop Right Sidebar */}
      <div className="hidden lg:block">
        <RightSidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  )
}

