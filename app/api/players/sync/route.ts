import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sportmonks } from '@/lib/sportmonks'

// POST - Sync players from SportMonks API
export async function POST(request: NextRequest) {
  try {
    // This should be protected by an API key or admin auth in production
    const authHeader = request.headers.get('authorization')
    const adminKey = process.env.ADMIN_API_KEY
    
    if (adminKey && authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let page = 1
    let hasMore = true
    let created = 0
    let updated = 0
    let errors = 0
    const maxPages = 100 // Limit to prevent timeout

    while (hasMore && page <= maxPages) {
      try {
        const response = await sportmonks.getPlayers(page, 100)
        const players = response.data

        for (const player of players) {
          try {
            const existingPlayer = await prisma.player.findUnique({
              where: { sportmonksId: player.id }
            })

            if (existingPlayer) {
              await prisma.player.update({
                where: { sportmonksId: player.id },
                data: {
                  name: player.name,
                  displayName: player.display_name,
                  photoUrl: player.image_path
                }
              })
              updated++
            } else {
              await prisma.player.create({
                data: {
                  sportmonksId: player.id,
                  name: player.name,
                  displayName: player.display_name,
                  photoUrl: player.image_path
                }
              })
              created++
            }
          } catch (error) {
            console.error('Error processing player:', error)
            errors++
          }
        }

        hasMore = response.pagination?.has_more || false
        page++

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('Error fetching players page:', error)
        hasMore = false
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors,
      pagesProcessed: page - 1
    })
  } catch (error) {
    console.error('Error syncing players:', error)
    return NextResponse.json(
      { error: 'Failed to sync players' },
      { status: 500 }
    )
  }
}

