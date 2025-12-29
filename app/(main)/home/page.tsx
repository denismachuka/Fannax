'use client'

import { useState } from 'react'
import { CreatePost } from '@/components/posts/CreatePost'
import { Feed } from '@/components/feed/Feed'

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handlePostCreated = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-lg z-40 -mx-4 px-4 py-4 mb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">Home</h1>
      </div>

      {/* Create Post */}
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Feed */}
      <Feed refreshTrigger={refreshKey} />
    </div>
  )
}

