'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getRelativeTime } from '@/lib/utils'
import { parseMentionsToLinks } from '@/lib/mentions'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  CheckCircle,
  Trophy,
  BarChart3
} from 'lucide-react'
import { PollCard } from './PollCard'
import { PredictionCard } from './PredictionCard'
import { CommentSection } from './CommentSection'

interface PostAuthor {
  id: string
  username: string
  name: string
  profilePhoto: string | null
  isVerified: boolean
  isTeamAccount: boolean
}

interface PostProps {
  post: {
    id: string
    type: 'TEXT' | 'PHOTO' | 'POLL' | 'PREDICTION'
    content: string | null
    mediaUrls: string[]
    author: PostAuthor
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
  onLike?: (postId: string) => void
  showComments?: boolean
}

export function PostCard({ post, onLike, showComments = false }: PostProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likeCount, setLikeCount] = useState(post._count.likes)
  const [shareCount, setShareCount] = useState(post._count.shares)
  const [showCommentsSection, setShowCommentsSection] = useState(showComments)
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async () => {
    if (isLiking) return
    setIsLiking(true)

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST'
      })
      const data = await res.json()
      
      setIsLiked(data.liked)
      setLikeCount(data.likeCount)
      onLike?.(post.id)
    } catch (error) {
      console.error('Error liking post:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const data = await res.json()
      setShareCount(data.shareCount)
    } catch (error) {
      console.error('Error sharing post:', error)
    }
  }

  const renderContent = () => {
    if (!post.content) return null

    const parts = parseMentionsToLinks(post.content)
    
    return (
      <p className="text-white whitespace-pre-wrap">
        {parts.map((part, index) => 
          part.type === 'mention' ? (
            <Link 
              key={index} 
              href={`/profile/${part.content}`}
              className="text-emerald-400 hover:underline"
            >
              @{part.content}
            </Link>
          ) : (
            <span key={index}>{part.content}</span>
          )
        )}
      </p>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-4">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${post.author.username}`}>
              <Avatar 
                src={post.author.profilePhoto} 
                alt={post.author.name}
                size="md"
              />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Link 
                  href={`/profile/${post.author.username}`}
                  className="font-semibold text-white hover:underline"
                >
                  {post.author.name}
                </Link>
                {post.author.isVerified && (
                  <CheckCircle className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                )}
                {post.author.isTeamAccount && (
                  <Trophy className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <span>@{post.author.username}</span>
                <span>·</span>
                <span>{getRelativeTime(post.createdAt)}</span>
              </div>
            </div>
          </div>
          <button className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          {renderContent()}
        </div>

        {/* Media */}
        {post.mediaUrls.length > 0 && (
          <div className={`px-4 pb-3 grid gap-2 ${
            post.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
          }`}>
            {post.mediaUrls.map((url, index) => (
              <div 
                key={index} 
                className="relative aspect-video rounded-xl overflow-hidden bg-slate-800"
              >
                {url.includes('video') ? (
                  <video 
                    src={url} 
                    controls 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={url}
                    alt="Post media"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Poll */}
        {post.type === 'POLL' && post.poll && (
          <div className="px-4 pb-3">
            <PollCard poll={post.poll} postId={post.id} />
          </div>
        )}

        {/* Prediction */}
        {post.type === 'PREDICTION' && post.prediction && (
          <div className="px-4 pb-3">
            <PredictionCard prediction={post.prediction} />
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 transition-colors ${
                isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'
              }`}
            >
              <Heart 
                size={20} 
                className={isLiked ? 'fill-red-500' : ''} 
              />
              <span className="text-sm">{likeCount}</span>
            </button>

            <button
              onClick={() => setShowCommentsSection(!showCommentsSection)}
              className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <MessageCircle size={20} />
              <span className="text-sm">{post._count.comments}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors"
            >
              <Share2 size={20} />
              <span className="text-sm">{shareCount}</span>
            </button>
          </div>

          {post.type === 'POLL' && (
            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
              <BarChart3 size={16} />
              <span>Poll</span>
            </div>
          )}

          {post.type === 'PREDICTION' && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
              <Trophy size={16} />
              <span>Prediction</span>
            </div>
          )}
        </div>

        {/* Comments Section */}
        {showCommentsSection && (
          <CommentSection postId={post.id} />
        )}
      </Card>
    </motion.div>
  )
}

