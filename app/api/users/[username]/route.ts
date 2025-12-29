import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get user profile by username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const session = await auth()

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        profilePhoto: true,
        isVerified: true,
        isTeamAccount: true,
        totalPoints: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
            predictions: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if current user is following this user
    let isFollowing = false
    if (session?.user?.id && session.user.id !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: user.id
          }
        }
      })
      isFollowing = !!follow
    }

    // Calculate prediction accuracy
    const predictions = await prisma.prediction.findMany({
      where: {
        userId: user.id,
        resultStatus: { not: 'PENDING' }
      },
      select: {
        resultStatus: true
      }
    })

    const totalPredictions = predictions.length
    const correctPredictions = predictions.filter(
      p => p.resultStatus === 'EXACT_MATCH' || p.resultStatus === 'CORRECT_WINNER'
    ).length
    const accuracy = totalPredictions > 0 
      ? Math.round((correctPredictions / totalPredictions) * 100) 
      : 0

    return NextResponse.json({
      ...user,
      isFollowing,
      stats: {
        totalPredictions,
        correctPredictions,
        accuracy
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH - Update user profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, bio, profilePhoto } = body

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || undefined,
        bio: bio !== undefined ? bio : undefined,
        profilePhoto: profilePhoto !== undefined ? profilePhoto : undefined
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        profilePhoto: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

