'use client'

import { useState, useEffect, useCallback } from 'react'
import { PostCard } from '@/components/posts/PostCard'
import { Loader2 } from 'lucide-react'

interface Post {
  id: string
  type: 'TEXT' | 'PHOTO' | 'POLL' | 'PREDICTION'
  content: string | null
  mediaUrls: string[]
  author: {
    id: string
    username: string
    name: string
    profilePhoto: string | null
    isVerified: boolean
    isTeamAccount: boolean
  }
  createdAt: string
  poll?: {
    id: string
    question: string
    endsAt: string | null
    options: {
      id: string
      text: string
      _count: { votes: number }
    }[]
  } | null
  prediction?: {
    id: string
    predictedHomeScore: number
    predictedAwayScore: number
    caption: string | null
    pointsAwarded: number | null
    resultStatus: string | null
    match: {
      id: string
      leagueName: string | null
      venue: string | null
      scheduledAt: string
      status: string
      homeScore: number | null
      awayScore: number | null
      homeTeam: {
        id: string
        name: string
        shortCode: string | null
        logoUrl: string | null
      }
      awayTeam: {
        id: string
        name: string
        shortCode: string | null
        logoUrl: string | null
      }
    }
  } | null
  _count: {
    likes: number
    comments: number
    shares: number
  }
  isLiked?: boolean
}

interface FeedProps {
  userId?: string
  type?: 'TEXT' | 'PHOTO' | 'POLL' | 'PREDICTION'
  refreshTrigger?: number
}

export function Feed({ userId, type, refreshTrigger }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)

  const fetchPosts = useCallback(async (isInitial = false) => {
    if (!isInitial && !hasMore) return

    try {
      const params = new URLSearchParams()
      if (!isInitial && cursor) params.append('cursor', cursor)
      if (userId) params.append('userId', userId)
      if (type) params.append('type', type)
      params.append('limit', '20')

      const res = await fetch(`/api/posts?${params.toString()}`)
      const data = await res.json()

      if (isInitial) {
        setPosts(data.posts || [])
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])])
      }
      
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [cursor, hasMore, userId, type])

  useEffect(() => {
    setIsLoading(true)
    setCursor(null)
    setHasMore(true)
    fetchPosts(true)
  }, [userId, type, refreshTrigger])

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
        && !isLoading
        && hasMore
      ) {
        fetchPosts()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [fetchPosts, isLoading, hasMore])

  if (isLoading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-lg mb-2">No posts yet</p>
        <p className="text-slate-500">
          {userId ? 'This user hasn\'t posted anything yet.' : 'Be the first to share something!'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-slate-500">
          You&apos;ve reached the end!
        </div>
      )}
    </div>
  )
}

