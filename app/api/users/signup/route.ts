import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schemas for each step
const step1Schema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
})

const step2Schema = z.object({
  username: z.string(),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters')
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone number is required'
})

const step3Schema = z.object({
  username: z.string(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  profilePhoto: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { step } = body

    switch (step) {
      case 1: {
        // Validate username only
        const result = step1Schema.safeParse(body)
        if (!result.success) {
          return NextResponse.json(
            { error: result.error.issues[0].message },
            { status: 400 }
          )
        }

        const username = result.data.username.toLowerCase()

        // Check if reserved for team
        const reservedTeam = await prisma.team.findUnique({
          where: { reservedUsername: username }
        })

        if (reservedTeam) {
          return NextResponse.json({
            success: false,
            error: 'This username is reserved for an official team account',
            isTeamUsername: true,
            teamName: reservedTeam.name
          }, { status: 400 })
        }

        // Check if already taken
        const existingUser = await prisma.user.findUnique({
          where: { username }
        })

        if (existingUser) {
          return NextResponse.json({
            success: false,
            error: 'Username is already taken'
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          username
        })
      }

      case 2: {
        // Validate and create user account
        const result = step2Schema.safeParse(body)
        if (!result.success) {
          return NextResponse.json(
            { error: result.error.issues[0].message },
            { status: 400 }
          )
        }

        const { username, name, email, phone, password } = result.data
        const normalizedUsername = username.toLowerCase()

        // Check if email already exists
        if (email) {
          const existingEmail = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
          })
          if (existingEmail) {
            return NextResponse.json({
              success: false,
              error: 'Email is already registered'
            }, { status: 400 })
          }
        }

        // Check if phone already exists
        if (phone) {
          const existingPhone = await prisma.user.findFirst({
            where: { phone }
          })
          if (existingPhone) {
            return NextResponse.json({
              success: false,
              error: 'Phone number is already registered'
            }, { status: 400 })
          }
        }

        // Hash password
        const hashedPassword = await hash(password, 12)

        // Create user
        const user = await prisma.user.create({
          data: {
            username: normalizedUsername,
            name,
            email: email?.toLowerCase() || null,
            phone: phone || null,
            password: hashedPassword
          }
        })

        return NextResponse.json({
          success: true,
          userId: user.id,
          username: user.username
        })
      }

      case 3: {
        // Update profile with bio and photo
        const result = step3Schema.safeParse(body)
        if (!result.success) {
          return NextResponse.json(
            { error: result.error.issues[0].message },
            { status: 400 }
          )
        }

        const { username, bio, profilePhoto } = result.data

        const user = await prisma.user.update({
          where: { username: username.toLowerCase() },
          data: {
            bio: bio || null,
            profilePhoto: profilePhoto || null
          }
        })

        return NextResponse.json({
          success: true,
          userId: user.id,
          username: user.username,
          completed: true
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid step' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    )
  }
}

