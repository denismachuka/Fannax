'use client'

import Image from 'next/image'
import { formatDate, formatTime, getTimeUntil } from '@/lib/utils'
import { getResultColorClass, getResultDisplayText } from '@/lib/scoring'
import { Clock, MapPin, Trophy } from 'lucide-react'

interface Team {
  id: string
  name: string
  shortCode: string | null
  logoUrl: string | null
}

interface PredictionCardProps {
  prediction: {
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
      homeTeam: Team
      awayTeam: Team
    }
  }
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const { match, predictedHomeScore, predictedAwayScore, caption, pointsAwarded, resultStatus } = prediction
  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'LIVE'

  return (
    <div className="match-card overflow-hidden">
      {/* League Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
        <span className="league-badge">{match.leagueName || 'Football'}</span>
        {isLive ? (
          <span className="time-badge flex items-center gap-1.5 bg-red-500/15 border-red-500/30 text-red-400">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            LIVE
          </span>
        ) : !isFinished ? (
          <span className="time-badge flex items-center gap-1.5">
            <Clock size={14} />
            {getTimeUntil(match.scheduledAt)}
          </span>
        ) : (
          <span className="time-badge bg-slate-700/50 border-slate-600 text-slate-400">
            FT
          </span>
        )}
      </div>

      {/* Match Content */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
              {match.homeTeam.logoUrl ? (
                <Image
                  src={match.homeTeam.logoUrl}
                  alt={match.homeTeam.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              ) : (
                <span className="text-lg font-bold text-slate-400">
                  {match.homeTeam.shortCode || match.homeTeam.name.substring(0, 3).toUpperCase()}
                </span>
              )}
            </div>
            <h4 className="font-semibold text-white mb-1">{match.homeTeam.name}</h4>
            <span className="text-sm text-slate-400">{match.homeTeam.shortCode}</span>
          </div>

          {/* Score / Prediction */}
          <div className="px-6 text-center">
            {/* Prediction Score */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2 mb-2">
              <span className="text-xs text-emerald-400 font-medium block mb-1">PREDICTION</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white">{predictedHomeScore}</span>
                <span className="text-slate-500">-</span>
                <span className="text-2xl font-bold text-white">{predictedAwayScore}</span>
              </div>
            </div>

            {/* Actual Score (if finished) */}
            {isFinished && match.homeScore !== null && match.awayScore !== null && (
              <div className="bg-slate-700/50 rounded-lg px-3 py-1.5">
                <span className="text-xs text-slate-400 block mb-0.5">RESULT</span>
                <div className="flex items-center gap-2 text-lg font-semibold text-white">
                  <span>{match.homeScore}</span>
                  <span className="text-slate-500">-</span>
                  <span>{match.awayScore}</span>
                </div>
              </div>
            )}

            {!isFinished && !isLive && (
              <div className="text-slate-400 text-sm">
                {formatTime(match.scheduledAt)}
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
              {match.awayTeam.logoUrl ? (
                <Image
                  src={match.awayTeam.logoUrl}
                  alt={match.awayTeam.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              ) : (
                <span className="text-lg font-bold text-slate-400">
                  {match.awayTeam.shortCode || match.awayTeam.name.substring(0, 3).toUpperCase()}
                </span>
              )}
            </div>
            <h4 className="font-semibold text-white mb-1">{match.awayTeam.name}</h4>
            <span className="text-sm text-slate-400">{match.awayTeam.shortCode}</span>
          </div>
        </div>
      </div>

      {/* Caption */}
      {caption && (
        <div className="px-4 pb-3">
          <p className="text-slate-300 text-sm italic">&ldquo;{caption}&rdquo;</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-slate-400">
          {match.venue && (
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{match.venue}</span>
            </div>
          )}
          <span>{formatDate(match.scheduledAt)}</span>
        </div>

        {/* Result Badge */}
        {resultStatus && resultStatus !== 'PENDING' && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
            getResultColorClass(resultStatus)
          }`}>
            <Trophy size={14} />
            <span>{getResultDisplayText(resultStatus)}</span>
            {pointsAwarded !== null && (
              <span className="ml-1">
                ({pointsAwarded > 0 ? '+' : ''}{pointsAwarded}pts)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

