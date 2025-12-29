'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { 
  Image as ImageIcon, 
  Video, 
  BarChart3, 
  Trophy,
  X,
  Plus,
  Loader2
} from 'lucide-react'
import Image from 'next/image'

interface CreatePostProps {
  onPostCreated?: () => void
}

type PostMode = 'text' | 'poll'

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [mode, setMode] = useState<PostMode>('text')
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', file.type.startsWith('video/') ? 'video' : 'image')

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        const data = await res.json()
        if (data.success) {
          setMediaUrls(prev => [...prev, data.url])
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const removeMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index))
  }

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions(prev => [...prev, ''])
    }
  }

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updatePollOption = (index: number, value: string) => {
    setPollOptions(prev => prev.map((opt, i) => i === index ? value : opt))
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    if (mode === 'text' && !content.trim() && mediaUrls.length === 0) return
    if (mode === 'poll' && (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2)) return

    setIsSubmitting(true)
    try {
      const postData: Record<string, unknown> = {
        type: mode === 'poll' ? 'POLL' : mediaUrls.length > 0 ? 'PHOTO' : 'TEXT',
        content: content.trim() || undefined,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined
      }

      if (mode === 'poll') {
        postData.poll = {
          question: pollQuestion.trim(),
          options: pollOptions.filter(o => o.trim())
        }
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      })

      if (res.ok) {
        // Reset form
        setContent('')
        setMediaUrls([])
        setPollQuestion('')
        setPollOptions(['', ''])
        setMode('text')
        onPostCreated?.()
      }
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session?.user) {
    return null
  }

  return (
    <Card className="mb-6">
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar 
            src={session.user.image} 
            alt={session.user.name || 'User'}
            size="md"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in football?"
              className="w-full bg-transparent border-none resize-none text-white placeholder-slate-500 focus:outline-none text-lg"
              rows={3}
              maxLength={500}
            />

            {/* Media Preview */}
            <AnimatePresence>
              {mediaUrls.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`grid gap-2 mb-3 ${
                    mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  {mediaUrls.map((url, index) => (
                    <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-slate-800">
                      {url.includes('video') ? (
                        <video src={url} className="w-full h-full object-cover" />
                      ) : (
                        <Image src={url} alt="Upload preview" fill className="object-cover" />
                      )}
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-slate-900/80 rounded-full flex items-center justify-center hover:bg-slate-900 transition-colors"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Poll Creator */}
            <AnimatePresence>
              {mode === 'poll' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-800/50 rounded-xl p-4 mb-3"
                >
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full bg-transparent border-none text-white placeholder-slate-500 focus:outline-none font-medium mb-4"
                    maxLength={200}
                  />
                  
                  <div className="space-y-2">
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          maxLength={100}
                        />
                        {pollOptions.length > 2 && (
                          <button
                            onClick={() => removePollOption(index)}
                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {pollOptions.length < 4 && (
                    <button
                      onClick={addPollOption}
                      className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm mt-3 transition-colors"
                    >
                      <Plus size={16} />
                      Add option
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleMediaUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || mode === 'poll'}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add image"
            >
              {isUploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ImageIcon size={20} />
              )}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || mode === 'poll'}
              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add video"
            >
              <Video size={20} />
            </button>
            <button
              onClick={() => setMode(mode === 'poll' ? 'text' : 'poll')}
              className={`p-2 rounded-lg transition-colors ${
                mode === 'poll' 
                  ? 'text-emerald-400 bg-emerald-500/10' 
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50'
              }`}
              title="Create poll"
            >
              <BarChart3 size={20} />
            </button>
            <a
              href="/predictions"
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Make prediction"
            >
              <Trophy size={20} />
            </a>
          </div>

          <div className="flex items-center gap-3">
            {content.length > 0 && (
              <span className={`text-sm ${content.length > 450 ? 'text-amber-400' : 'text-slate-500'}`}>
                {content.length}/500
              </span>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (mode === 'text' && !content.trim() && mediaUrls.length === 0)}
              isLoading={isSubmitting}
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

