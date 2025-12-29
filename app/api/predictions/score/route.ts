import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculatePredictionScore } from '@/lib/scoring'

// POST - Score predictions for finished matches
export async function POST(request: NextRequest) {
  try {
    // This should be protected by an API key or admin auth in production
    const authHeader = request.headers.get('authorization')
    const adminKey = process.env.ADMIN_API_KEY
    
    if (adminKey && authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find all finished matches with pending predictions
    const finishedMatches = await prisma.match.findMany({
      where: {
        status: 'FINISHED',
        homeScore: { not: null },
        awayScore: { not: null },
        predictions: {
          some: {
            resultStatus: 'PENDING'
          }
        }
      },
      include: {
        predictions: {
          where: {
            resultStatus: 'PENDING'
          },
          include: {
            user: true
          }
        }
      }
    })

    let scored = 0
    let errors = 0

    for (const match of finishedMatches) {
      for (const prediction of match.predictions) {
        try {
          const result = calculatePredictionScore(
            {
              predictedHomeScore: prediction.predictedHomeScore,
              predictedAwayScore: prediction.predictedAwayScore
            },
            {
              homeScore: match.homeScore!,
              awayScore: match.awayScore!
            }
          )

          // Update prediction with result
          await prisma.prediction.update({
            where: { id: prediction.id },
            data: {
              resultStatus: result.result,
              pointsAwarded: result.points
            }
          })

          // Update user's total points
          await prisma.user.update({
            where: { id: prediction.userId },
            data: {
              totalPoints: {
                increment: result.points
              }
            }
          })

          // Create notification
          await prisma.notification.create({
            data: {
              type: 'PREDICTION_RESULT',
              recipientId: prediction.userId,
              message: `Your prediction was ${result.result === 'EXACT_MATCH' ? 'a perfect match!' : result.result === 'CORRECT_WINNER' ? 'correct!' : 'incorrect.'} (${result.points > 0 ? '+' : ''}${result.points} points)`,
              postId: prediction.postId
            }
          })

          scored++
        } catch (error) {
          console.error('Error scoring prediction:', error)
          errors++
        }
      }
    }

    return NextResponse.json({
      success: true,
      matchesProcessed: finishedMatches.length,
      predictionsScored: scored,
      errors
    })
  } catch (error) {
    console.error('Error scoring predictions:', error)
    return NextResponse.json(
      { error: 'Failed to score predictions' },
      { status: 500 }
    )
  }
}

