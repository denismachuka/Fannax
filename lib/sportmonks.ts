// SportMonks API Client for Fannax

const SPORTMONKS_API_KEY = process.env.SPORTMONKS_API_KEY
const SPORTMONKS_BASE_URL = process.env.SPORTMONKS_BASE_URL || 'https://api.sportmonks.com/v3/football'

interface SportMonksResponse<T> {
  data: T
  pagination?: {
    count: number
    per_page: number
    current_page: number
    next_page: string | null
    has_more: boolean
  }
}

export interface SportMonksTeam {
  id: number
  name: string
  short_code: string | null
  image_path: string | null
  country_id: number | null
}

export interface SportMonksPlayer {
  id: number
  name: string
  display_name: string
  nationality_id: number | null
  position_id: number | null
  image_path: string | null
}

export interface SportMonksFixture {
  id: number
  name: string
  starting_at: string
  result_info: string | null
  leg: string
  venue_id: number | null
  league_id: number
  season_id: number
  stage_id: number
  state_id: number
  participants: {
    id: number
    name: string
    short_code: string
    image_path: string
    meta: {
      location: 'home' | 'away'
    }
  }[]
  scores?: {
    participant_id: number
    score: {
      goals: number
      participant: 'home' | 'away'
    }
  }[]
  venue?: {
    id: number
    name: string
    city_name: string
  }
  league?: {
    id: number
    name: string
  }
}

class SportMonksClient {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = SPORTMONKS_API_KEY || ''
    this.baseUrl = SPORTMONKS_BASE_URL
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<SportMonksResponse<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    url.searchParams.append('api_token', this.apiKey)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json'
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) {
      throw new Error(`SportMonks API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Get all teams (paginated)
  async getTeams(page: number = 1, perPage: number = 100): Promise<SportMonksResponse<SportMonksTeam[]>> {
    return this.fetch<SportMonksTeam[]>('/teams', {
      page: page.toString(),
      per_page: perPage.toString(),
      include: 'country'
    })
  }

  // Get team by ID
  async getTeam(teamId: number): Promise<SportMonksResponse<SportMonksTeam>> {
    return this.fetch<SportMonksTeam>(`/teams/${teamId}`)
  }

  // Search teams by name
  async searchTeams(name: string): Promise<SportMonksResponse<SportMonksTeam[]>> {
    return this.fetch<SportMonksTeam[]>('/teams/search/' + encodeURIComponent(name))
  }

  // Get all players (paginated)
  async getPlayers(page: number = 1, perPage: number = 100): Promise<SportMonksResponse<SportMonksPlayer[]>> {
    return this.fetch<SportMonksPlayer[]>('/players', {
      page: page.toString(),
      per_page: perPage.toString()
    })
  }

  // Search players by name
  async searchPlayers(name: string): Promise<SportMonksResponse<SportMonksPlayer[]>> {
    return this.fetch<SportMonksPlayer[]>('/players/search/' + encodeURIComponent(name))
  }

  // Get upcoming fixtures
  async getUpcomingFixtures(days: number = 7): Promise<SportMonksResponse<SportMonksFixture[]>> {
    const startDate = new Date().toISOString().split('T')[0]
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    return this.fetch<SportMonksFixture[]>('/fixtures/between/' + startDate + '/' + endDate, {
      include: 'participants;venue;league;scores'
    })
  }

  // Get fixtures by date range
  async getFixturesByDateRange(startDate: string, endDate: string): Promise<SportMonksResponse<SportMonksFixture[]>> {
    return this.fetch<SportMonksFixture[]>('/fixtures/between/' + startDate + '/' + endDate, {
      include: 'participants;venue;league;scores'
    })
  }

  // Get fixture by ID
  async getFixture(fixtureId: number): Promise<SportMonksResponse<SportMonksFixture>> {
    return this.fetch<SportMonksFixture>(`/fixtures/${fixtureId}`, {
      include: 'participants;venue;league;scores'
    })
  }

  // Get live fixtures
  async getLiveFixtures(): Promise<SportMonksResponse<SportMonksFixture[]>> {
    return this.fetch<SportMonksFixture[]>('/livescores/inplay', {
      include: 'participants;venue;league;scores'
    })
  }

  // Get finished fixtures (for scoring)
  async getFinishedFixtures(fixtureIds: number[]): Promise<SportMonksResponse<SportMonksFixture[]>> {
    return this.fetch<SportMonksFixture[]>('/fixtures/multi/' + fixtureIds.join(','), {
      include: 'participants;scores'
    })
  }

  // Get all leagues
  async getLeagues(): Promise<SportMonksResponse<{ id: number; name: string; image_path: string }[]>> {
    return this.fetch('/leagues', {
      include: 'country'
    })
  }

  // Get fixtures by league
  async getFixturesByLeague(leagueId: number, page: number = 1): Promise<SportMonksResponse<SportMonksFixture[]>> {
    return this.fetch<SportMonksFixture[]>(`/fixtures`, {
      'filters[league_id]': leagueId.toString(),
      page: page.toString(),
      include: 'participants;venue;scores'
    })
  }
}

export const sportmonks = new SportMonksClient()

// Helper to parse fixture into match data
export function parseFixtureToMatch(fixture: SportMonksFixture) {
  const homeTeam = fixture.participants?.find(p => p.meta.location === 'home')
  const awayTeam = fixture.participants?.find(p => p.meta.location === 'away')
  
  let homeScore: number | null = null
  let awayScore: number | null = null
  
  if (fixture.scores) {
    const homeScoreData = fixture.scores.find(s => s.score.participant === 'home')
    const awayScoreData = fixture.scores.find(s => s.score.participant === 'away')
    homeScore = homeScoreData?.score.goals ?? null
    awayScore = awayScoreData?.score.goals ?? null
  }

  return {
    sportmonksId: fixture.id,
    homeTeam: homeTeam ? {
      sportmonksId: homeTeam.id,
      name: homeTeam.name,
      shortCode: homeTeam.short_code,
      logoUrl: homeTeam.image_path
    } : null,
    awayTeam: awayTeam ? {
      sportmonksId: awayTeam.id,
      name: awayTeam.name,
      shortCode: awayTeam.short_code,
      logoUrl: awayTeam.image_path
    } : null,
    homeScore,
    awayScore,
    venue: fixture.venue?.name || null,
    leagueName: fixture.league?.name || null,
    leagueId: fixture.league_id,
    scheduledAt: new Date(fixture.starting_at),
    isLive: fixture.state_id === 3, // Live state
    isFinished: fixture.state_id === 5 // Finished state
  }
}

