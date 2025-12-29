import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const shareSchema = z.object({
  caption: z.string().max(280).optional()
})

// POST - Share a post
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
    const result = shareSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { caption } = result.data

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Create share
    const share = await prisma.share.create({
      data: {
        postId,
        userId: session.user.id,
        caption
      }
    })

    // Create notification for post author (if not self)
    if (post.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: 'SHARE',
          recipientId: post.authorId,
          senderId: session.user.id,
          postId
        }
      })
    }

    const shareCount = await prisma.share.count({
      where: { postId }
    })

    return NextResponse.json({
      share,
      shareCount
    }, { status: 201 })
  } catch (error) {
    console.error('Error sharing post:', error)
    return NextResponse.json(
      { error: 'Failed to share post' },
      { status: 500 }
    )
  }
}

