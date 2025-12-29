'use client'

import { useEffect, useState, useCallback } from 'react'

interface SocketMessage {
  type: string
  data?: unknown
  timestamp: number
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<SocketMessage | null>(null)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  useEffect(() => {
    // Create EventSource connection
    const es = new EventSource('/api/socket')

    es.onopen = () => {
      setIsConnected(true)
      console.log('Socket connected')
    }

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
      } catch (error) {
        console.error('Error parsing socket message:', error)
      }
    }

    es.onerror = () => {
      setIsConnected(false)
      console.log('Socket disconnected')
    }

    setEventSource(es)

    return () => {
      es.close()
      setIsConnected(false)
    }
  }, [])

  const sendMessage = useCallback(async (type: string, data: unknown) => {
    // For SSE, we send messages via regular API calls
    // The server can then broadcast to other clients
    try {
      await fetch('/api/socket/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data })
      })
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }, [])

  return {
    isConnected,
    lastMessage,
    sendMessage
  }
}

