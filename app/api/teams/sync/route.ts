import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sportmonks } from '@/lib/sportmonks'

// POST - Sync teams from SportMonks API
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

    while (hasMore) {
      try {
        const response = await sportmonks.getTeams(page, 100)
        const teams = response.data

        for (const team of teams) {
          try {
            const reservedUsername = team.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')
              .substring(0, 20)

            const existingTeam = await prisma.team.findUnique({
              where: { sportmonksId: team.id }
            })

            if (existingTeam) {
              await prisma.team.update({
                where: { sportmonksId: team.id },
                data: {
                  name: team.name,
                  shortCode: team.short_code,
                  logoUrl: team.image_path,
                  countryId: team.country_id
                }
              })
              updated++
            } else {
              // Check if reserved username is taken
              let finalUsername = reservedUsername
              let counter = 1
              while (await prisma.team.findUnique({ where: { reservedUsername: finalUsername } })) {
                finalUsername = `${reservedUsername}${counter}`
                counter++
              }

              await prisma.team.create({
                data: {
                  sportmonksId: team.id,
                  name: team.name,
                  shortCode: team.short_code,
                  logoUrl: team.image_path,
                  reservedUsername: finalUsername,
                  countryId: team.country_id
                }
              })
              created++
            }
          } catch (error) {
            console.error('Error processing team:', error)
            errors++
          }
        }

        hasMore = response.pagination?.has_more || false
        page++

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('Error fetching teams page:', error)
        hasMore = false
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors
    })
  } catch (error) {
    console.error('Error syncing teams:', error)
    return NextResponse.json(
      { error: 'Failed to sync teams' },
      { status: 500 }
    )
  }
}

