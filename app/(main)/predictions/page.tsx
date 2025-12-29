'use client'

import { useState } from 'react'
import { MatchSelector } from '@/components/predictions/MatchSelector'
import { PredictionForm } from '@/components/predictions/PredictionForm'
import { Trophy } from 'lucide-react'

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
  _count: {
    predictions: number
  }
}

export default function PredictionsPage() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  const handleMatchSelect = (match: Match) => {
    setSelectedMatch(match)
  }

  const handleBack = () => {
    setSelectedMatch(null)
  }

  const handleSuccess = () => {
    setSelectedMatch(null)
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-lg z-40 -mx-4 px-4 py-4 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-400" />
          <h1 className="text-xl font-bold text-white">Match Predictions</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          {selectedMatch ? 'Make your prediction' : 'Select a match to predict'}
        </p>
      </div>

      {/* Content */}
      {selectedMatch ? (
        <PredictionForm
          match={selectedMatch}
          onBack={handleBack}
          onSuccess={handleSuccess}
        />
      ) : (
        <MatchSelector
          onSelect={handleMatchSelect}
        />
      )}
    </div>
  )
}

