'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Feed } from '@/components/feed/Feed'
import { 
  Search, 
  Users, 
  Trophy, 
  TrendingUp, 
  Loader2,
  CheckCircle 
} from 'lucide-react'

interface SearchUser {
  id: string
  username: string
  name: string
  profilePhoto: string | null
  isVerified: boolean
  isTeamAccount: boolean
  totalPoints: number
}

interface SearchTeam {
  id: string
  name: string
  shortCode: string | null
  logoUrl: string | null
  reservedUsername: string
}

type Tab = 'posts' | 'users' | 'teams'

export default function ExplorePage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState<Tab>('posts')
  const [users, setUsers] = useState<SearchUser[]>([])
  const [teams, setTeams] = useState<SearchTeam[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetchResults()
    } else {
      setUsers([])
      setTeams([])
    }
  }, [debouncedQuery, activeTab])

  const fetchResults = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'users') {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`)
        const data = await res.json()
        setUsers(data.users || [])
      } else if (activeTab === 'teams') {
        const res = await fetch(`/api/teams?q=${encodeURIComponent(debouncedQuery)}&limit=20`)
        const data = await res.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      // Update local state to show following
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isFollowing: true } : u
      ))
    } catch (error) {
      console.error('Error following:', error)
    }
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-lg z-40 -mx-4 px-4 py-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-bold text-white">Explore</h1>
        </div>
        
        {/* Search Input */}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users, teams, or posts..."
          leftIcon={<Search size={18} />}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-6">
        {([
          { value: 'posts', label: 'Posts', icon: TrendingUp },
          { value: 'users', label: 'Users', icon: Users },
          { value: 'teams', label: 'Teams', icon: Trophy }
        ] as const).map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-medium transition-colors ${
              activeTab === tab.value
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'posts' && (
        <Feed />
      )}

      {activeTab === 'users' && (
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {debouncedQuery ? 'No users found' : 'Search for users'}
              </h3>
              <p className="text-slate-400">
                {debouncedQuery 
                  ? 'Try a different search term' 
                  : 'Enter a username or name to find users'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {users.map(user => (
                <div key={user.id} className="flex items-center gap-4 p-4">
                  <Link href={`/profile/${user.username}`}>
                    <Avatar
                      src={user.profilePhoto}
                      alt={user.name}
                      size="md"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/profile/${user.username}`}
                        className="font-medium text-white hover:underline truncate"
                      >
                        {user.name}
                      </Link>
                      {user.isVerified && (
                        <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-400 shrink-0" />
                      )}
                      {user.isTeamAccount && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium shrink-0">
                          Team
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 truncate">@{user.username}</p>
                    <p className="text-xs text-emerald-400 mt-1">{user.totalPoints} points</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleFollow(user.id)}
                  >
                    Follow
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'teams' && (
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {debouncedQuery ? 'No teams found' : 'Search for teams'}
              </h3>
              <p className="text-slate-400">
                {debouncedQuery 
                  ? 'Try a different search term' 
                  : 'Enter a team name to find football teams'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {teams.map(team => (
                <div key={team.id} className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-400">
                        {team.shortCode || team.name.substring(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{team.name}</h3>
                    <p className="text-sm text-slate-400">@{team.reservedUsername}</p>
                    {team.shortCode && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                        {team.shortCode}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

