'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { formatDate, formatTime, getTimeUntil } from '@/lib/utils'
import { Clock, MapPin, ChevronRight, Loader2, Trophy } from 'lucide-react'

interface Team {
  id: string
  name: string
  shortCode: string | null
  logoUrl: string | null
}

interface Match {
  id: string
  leagueName: string | null
  venue: string | null
  scheduledAt: string
  status: string
  homeTeam: Team
  awayTeam: Team
  _count: {
    predictions: number
  }
}

interface MatchSelectorProps {
  onSelect: (match: Match) => void
}

export function MatchSelector({ onSelect }: MatchSelectorProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all')

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches?status=SCHEDULED')
      const data = await res.json()
      setMatches(data.matches || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMatches = matches.filter(match => {
    const matchDate = new Date(match.scheduledAt)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    if (filter === 'today') {
      return matchDate >= today && matchDate < tomorrow
    }
    if (filter === 'week') {
      return matchDate >= today && matchDate < weekFromNow
    }
    return true
  })

  // Group matches by date
  const groupedMatches = filteredMatches.reduce((groups, match) => {
    const date = formatDate(match.scheduledAt)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(match)
    return groups
  }, {} as Record<string, Match[]>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No upcoming matches</h3>
        <p className="text-slate-400">Check back later for matches to predict!</p>
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'today', 'week'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {f === 'all' ? 'All Matches' : f === 'today' ? 'Today' : 'This Week'}
          </button>
        ))}
      </div>

      {/* Matches List */}
      <div className="space-y-6">
        {Object.entries(groupedMatches).map(([date, dateMatches]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-slate-400 mb-3">{date}</h3>
            <div className="space-y-3">
              {dateMatches.map(match => (
                <button
                  key={match.id}
                  onClick={() => onSelect(match)}
                  className="w-full text-left transition-all hover:ring-2 hover:ring-emerald-500/50"
                >
                  <Card hover className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="league-badge">{match.leagueName || 'Football'}</span>
                      <span className="time-badge flex items-center gap-1.5">
                        <Clock size={14} />
                        {getTimeUntil(match.scheduledAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Home Team */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                          {match.homeTeam.logoUrl ? (
                            <Image
                              src={match.homeTeam.logoUrl}
                              alt={match.homeTeam.name}
                              width={32}
                              height={32}
                              className="object-contain"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              {match.homeTeam.shortCode || match.homeTeam.name.substring(0, 3).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{match.homeTeam.name}</p>
                          <p className="text-xs text-slate-400">{match.homeTeam.shortCode}</p>
                        </div>
                      </div>

                      {/* VS and Time */}
                      <div className="text-center px-4">
                        <p className="text-slate-500 text-sm">VS</p>
                        <p className="text-emerald-400 text-sm">{formatTime(match.scheduledAt)}</p>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium text-white">{match.awayTeam.name}</p>
                          <p className="text-xs text-slate-400">{match.awayTeam.shortCode}</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                          {match.awayTeam.logoUrl ? (
                            <Image
                              src={match.awayTeam.logoUrl}
                              alt={match.awayTeam.name}
                              width={32}
                              height={32}
                              className="object-contain"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">
                              {match.awayTeam.shortCode || match.awayTeam.name.substring(0, 3).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="text-slate-500" size={20} />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                      {match.venue && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin size={12} />
                          <span>{match.venue}</span>
                        </div>
                      )}
                      <div className="text-xs text-slate-500">
                        {match._count.predictions} prediction{match._count.predictions !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

