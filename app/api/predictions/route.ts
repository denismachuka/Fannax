import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createPredictionSchema = z.object({
  matchId: z.string(),
  predictedHomeScore: z.number().int().min(0).max(20),
  predictedAwayScore: z.number().int().min(0).max(20),
  caption: z.string().max(280).optional()
})

// GET - Get predictions for a match or user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const searchParams = request.nextUrl.searchParams
    const matchId = searchParams.get('matchId')
    const userId = searchParams.get('userId')
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    
    if (matchId) {
      where.matchId = matchId
    }
    if (userId) {
      where.userId = userId
    }

    const predictions = await prisma.prediction.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePhoto: true,
            isVerified: true
          }
        },
        match: {
          include: {
            homeTeam: true,
            awayTeam: true
          }
        },
        post: {
          include: {
            _count: {
              select: {
                likes: true,
                comments: true,
                shares: true
              }
            }
          }
        }
      }
    })

    let nextCursor: string | null = null
    if (predictions.length > limit) {
      const nextItem = predictions.pop()
      nextCursor = nextItem!.id
    }

    return NextResponse.json({
      predictions,
      nextCursor
    })
  } catch (error) {
    console.error('Error fetching predictions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    )
  }
}

// POST - Create a new prediction
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = createPredictionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { matchId, predictedHomeScore, predictedAwayScore, caption } = result.data

    // Check if match exists and hasn't started
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true
      }
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Cannot predict on a match that has already started' },
        { status: 400 }
      )
    }

    if (new Date(match.scheduledAt) <= new Date()) {
      return NextResponse.json(
        { error: 'Match has already started' },
        { status: 400 }
      )
    }

    // Check if user already predicted this match
    const existingPrediction = await prisma.prediction.findFirst({
      where: {
        matchId,
        userId: session.user.id
      }
    })

    if (existingPrediction) {
      return NextResponse.json(
        { error: 'You have already predicted this match' },
        { status: 400 }
      )
    }

    // Create post and prediction together
    const post = await prisma.post.create({
      data: {
        type: 'PREDICTION',
        content: caption,
        authorId: session.user.id,
        prediction: {
          create: {
            matchId,
            userId: session.user.id,
            predictedHomeScore,
            predictedAwayScore,
            caption,
            resultStatus: 'PENDING'
          }
        }
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePhoto: true,
            isVerified: true
          }
        },
        prediction: {
          include: {
            match: {
              include: {
                homeTeam: true,
                awayTeam: true
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Error creating prediction:', error)
    return NextResponse.json(
      { error: 'Failed to create prediction' },
      { status: 500 }
    )
  }
}

