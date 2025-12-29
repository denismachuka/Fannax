'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Clock } from 'lucide-react'
import { getTimeUntil } from '@/lib/utils'

interface PollOption {
  id: string
  text: string
  _count: { votes: number }
}

interface PollCardProps {
  poll: {
    id: string
    question: string
    endsAt: string | null
    options: PollOption[]
  }
  postId: string
}

export function PollCard({ poll, postId }: PollCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [options, setOptions] = useState(poll.options)
  const [isVoting, setIsVoting] = useState(false)

  const totalVotes = options.reduce((sum, opt) => sum + opt._count.votes, 0)
  const isPollEnded = poll.endsAt ? new Date() > new Date(poll.endsAt) : false

  const handleVote = async (optionId: string) => {
    if (hasVoted || isVoting || isPollEnded) return
    
    setIsVoting(true)
    setSelectedOption(optionId)

    try {
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId })
      })

      const data = await res.json()
      if (data.poll) {
        setOptions(data.poll.options)
        setHasVoted(true)
      }
    } catch (error) {
      console.error('Error voting:', error)
      setSelectedOption(null)
    } finally {
      setIsVoting(false)
    }
  }

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0
    return Math.round((votes / totalVotes) * 100)
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-4">
      <h4 className="font-medium text-white mb-4">{poll.question}</h4>

      <div className="space-y-2">
        {options.map((option) => {
          const percentage = getPercentage(option._count.votes)
          const isSelected = selectedOption === option.id

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted || isVoting || isPollEnded}
              className={`w-full relative overflow-hidden rounded-lg transition-all ${
                hasVoted || isPollEnded
                  ? 'cursor-default'
                  : 'cursor-pointer hover:bg-slate-700/50'
              }`}
            >
              {/* Background progress bar */}
              {(hasVoted || isPollEnded) && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`absolute inset-y-0 left-0 ${
                    isSelected ? 'bg-emerald-500/30' : 'bg-slate-700/50'
                  }`}
                />
              )}

              <div className={`relative flex items-center justify-between px-4 py-3 border rounded-lg ${
                isSelected 
                  ? 'border-emerald-500' 
                  : 'border-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className={`${isSelected ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {option.text}
                  </span>
                </div>
                
                {(hasVoted || isPollEnded) && (
                  <span className="text-sm font-medium text-slate-400">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 text-sm text-slate-400">
        <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        {poll.endsAt && (
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>
              {isPollEnded ? 'Poll ended' : `${getTimeUntil(poll.endsAt)} left`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

