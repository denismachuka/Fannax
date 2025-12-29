// Prediction Scoring Logic for Fannax

// PredictionResult enum values
export const PredictionResult = {
  PENDING: 'PENDING',
  EXACT_MATCH: 'EXACT_MATCH',
  CORRECT_WINNER: 'CORRECT_WINNER',
  INCORRECT: 'INCORRECT'
} as const

export type PredictionResult = typeof PredictionResult[keyof typeof PredictionResult]

export interface PredictionData {
  predictedHomeScore: number
  predictedAwayScore: number
}

export interface MatchResult {
  homeScore: number
  awayScore: number
}

export interface ScoringResult {
  result: typeof PredictionResult[keyof typeof PredictionResult]
  points: number
  description: string
}

/**
 * Calculate prediction result and points
 * 
 * Scoring Rules:
 * - Exact match (correct team AND exact score): +3 points
 * - Correct winner/draw but wrong score: +2 points
 * - Incorrect prediction (wrong winner/draw): -1 point
 */
export function calculatePredictionScore(
  prediction: PredictionData,
  actualResult: MatchResult
): ScoringResult {
  const { predictedHomeScore, predictedAwayScore } = prediction
  const { homeScore, awayScore } = actualResult

  // Determine predicted outcome
  const predictedOutcome = getPredictedOutcome(predictedHomeScore, predictedAwayScore)
  
  // Determine actual outcome
  const actualOutcome = getPredictedOutcome(homeScore, awayScore)

  // Case 1: Exact match - both correct score AND correct winner
  if (predictedHomeScore === homeScore && predictedAwayScore === awayScore) {
    return {
      result: PredictionResult.EXACT_MATCH,
      points: 3,
      description: 'Perfect prediction! Exact score match.'
    }
  }

  // Case 2: Correct winner/draw but wrong scores
  if (predictedOutcome === actualOutcome) {
    return {
      result: PredictionResult.CORRECT_WINNER,
      points: 2,
      description: 'Correct winner prediction, but wrong score.'
    }
  }

  // Case 3: Wrong prediction
  return {
    result: PredictionResult.INCORRECT,
    points: -1,
    description: 'Incorrect prediction.'
  }
}

type Outcome = 'home' | 'away' | 'draw'

function getPredictedOutcome(homeScore: number, awayScore: number): Outcome {
  if (homeScore > awayScore) return 'home'
  if (homeScore < awayScore) return 'away'
  return 'draw'
}

/**
 * Get points awarded for a prediction result type
 */
export function getPointsForResult(result: string): number {
  switch (result) {
    case PredictionResult.EXACT_MATCH:
      return 3
    case PredictionResult.CORRECT_WINNER:
      return 2
    case PredictionResult.INCORRECT:
      return -1
    default:
      return 0
  }
}

/**
 * Get display text for prediction result
 */
export function getResultDisplayText(result: string): string {
  switch (result) {
    case PredictionResult.EXACT_MATCH:
      return 'Exact Match!'
    case PredictionResult.CORRECT_WINNER:
      return 'Correct Winner'
    case PredictionResult.INCORRECT:
      return 'Incorrect'
    case PredictionResult.PENDING:
      return 'Pending'
    default:
      return 'Unknown'
  }
}

/**
 * Get color class for prediction result
 */
export function getResultColorClass(result: string | null): string {
  switch (result) {
    case PredictionResult.EXACT_MATCH:
      return 'text-green-500 bg-green-500/10'
    case PredictionResult.CORRECT_WINNER:
      return 'text-emerald-400 bg-emerald-500/10'
    case PredictionResult.INCORRECT:
      return 'text-red-500 bg-red-500/10'
    case PredictionResult.PENDING:
      return 'text-yellow-500 bg-yellow-500/10'
    default:
      return 'text-gray-500 bg-gray-500/10'
  }
}

/**
 * Calculate user ranking based on total points
 */
export function calculateRank(totalPoints: number, allUserPoints: number[]): number {
  const sortedPoints = [...allUserPoints].sort((a, b) => b - a)
  return sortedPoints.findIndex(p => p === totalPoints) + 1
}

/**
 * Get rank badge based on position
 */
export function getRankBadge(rank: number): { emoji: string; label: string } {
  switch (rank) {
    case 1:
      return { emoji: '🥇', label: 'Gold' }
    case 2:
      return { emoji: '🥈', label: 'Silver' }
    case 3:
      return { emoji: '🥉', label: 'Bronze' }
    default:
      return { emoji: '🏅', label: `#${rank}` }
  }
}

/**
 * Format prediction score display
 */
export function formatPredictionScore(homeScore: number, awayScore: number): string {
  return `${homeScore} - ${awayScore}`
}

/**
 * Validate prediction scores
 */
export function validatePredictionScores(homeScore: number, awayScore: number): boolean {
  return (
    Number.isInteger(homeScore) &&
    Number.isInteger(awayScore) &&
    homeScore >= 0 &&
    awayScore >= 0 &&
    homeScore <= 20 &&
    awayScore <= 20
  )
}

