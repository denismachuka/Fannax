import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const commentSchema = z.object({
  content: z.string().min(1).max(500),
  parentId: z.string().optional()
})

// GET - Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const searchParams = request.nextUrl.searchParams
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '20')

    const comments = await prisma.comment.findMany({
      where: { 
        postId,
        parentId: null // Only top-level comments
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePhoto: true,
            isVerified: true
          }
        },
        replies: {
          take: 3,
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                profilePhoto: true
              }
            }
          }
        },
        _count: {
          select: { replies: true }
        }
      }
    })

    let nextCursor: string | null = null
    if (comments.length > limit) {
      const nextItem = comments.pop()
      nextCursor = nextItem!.id
    }

    return NextResponse.json({
      comments,
      nextCursor
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST - Create a comment
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
    const result = commentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { content, parentId } = result.data

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: session.user.id,
        parentId: parentId || null
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePhoto: true
          }
        }
      }
    })

    // Create notification for post author (if not self)
    if (post.authorId !== session.user.id) {
      await prisma.notification.create({
        data: {
          type: 'COMMENT',
          recipientId: post.authorId,
          senderId: session.user.id,
          postId,
          message: content.substring(0, 100)
        }
      })
    }

    // If replying to a comment, notify the parent comment author
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true }
      })

      if (parentComment && parentComment.authorId !== session.user.id) {
        await prisma.notification.create({
          data: {
            type: 'COMMENT',
            recipientId: parentComment.authorId,
            senderId: session.user.id,
            postId,
            message: content.substring(0, 100)
          }
        })
      }
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

