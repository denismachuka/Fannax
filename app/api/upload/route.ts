import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads'
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
]

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime'
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null // 'image' or 'video'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      )
    }

    // Check file type
    const allowedTypes = type === 'video' 
      ? [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES]
      : ALLOWED_IMAGE_TYPES

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `${uuidv4()}.${ext}`
    
    // Determine subfolder based on type
    const subfolder = ALLOWED_VIDEO_TYPES.includes(file.type) ? 'videos' : 'images'
    const uploadPath = join(UPLOAD_DIR, subfolder)

    // Ensure upload directory exists
    await mkdir(uploadPath, { recursive: true })

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const filePath = join(uploadPath, filename)
    await writeFile(filePath, buffer)

    // Return public URL
    const publicUrl = `/uploads/${subfolder}/${filename}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      type: subfolder === 'videos' ? 'video' : 'image'
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// Route segment config for Next.js
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

