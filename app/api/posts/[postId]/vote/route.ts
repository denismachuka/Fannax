import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Vote on a poll
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { optionId } = body

    if (!optionId) {
      return NextResponse.json({ error: 'Option ID is required' }, { status: 400 })
    }

    // Get the poll and verify it belongs to the post
    const poll = await prisma.poll.findUnique({
      where: { postId },
      include: {
        options: true
      }
    })

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Check if poll has ended
    if (poll.endsAt && new Date() > poll.endsAt) {
      return NextResponse.json({ error: 'Poll has ended' }, { status: 400 })
    }

    // Verify option belongs to this poll
    const option = poll.options.find(o => o.id === optionId)
    if (!option) {
      return NextResponse.json({ error: 'Invalid option' }, { status: 400 })
    }

    // Check if user already voted
    const existingVote = await prisma.pollVote.findFirst({
      where: {
        userId: session.user.id,
        option: {
          pollId: poll.id
        }
      }
    })

    if (existingVote) {
      // Update vote to new option
      await prisma.pollVote.update({
        where: { id: existingVote.id },
        data: { optionId }
      })
    } else {
      // Create new vote
      await prisma.pollVote.create({
        data: {
          userId: session.user.id,
          optionId
        }
      })
    }

    // Get updated vote counts
    const updatedPoll = await prisma.poll.findUnique({
      where: { postId },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      poll: updatedPoll,
      votedOptionId: optionId
    })
  } catch (error) {
    console.error('Error voting on poll:', error)
    return NextResponse.json(
      { error: 'Failed to vote on poll' },
      { status: 500 }
    )
  }
}

