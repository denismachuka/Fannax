'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Trophy, Medal, Target, TrendingUp, Loader2, CheckCircle } from 'lucide-react'

interface LeaderboardUser {
  id: string
  username: string
  name: string
  profilePhoto: string | null
  isVerified: boolean
  totalPoints: number
  _count: {
    predictions: number
  }
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all')

  useEffect(() => {
    fetchLeaderboard()
  }, [timeframe])

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`/api/users/top-predictors?limit=50&timeframe=${timeframe}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy className="w-5 h-5 text-white" />
          </div>
        )
      case 2:
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center shadow-lg">
            <Medal className="w-5 h-5 text-white" />
          </div>
        )
      case 3:
        return (
          <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center shadow-lg">
            <Medal className="w-5 h-5 text-white" />
          </div>
        )
      default:
        return (
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-slate-300">{rank}</span>
          </div>
        )
    }
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-lg z-40 -mx-4 px-4 py-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-400" />
          <h1 className="text-xl font-bold text-white">Leaderboard</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">Top predictors ranked by points</p>
      </div>

      {/* Timeframe Filter */}
      <div className="flex gap-2 mb-6">
        {([
          { value: 'all', label: 'All Time' },
          { value: 'month', label: 'This Month' },
          { value: 'week', label: 'This Week' }
        ] as const).map(option => (
          <button
            key={option.value}
            onClick={() => setTimeframe(option.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeframe === option.value
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {users.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Second Place */}
          <div className="mt-8">
            <Card className="p-4 text-center bg-gradient-to-b from-slate-700/50 to-slate-800/50 border-slate-600">
              <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-slate-800">2</span>
              </div>
              <Avatar 
                src={users[1]?.profilePhoto}
                alt={users[1]?.name}
                size="lg"
                className="mx-auto mb-2"
              />
              <h3 className="font-semibold text-white truncate">{users[1]?.name}</h3>
              <p className="text-sm text-slate-400 truncate">@{users[1]?.username}</p>
              <p className="text-xl font-bold text-emerald-400 mt-2">{users[1]?.totalPoints} pts</p>
            </Card>
          </div>

          {/* First Place */}
          <div>
            <Card className="p-4 text-center bg-gradient-to-b from-amber-500/20 to-slate-800/50 border-amber-500/30">
              <div className="w-14 h-14 mx-auto mb-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <Avatar 
                src={users[0]?.profilePhoto}
                alt={users[0]?.name}
                size="xl"
                className="mx-auto mb-2 ring-2 ring-amber-500"
              />
              <h3 className="font-semibold text-white truncate">{users[0]?.name}</h3>
              <p className="text-sm text-slate-400 truncate">@{users[0]?.username}</p>
              <p className="text-2xl font-bold text-amber-400 mt-2">{users[0]?.totalPoints} pts</p>
            </Card>
          </div>

          {/* Third Place */}
          <div className="mt-12">
            <Card className="p-4 text-center bg-gradient-to-b from-amber-700/30 to-slate-800/50 border-amber-700/30">
              <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">3</span>
              </div>
              <Avatar 
                src={users[2]?.profilePhoto}
                alt={users[2]?.name}
                size="md"
                className="mx-auto mb-2"
              />
              <h3 className="font-semibold text-white truncate text-sm">{users[2]?.name}</h3>
              <p className="text-xs text-slate-400 truncate">@{users[2]?.username}</p>
              <p className="text-lg font-bold text-amber-600 mt-2">{users[2]?.totalPoints} pts</p>
            </Card>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <Card>
        <div className="divide-y divide-slate-700/50">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No rankings yet</h3>
              <p className="text-slate-400">Start making predictions to appear here!</p>
            </div>
          ) : (
            users.map((user, index) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-4 p-4 hover:bg-slate-800/50 transition-colors"
              >
                {getRankBadge(index + 1)}
                <Avatar 
                  src={user.profilePhoto}
                  alt={user.name}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white truncate">{user.name}</h3>
                    {user.isVerified && (
                      <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400 truncate">@{user.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400">{user.totalPoints}</p>
                  <p className="text-xs text-slate-500">{user._count.predictions} predictions</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

