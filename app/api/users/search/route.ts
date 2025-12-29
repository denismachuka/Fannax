import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Search users
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query.toLowerCase(), mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: limit,
      orderBy: { totalPoints: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        profilePhoto: true,
        isVerified: true,
        isTeamAccount: true,
        totalPoints: true
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    )
  }
}

