'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Search, TrendingUp, Trophy, Users, Clock } from 'lucide-react'
import { getTimeUntil } from '@/lib/utils'

interface TrendingTopic {
  id: string
  topic: string
  posts: number
}

interface TopPredictor {
  id: string
  username: string
  name: string
  profilePhoto: string | null
  totalPoints: number
}

interface UpcomingMatch {
  id: string
  homeTeam: string
  awayTeam: string
  league: string
  scheduledAt: string
}

export function RightSidebar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [topPredictors, setTopPredictors] = useState<TopPredictor[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([])

  useEffect(() => {
    // Fetch top predictors
    fetchTopPredictors()
    // Fetch upcoming matches
    fetchUpcomingMatches()
  }, [])

  const fetchTopPredictors = async () => {
    try {
      const res = await fetch('/api/users/top-predictors')
      if (res.ok) {
        const data = await res.json()
        setTopPredictors(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching top predictors:', error)
    }
  }

  const fetchUpcomingMatches = async () => {
    try {
      const res = await fetch('/api/matches/upcoming')
      if (res.ok) {
        const data = await res.json()
        setUpcomingMatches(data.matches || [])
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    }
  }

  // Mock trending topics for now
  const trendingTopics: TrendingTopic[] = [
    { id: '1', topic: 'Premier League', posts: 12500 },
    { id: '2', topic: 'Champions League', posts: 8300 },
    { id: '3', topic: 'Manchester United', posts: 5600 },
    { id: '4', topic: 'Real Madrid', posts: 4200 },
    { id: '5', topic: 'World Cup', posts: 3100 }
  ]

  return (
    <aside className="fixed right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-800 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Fannax..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Upcoming Matches */}
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-white">Upcoming Matches</h3>
            </div>
          </CardHeader>
          <CardContent className="py-0 pb-4">
            {upcomingMatches.length > 0 ? (
              <div className="space-y-3">
                {upcomingMatches.slice(0, 3).map((match) => (
                  <Link
                    key={match.id}
                    href={`/predictions?match=${match.id}`}
                    className="block p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div className="text-xs text-slate-400 mb-1">{match.league}</div>
                    <div className="text-sm font-medium text-white">
                      {match.homeTeam} vs {match.awayTeam}
                    </div>
                    <div className="text-xs text-emerald-400 mt-1">
                      {getTimeUntil(match.scheduledAt)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-2">No upcoming matches</p>
            )}
            <Link
              href="/predictions"
              className="block text-center text-emerald-400 text-sm hover:underline mt-3"
            >
              View all matches
            </Link>
          </CardContent>
        </Card>

        {/* Trending Topics */}
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-white">Trending</h3>
            </div>
          </CardHeader>
          <CardContent className="py-0 pb-4">
            <div className="space-y-1">
              {trendingTopics.map((topic, index) => (
                <Link
                  key={topic.id}
                  href={`/explore?q=${encodeURIComponent(topic.topic)}`}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <span className="text-slate-500 text-sm font-medium w-5">{index + 1}</span>
                  <div>
                    <p className="font-medium text-white text-sm">#{topic.topic.replace(/\s+/g, '')}</p>
                    <p className="text-xs text-slate-500">{topic.posts.toLocaleString()} posts</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Predictors */}
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-white">Top Predictors</h3>
            </div>
          </CardHeader>
          <CardContent className="py-0 pb-4">
            {topPredictors.length > 0 ? (
              <div className="space-y-2">
                {topPredictors.slice(0, 5).map((user, index) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-amber-500 text-white' :
                      index === 1 ? 'bg-slate-400 text-white' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <Avatar src={user.profilePhoto} alt={user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{user.name}</p>
                      <p className="text-xs text-slate-500">@{user.username}</p>
                    </div>
                    <span className="text-emerald-400 text-sm font-medium">
                      {user.totalPoints} pts
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-2">No predictions yet</p>
            )}
            <Link
              href="/leaderboard"
              className="block text-center text-emerald-400 text-sm hover:underline mt-3"
            >
              View leaderboard
            </Link>
          </CardContent>
        </Card>

        {/* Who to Follow */}
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-white">Who to Follow</h3>
            </div>
          </CardHeader>
          <CardContent className="py-0 pb-4">
            <div className="text-slate-500 text-sm py-2">
              Follow your favorite teams and fans to personalize your feed.
            </div>
            <Link
              href="/explore"
              className="block text-center text-emerald-400 text-sm hover:underline mt-2"
            >
              Find people to follow
            </Link>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-xs text-slate-500 space-y-2 pt-4">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/about" className="hover:underline">About</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/help" className="hover:underline">Help</Link>
          </div>
          <p>© 2025 Fannax. All rights reserved.</p>
        </div>
      </div>
    </aside>
  )
}

