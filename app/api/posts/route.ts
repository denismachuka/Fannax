import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { PostType } from '@prisma/client'
import { extractMentions } from '@/lib/mentions'

const createPostSchema = z.object({
  type: z.enum(['TEXT', 'PHOTO', 'POLL']),
  content: z.string().max(500).optional(),
  mediaUrls: z.array(z.string()).optional(),
  poll: z.object({
    question: z.string().min(1).max(200),
    options: z.array(z.string().min(1).max(100)).min(2).max(4),
    endsAt: z.string().optional()
  }).optional()
})

// GET - Fetch posts (feed)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const searchParams = request.nextUrl.searchParams
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') as PostType | null

    const where: Record<string, unknown> = {}
    
    // Filter by user if specified
    if (userId) {
      where.authorId = userId
    }

    // Filter by type if specified
    if (type) {
      where.type = type
    }

    const posts = await prisma.post.findMany({
      where,
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
            isVerified: true,
            isTeamAccount: true
          }
        },
        poll: {
          include: {
            options: {
              include: {
                _count: {
                  select: { votes: true }
                }
              }
            }
          }
        },
        prediction: {
          include: {
            match: {
              include: {
                homeTeam: true,
                awayTeam: true
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        },
        likes: session?.user?.id ? {
          where: { userId: session.user.id },
          select: { id: true }
        } : false
      }
    })

    let nextCursor: string | null = null
    if (posts.length > limit) {
      const nextItem = posts.pop()
      nextCursor = nextItem!.id
    }

    // Transform posts to include isLiked flag
    const transformedPosts = posts.map(post => ({
      ...post,
      isLiked: post.likes && post.likes.length > 0,
      likes: undefined
    }))

    return NextResponse.json({
      posts: transformedPosts,
      nextCursor
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = createPostSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { type, content, mediaUrls, poll } = result.data

    // Create post with poll if applicable
    const post = await prisma.post.create({
      data: {
        type: type as PostType,
        content,
        mediaUrls: mediaUrls || [],
        authorId: session.user.id,
        ...(poll && type === 'POLL' ? {
          poll: {
            create: {
              question: poll.question,
              endsAt: poll.endsAt ? new Date(poll.endsAt) : null,
              options: {
                create: poll.options.map(text => ({ text }))
              }
            }
          }
        } : {})
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            profilePhoto: true,
            isVerified: true,
            isTeamAccount: true
          }
        },
        poll: {
          include: {
            options: {
              include: {
                _count: {
                  select: { votes: true }
                }
              }
            }
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    })

    // Extract and create mentions
    if (content) {
      const mentions = extractMentions(content)
      for (const mention of mentions) {
        const player = await prisma.player.findFirst({
          where: {
            OR: [
              { displayName: { contains: mention.username, mode: 'insensitive' } },
              { name: { contains: mention.username, mode: 'insensitive' } }
            ]
          }
        })

        if (player) {
          await prisma.postMention.create({
            data: {
              postId: post.id,
              playerId: player.id
            }
          })
        }
      }
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

