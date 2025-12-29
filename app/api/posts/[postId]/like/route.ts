import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Like a post
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

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id
        }
      }
    })

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id }
      })

      const likeCount = await prisma.like.count({
        where: { postId }
      })

      return NextResponse.json({
        liked: false,
        likeCount
      })
    }

    // Like
    await prisma.like.create({
      data: {
        postId,
        userId: session.user.id
      }
    })

    // Create notification for post author (if not self)
    if (post.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: 'LIKE',
          recipientId: post.authorId,
          senderId: session.user.id,
          postId
        }
      })
    }

    const likeCount = await prisma.like.count({
      where: { postId }
    })

    return NextResponse.json({
      liked: true,
      likeCount
    })
  } catch (error) {
    console.error('Error liking post:', error)
    return NextResponse.json(
      { error: 'Failed to like post' },
      { status: 500 }
    )
  }
}

