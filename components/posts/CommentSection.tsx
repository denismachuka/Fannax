'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { getRelativeTime } from '@/lib/utils'
import { Send, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    username: string
    name: string
    profilePhoto: string | null
    isVerified?: boolean
  }
  replies?: Comment[]
  _count?: {
    replies: number
  }
}

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comment`)
      const data = await res.json()
      setComments(data.comments || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          parentId: replyingTo
        })
      })

      const data = await res.json()
      if (data.comment) {
        if (replyingTo) {
          // Add reply to parent comment
          setComments(prev => prev.map(c => {
            if (c.id === replyingTo) {
              return {
                ...c,
                replies: [...(c.replies || []), data.comment]
              }
            }
            return c
          }))
        } else {
          // Add new top-level comment
          setComments(prev => [data.comment, ...prev])
        }
        setNewComment('')
        setReplyingTo(null)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
      <Link href={`/profile/${comment.author.username}`}>
        <Avatar 
          src={comment.author.profilePhoto} 
          alt={comment.author.name}
          size={isReply ? 'sm' : 'md'}
        />
      </Link>
      <div className="flex-1">
        <div className="bg-slate-800/50 rounded-xl px-4 py-2">
          <div className="flex items-center gap-2 mb-1">
            <Link 
              href={`/profile/${comment.author.username}`}
              className="font-medium text-white hover:underline text-sm"
            >
              {comment.author.name}
            </Link>
            <span className="text-slate-500 text-xs">
              @{comment.author.username}
            </span>
          </div>
          <p className="text-slate-300 text-sm">{comment.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 px-2">
          <span className="text-xs text-slate-500">
            {getRelativeTime(comment.createdAt)}
          </span>
          {!isReply && (
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Reply
            </button>
          )}
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}

        {/* Reply input */}
        {replyingTo === comment.id && (
          <form onSubmit={handleSubmit} className="mt-3 ml-12">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Reply to @${comment.author.username}...`}
                className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReplyingTo(null)
                  setNewComment('')
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )

  return (
    <div className="border-t border-slate-700/50">
      {/* Comment Input */}
      {!replyingTo && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-slate-700/50">
          <div className="flex gap-3">
            <Avatar size="sm" />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={18} />}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  )
}

