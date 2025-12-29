import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Search teams
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { shortCode: { contains: query, mode: 'insensitive' as const } },
            { reservedUsername: { contains: query.toLowerCase(), mode: 'insensitive' as const } }
          ]
        }
      : {}

    const teams = await prisma.team.findMany({
      where,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        shortCode: true,
        logoUrl: true,
        reservedUsername: true
      }
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

