import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    )
  }

  const normalizedUsername = username.toLowerCase().trim()

  // Validate username format
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(normalizedUsername)) {
    return NextResponse.json({
      available: false,
      reason: 'Username must be 3-20 characters, alphanumeric and underscores only'
    })
  }

  try {
    // Check if username is reserved for a team
    const reservedTeam = await prisma.team.findUnique({
      where: { reservedUsername: normalizedUsername }
    })

    if (reservedTeam) {
      return NextResponse.json({
        available: false,
        reason: 'This username is reserved for an official team account',
        isTeamUsername: true,
        teamName: reservedTeam.name
      })
    }

    // Check if username is already taken by a user
    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername }
    })

    if (existingUser) {
      return NextResponse.json({
        available: false,
        reason: 'Username is already taken'
      })
    }

    return NextResponse.json({
      available: true,
      username: normalizedUsername
    })
  } catch (error) {
    console.error('Error checking username:', error)
    return NextResponse.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    )
  }
}

