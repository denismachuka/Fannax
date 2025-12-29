import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get matches with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor')

    const where: Record<string, unknown> = {}
    
    if (status) {
      where.status = status
    }

    const matches = await prisma.match.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { scheduledAt: 'asc' },
      include: {
        homeTeam: true,
        awayTeam: true,
        _count: {
          select: {
            predictions: true
          }
        }
      }
    })

    let nextCursor: string | null = null
    if (matches.length > limit) {
      const nextItem = matches.pop()
      nextCursor = nextItem!.id
    }

    return NextResponse.json({
      matches,
      nextCursor
    })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}

