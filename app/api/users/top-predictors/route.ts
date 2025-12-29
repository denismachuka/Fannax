import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get top predictors by points
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    const users = await prisma.user.findMany({
      where: {
        totalPoints: { gt: 0 }
      },
      orderBy: {
        totalPoints: 'desc'
      },
      take: limit,
      select: {
        id: true,
        username: true,
        name: true,
        profilePhoto: true,
        totalPoints: true,
        isVerified: true,
        _count: {
          select: {
            predictions: true
          }
        }
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching top predictors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top predictors' },
      { status: 500 }
    )
  }
}

