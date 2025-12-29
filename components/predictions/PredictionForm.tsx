'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { formatDate, formatTime, getTimeUntil } from '@/lib/utils'
import { Clock, MapPin, Minus, Plus, ArrowLeft, Trophy } from 'lucide-react'

interface Team {
  id: string
  name: string
  shortCode: string | null
  logoUrl: string | null
}

interface Match {
  id: string
  leagueName: string | null
  venue: string | null
  scheduledAt: string
  status: string
  homeTeam: Team
  awayTeam: Team
}

interface PredictionFormProps {
  match: Match
  onBack: () => void
  onSuccess?: () => void
}

export function PredictionForm({ match, onBack, onSuccess }: PredictionFormProps) {
  const router = useRouter()
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [caption, setCaption] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleScoreChange = (
    team: 'home' | 'away',
    action: 'increment' | 'decrement'
  ) => {
    const setScore = team === 'home' ? setHomeScore : setAwayScore
    const currentScore = team === 'home' ? homeScore : awayScore

    if (action === 'increment' && currentScore < 20) {
      setScore(currentScore + 1)
    } else if (action === 'decrement' && currentScore > 0) {
      setScore(currentScore - 1)
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          predictedHomeScore: homeScore,
          predictedAwayScore: awayScore,
          caption: caption.trim() || undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create prediction')
        return
      }

      onSuccess?.()
      router.push('/home')
    } catch (err) {
      console.error('Error creating prediction:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const ScoreSelector = ({ 
    team, 
    score, 
    teamData 
  }: { 
    team: 'home' | 'away'
    score: number
    teamData: Team
  }) => (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-3 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
        {teamData.logoUrl ? (
          <Image
            src={teamData.logoUrl}
            alt={teamData.name}
            width={48}
            height={48}
            className="object-contain"
          />
        ) : (
          <span className="text-lg font-bold text-slate-400">
            {teamData.shortCode || teamData.name.substring(0, 3).toUpperCase()}
          </span>
        )}
      </div>
      <h4 className="font-semibold text-white mb-1">{teamData.name}</h4>
      <p className="text-sm text-slate-400 mb-4">{teamData.shortCode}</p>
      
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => handleScoreChange(team, 'decrement')}
          disabled={score === 0}
          className="w-10 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
        >
          <Minus size={18} className="text-white" />
        </button>
        <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 rounded-xl flex items-center justify-center">
          <span className="text-3xl font-bold text-white">{score}</span>
        </div>
        <button
          onClick={() => handleScoreChange(team, 'increment')}
          disabled={score >= 20}
          className="w-10 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
        >
          <Plus size={18} className="text-white" />
        </button>
      </div>
    </div>
  )

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to matches</span>
      </button>

      {/* Match Card */}
      <Card className="mb-6">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="league-badge">{match.leagueName || 'Football'}</span>
            <span className="time-badge flex items-center gap-1.5">
              <Clock size={14} />
              {getTimeUntil(match.scheduledAt)}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <ScoreSelector 
              team="home" 
              score={homeScore} 
              teamData={match.homeTeam}
            />
            
            <div className="text-center px-4">
              <div className="text-2xl font-bold text-slate-500 mb-2">VS</div>
              <p className="text-emerald-400 text-sm">{formatTime(match.scheduledAt)}</p>
              <p className="text-slate-500 text-xs mt-1">{formatDate(match.scheduledAt)}</p>
            </div>

            <ScoreSelector 
              team="away" 
              score={awayScore} 
              teamData={match.awayTeam}
            />
          </div>
        </div>

        {match.venue && (
          <div className="px-4 pb-4 flex items-center justify-center gap-1 text-sm text-slate-500">
            <MapPin size={14} />
            <span>{match.venue}</span>
          </div>
        )}
      </Card>

      {/* Prediction Summary */}
      <Card className="mb-6 p-4">
        <h3 className="text-sm font-medium text-slate-400 mb-3">Your Prediction</h3>
        <div className="flex items-center justify-center gap-4 text-center">
          <div>
            <p className="text-lg font-semibold text-white">{match.homeTeam.shortCode || match.homeTeam.name}</p>
            <p className="text-3xl font-bold text-emerald-400">{homeScore}</p>
          </div>
          <span className="text-2xl text-slate-500">-</span>
          <div>
            <p className="text-lg font-semibold text-white">{match.awayTeam.shortCode || match.awayTeam.name}</p>
            <p className="text-3xl font-bold text-emerald-400">{awayScore}</p>
          </div>
        </div>
      </Card>

      {/* Caption */}
      <div className="mb-6">
        <Textarea
          label="Add a caption (optional)"
          placeholder="Share your thoughts about this prediction..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          charCount
          maxChars={280}
        />
      </div>

      {/* Points Info */}
      <Card className="mb-6 p-4 bg-slate-800/30">
        <div className="flex items-center gap-3 mb-3">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-medium text-white">Points System</h3>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-slate-400">Exact score match</span>
            <span className="text-emerald-400 font-medium">+3 points</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-slate-400">Correct winner, wrong score</span>
            <span className="text-emerald-400 font-medium">+2 points</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-slate-400">Incorrect prediction</span>
            <span className="text-red-400 font-medium">-1 point</span>
          </li>
        </ul>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        isLoading={isSubmitting}
        className="w-full"
        size="lg"
      >
        <Trophy size={18} className="mr-2" />
        Submit Prediction
      </Button>
    </div>
  )
}

