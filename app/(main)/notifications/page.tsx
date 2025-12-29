'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates'
import { getRelativeTime } from '@/lib/utils'
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  Share2, 
  UserPlus, 
  Trophy,
  AtSign,
  Loader2,
  Check
} from 'lucide-react'

interface NotificationData {
  id: string
  type: string
  message: string | null
  senderId: string | null
  postId: string | null
  isRead: boolean
  createdAt: string
  sender?: {
    id: string
    username: string
    name: string
    profilePhoto: string | null
  } | null
}

const getNotificationIcon = (type: string): React.ReactNode => {
  switch (type) {
    case 'LIKE':
      return <Heart className="w-5 h-5 text-red-400" />
    case 'COMMENT':
      return <MessageCircle className="w-5 h-5 text-blue-400" />
    case 'SHARE':
      return <Share2 className="w-5 h-5 text-emerald-400" />
    case 'FOLLOW':
      return <UserPlus className="w-5 h-5 text-purple-400" />
    case 'PREDICTION_RESULT':
      return <Trophy className="w-5 h-5 text-amber-400" />
    case 'MENTION':
      return <AtSign className="w-5 h-5 text-emerald-400" />
    default:
      return <Bell className="w-5 h-5 text-slate-400" />
  }
}

const getNotificationText = (notification: NotificationData): string => {
  const senderName = notification.sender?.name || 'Someone'
  
  switch (notification.type) {
    case 'LIKE':
      return `${senderName} liked your post`
    case 'COMMENT':
      return `${senderName} commented: "${notification.message?.substring(0, 50)}..."`
    case 'SHARE':
      return `${senderName} shared your post`
    case 'FOLLOW':
      return `${senderName} started following you`
    case 'PREDICTION_RESULT':
      return notification.message || 'Your prediction result is in!'
    case 'MENTION':
      return `${senderName} mentioned you in a post`
    default:
      return notification.message || 'New notification'
  }
}

export default function NotificationsPage() {
  const { notifications: rawNotifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useRealTimeUpdates()
  const notifications = rawNotifications as NotificationData[]
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    refreshNotifications().finally(() => setIsLoading(false))
  }, [])

  const handleNotificationClick = async (notification: NotificationData) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-lg z-40 -mx-4 px-4 py-4 mb-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
            >
              <Check size={16} className="mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No notifications yet</h3>
            <p className="text-slate-400">
              When someone interacts with your posts, you&apos;ll see it here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {notifications.map(notification => (
              <Link
                key={notification.id}
                href={notification.postId ? `/post/${notification.postId}` : 
                      notification.sender ? `/profile/${notification.sender.username}` : '#'}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start gap-4 p-4 hover:bg-slate-800/50 transition-colors ${
                  !notification.isRead ? 'bg-emerald-500/5' : ''
                }`}
              >
                <div className="relative">
                  {notification.sender ? (
                    <Avatar
                      src={notification.sender.profilePhoto}
                      alt={notification.sender.name}
                      size="md"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-900">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.isRead ? 'text-slate-300' : 'text-white'}`}>
                    {getNotificationText(notification)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {getRelativeTime(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2" />
                )}
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

