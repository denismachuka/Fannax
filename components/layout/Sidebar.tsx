'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import {
  Home,
  Search,
  Bell,
  Trophy,
  User,
  Settings,
  LogOut,
  BarChart3,
  Users,
  Plus
} from 'lucide-react'

const mainNavItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/explore', icon: Search, label: 'Explore' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/predictions', icon: Trophy, label: 'Predictions' },
  { href: '/leaderboard', icon: BarChart3, label: 'Leaderboard' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6">
        <Link href="/home" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">
            <span className="text-emerald-400">Fan</span>nax
          </span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <item.icon size={22} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
          
          {session?.user && (
            <li>
              <Link
                href={`/profile/${session.user.username}`}
                className={cn(
                  'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200',
                  pathname.startsWith('/profile')
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <User size={22} />
                <span className="font-medium">Profile</span>
              </Link>
            </li>
          )}
        </ul>

        {/* Create Post Button */}
        <Link
          href="/home"
          className="flex items-center justify-center gap-2 w-full mt-6 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
        >
          <Plus size={20} />
          <span>Create Post</span>
        </Link>
      </nav>

      {/* User Section */}
      {session?.user && (
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
            <Avatar
              src={session.user.image}
              alt={session.user.name || 'User'}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{session.user.name}</p>
              <p className="text-sm text-slate-400 truncate">@{session.user.username}</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link
                href="/settings"
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Settings size={18} />
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

