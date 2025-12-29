import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get upcoming matches
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7')
    const limit = parseInt(searchParams.get('limit') || '10')

    const now = new Date()
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const matches = await prisma.match.findMany({
      where: {
        scheduledAt: {
          gte: now,
          lte: endDate
        },
        status: 'SCHEDULED'
      },
      orderBy: { scheduledAt: 'asc' },
      take: limit,
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            logoUrl: true
          }
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortCode: true,
            logoUrl: true
          }
        },
        _count: {
          select: {
            predictions: true
          }
        }
      }
    })

    // Transform for simpler response
    const transformedMatches = matches.map(match => ({
      id: match.id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      league: match.leagueName,
      scheduledAt: match.scheduledAt.toISOString(),
      predictions: match._count.predictions
    }))

    return NextResponse.json({ matches: transformedMatches })
  } catch (error) {
    console.error('Error fetching upcoming matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

