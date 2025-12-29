'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Feed } from '@/components/feed/Feed'
import { 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  Trophy, 
  Target,
  CheckCircle,
  Settings,
  Loader2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface UserProfile {
  id: string
  username: string
  name: string
  bio: string | null
  profilePhoto: string | null
  isVerified: boolean
  isTeamAccount: boolean
  totalPoints: number
  createdAt: string
  isFollowing: boolean
  _count: {
    posts: number
    followers: number
    following: number
    predictions: number
  }
  stats: {
    totalPredictions: number
    correctPredictions: number
    accuracy: number
  }
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params)
  const { data: session } = useSession()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'predictions'>('posts')

  const isOwnProfile = session?.user?.username === resolvedParams.username

  useEffect(() => {
    fetchUser()
  }, [resolvedParams.username])

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/users/${resolvedParams.username}`)
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setIsFollowing(data.isFollowing)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!user || isFollowLoading) return
    
    setIsFollowLoading(true)
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await res.json()
      setIsFollowing(data.following)
      
      // Update follower count
      setUser(prev => prev ? {
        ...prev,
        _count: {
          ...prev._count,
          followers: prev._count.followers + (data.following ? 1 : -1)
        }
      } : null)
    } catch (error) {
      console.error('Error following user:', error)
    } finally {
      setIsFollowLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-semibold text-white mb-2">User not found</h2>
        <p className="text-slate-400">The user @{resolvedParams.username} doesn&apos;t exist.</p>
        <Link href="/home">
          <Button className="mt-4">Go Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-lg z-40 -mx-4 px-4 py-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">{user.name}</h1>
          {user.isVerified && (
            <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-400" />
          )}
        </div>
        <p className="text-sm text-slate-400">{user._count.posts} posts</p>
      </div>

      {/* Profile Card */}
      <Card className="mb-6">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-br from-emerald-500/20 to-slate-800 rounded-t-2xl" />
        
        {/* Profile Info */}
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <Avatar 
              src={user.profilePhoto}
              alt={user.name}
              size="xl"
              className="border-4 border-slate-800"
            />
            {isOwnProfile ? (
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings size={16} className="mr-2" />
                  Edit Profile
                </Button>
              </Link>
            ) : (
              <Button
                onClick={handleFollow}
                variant={isFollowing ? 'secondary' : 'primary'}
                isLoading={isFollowLoading}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              {user.isVerified && (
                <CheckCircle className="w-5 h-5 text-emerald-400 fill-emerald-400" />
              )}
              {user.isTeamAccount && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                  Official Team
                </span>
              )}
            </div>
            <p className="text-slate-400">@{user.username}</p>
          </div>

          {user.bio && (
            <p className="text-slate-300 mb-4">{user.bio}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="font-semibold text-white">{user._count.following}</span>
              <span className="text-slate-400 ml-1">Following</span>
            </div>
            <div>
              <span className="font-semibold text-white">{user._count.followers}</span>
              <span className="text-slate-400 ml-1">Followers</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 text-center">
          <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{user.totalPoints}</p>
          <p className="text-xs text-slate-400">Points</p>
        </Card>
        <Card className="p-4 text-center">
          <Target className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{user.stats.totalPredictions}</p>
          <p className="text-xs text-slate-400">Predictions</p>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{user.stats.accuracy}%</p>
          <p className="text-xs text-slate-400">Accuracy</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-4">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'posts'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Posts
        </button>
        <button
          onClick={() => setActiveTab('predictions')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activeTab === 'predictions'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Predictions
        </button>
      </div>

      {/* Content */}
      <Feed 
        userId={user.id} 
        type={activeTab === 'predictions' ? 'PREDICTION' : undefined}
      />
    </div>
  )
}

