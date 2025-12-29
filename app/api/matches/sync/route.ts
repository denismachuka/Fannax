import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sportmonks, parseFixtureToMatch } from '@/lib/sportmonks'

// POST - Sync matches from SportMonks API
export async function POST(request: NextRequest) {
  try {
    // This should be protected by an API key or admin auth in production
    const authHeader = request.headers.get('authorization')
    const adminKey = process.env.ADMIN_API_KEY
    
    if (adminKey && authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { days = 7 } = body

    // Fetch upcoming fixtures from SportMonks
    const response = await sportmonks.getUpcomingFixtures(days)
    const fixtures = response.data

    let created = 0
    let updated = 0
    let errors = 0

    for (const fixture of fixtures) {
      try {
        const matchData = parseFixtureToMatch(fixture)
        
        if (!matchData.homeTeam || !matchData.awayTeam) {
          errors++
          continue
        }

        // Upsert home team
        const homeTeam = await prisma.team.upsert({
          where: { sportmonksId: matchData.homeTeam.sportmonksId },
          create: {
            sportmonksId: matchData.homeTeam.sportmonksId,
            name: matchData.homeTeam.name,
            shortCode: matchData.homeTeam.shortCode,
            logoUrl: matchData.homeTeam.logoUrl,
            reservedUsername: matchData.homeTeam.name.toLowerCase().replace(/[^a-z0-9]/g, '')
          },
          update: {
            name: matchData.homeTeam.name,
            shortCode: matchData.homeTeam.shortCode,
            logoUrl: matchData.homeTeam.logoUrl
          }
        })

        // Upsert away team
        const awayTeam = await prisma.team.upsert({
          where: { sportmonksId: matchData.awayTeam.sportmonksId },
          create: {
            sportmonksId: matchData.awayTeam.sportmonksId,
            name: matchData.awayTeam.name,
            shortCode: matchData.awayTeam.shortCode,
            logoUrl: matchData.awayTeam.logoUrl,
            reservedUsername: matchData.awayTeam.name.toLowerCase().replace(/[^a-z0-9]/g, '')
          },
          update: {
            name: matchData.awayTeam.name,
            shortCode: matchData.awayTeam.shortCode,
            logoUrl: matchData.awayTeam.logoUrl
          }
        })

        // Upsert match
        const existingMatch = await prisma.match.findUnique({
          where: { sportmonksId: matchData.sportmonksId }
        })

        if (existingMatch) {
          await prisma.match.update({
            where: { sportmonksId: matchData.sportmonksId },
            data: {
              homeScore: matchData.homeScore,
              awayScore: matchData.awayScore,
              status: matchData.isFinished ? 'FINISHED' : matchData.isLive ? 'LIVE' : 'SCHEDULED',
              venue: matchData.venue,
              leagueName: matchData.leagueName,
              leagueId: matchData.leagueId
            }
          })
          updated++
        } else {
          await prisma.match.create({
            data: {
              sportmonksId: matchData.sportmonksId,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              homeScore: matchData.homeScore,
              awayScore: matchData.awayScore,
              scheduledAt: matchData.scheduledAt,
              venue: matchData.venue,
              leagueName: matchData.leagueName,
              leagueId: matchData.leagueId,
              status: 'SCHEDULED'
            }
          })
          created++
        }
      } catch (error) {
        console.error('Error processing fixture:', error)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors,
      total: fixtures.length
    })
  } catch (error) {
    console.error('Error syncing matches:', error)
    return NextResponse.json(
      { error: 'Failed to sync matches' },
      { status: 500 }
    )
  }
}

