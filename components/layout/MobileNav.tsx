'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  Home,
  Search,
  Plus,
  Trophy,
  User
} from 'lucide-react'

export function MobileNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const navItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/explore', icon: Search, label: 'Explore' },
    { href: '/predictions', icon: Trophy, label: 'Predict' },
    { 
      href: session?.user ? `/profile/${session.user.username}` : '/login', 
      icon: User, 
      label: 'Profile' 
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 md:hidden z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
                isActive ? 'text-emerald-400' : 'text-slate-400'
              )}
            >
              <item.icon size={24} />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

