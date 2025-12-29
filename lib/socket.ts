import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      path: '/api/socket',
      addTrailingSlash: false,
    })
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Event types
export interface NewPostEvent {
  post: {
    id: string
    type: string
    content: string | null
    author: {
      id: string
      username: string
      name: string
      profilePhoto: string | null
    }
    createdAt: string
  }
}

export interface NewCommentEvent {
  postId: string
  comment: {
    id: string
    content: string
    author: {
      id: string
      username: string
      name: string
      profilePhoto: string | null
    }
    createdAt: string
  }
}

export interface LikeEvent {
  postId: string
  userId: string
  liked: boolean
  likeCount: number
}

export interface ShareEvent {
  postId: string
  userId: string
  shareCount: number
}

export interface NotificationEvent {
  id: string
  type: string
  message: string | null
  senderId: string | null
  postId: string | null
  createdAt: string
}

// Socket event names
export const SOCKET_EVENTS = {
  NEW_POST: 'new_post',
  NEW_COMMENT: 'new_comment',
  LIKE: 'like',
  SHARE: 'share',
  NOTIFICATION: 'notification',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PREDICTION_RESULT: 'prediction_result',
  MATCH_UPDATE: 'match_update'
} as const

