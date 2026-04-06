import { supabase } from '../../supabase'

// ─── TYPES ────────────────────────────────────────────────────

export type Repo = {
  id: number
  full_name: string
  name: string
  owner: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  created_at: string
  updated_at: string
  ai_summary: string | null
  topics: string[]
  homepage: string | null
  license: string | null
  daily_stats: DailyStat[]
  viral_alerts: { id: number }[]
}

export type DailyStat = {
  id: number
  repo_id: number
  stat_date: string
  stars_gained: number
  forks_gained: number
  signal_score: number
  velocity_score: number
  watchers_count: number
}

export type TrendingRepo = Repo & {
  starsToday: number
  signalScore: number
  velocityScore: number
  isViral: boolean
  isNew: boolean
  ageLabel: string
}

// ─── HELPERS ─────────────────────────────────────────────────

function getAgeLabel(createdAt: string): string {
  const days = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

function mapToTrendingRepo(repo: Repo): TrendingRepo {
  const stat = repo.daily_stats?.[0]
  const createdDaysAgo = Math.floor(
    (Date.now() - new Date(repo.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  return {
    ...repo,
    starsToday: stat?.stars_gained ?? 0,
    signalScore: stat?.signal_score ?? 0,
    velocityScore: stat?.velocity_score ?? 0,
    isViral: (repo.viral_alerts?.length ?? 0) > 0,
    isNew: createdDaysAgo <= 7,
    ageLabel: getAgeLabel(repo.created_at),
  }
}

// ─── QUERIES ─────────────────────────────────────────────────

/**
 * Fetch trending repos for the main feed
 */
export async function getTrendingRepos({
  limit = 20,
  offset = 0,
  language,
  minScore = 0,
  sortBy = 'signal_score',
  period = 'today',
}: {
  limit?: number
  offset?: number
  language?: string
  minScore?: number
  sortBy?: 'signal_score' | 'stars_gained' | 'velocity_score'
  period?: 'today' | 'week' | 'month'
} = {}): Promise<{ data: TrendingRepo[]; count: number; error: any }> {

  const fromDate = new Date()
  const daysBack = period === 'today' ? 0 : period === 'week' ? 7 : 30
  fromDate.setDate(fromDate.getDate() - daysBack)
  const fromDateStr = fromDate.toISOString().split('T')[0]

  let query = supabase
    .from('repos')
    .select(`
      *,
      daily_stats!inner(
        id, stat_date, stars_gained,
        forks_gained, signal_score,
        velocity_score, watchers_count
      ),
      viral_alerts(id)
    `, { count: 'exact' })
    .gte('daily_stats.stat_date', fromDateStr)
    .gte('daily_stats.signal_score', minScore)

  if (language && language !== 'all') {
    query = query.eq('language', language)
  }

  const sortColumn =
    sortBy === 'signal_score' ? 'daily_stats.signal_score' :
    sortBy === 'stars_gained' ? 'daily_stats.stars_gained' :
    'daily_stats.velocity_score'

  query = query
    .order(sortColumn, { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, count, error } = await query
  if (error) return { data: [], count: 0, error }

  return {
    data: (data as Repo[]).map(mapToTrendingRepo),
    count: count ?? 0,
    error: null,
  }
}

/**
 * Fetch a single repo by full_name e.g. "rustfs/cloudmount"
 */
export async function getRepoByFullName(
  fullName: string
): Promise<{ data: TrendingRepo | null; error: any }> {

  const { data, error } = await supabase
    .from('repos')
    .select(`
      *,
      daily_stats(
        id, stat_date, stars_gained,
        forks_gained, signal_score,
        velocity_score, watchers_count
      ),
      viral_alerts(id)
    `)
    .eq('full_name', fullName)
    .order('daily_stats.stat_date', { ascending: false })
    .single()

  if (error) return { data: null, error }
  return { data: mapToTrendingRepo(data as Repo), error: null }
}

/**
 * Fetch repo star history for sparkline charts
 */
export async function getRepoStarHistory(
  repoId: number,
  days = 30
): Promise<{ data: { date: string; stars: number; gained: number }[]; error: any }> {

  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)

  const { data, error } = await supabase
    .from('repo_snapshots')
    .select('snapshot_date, stars, forks')
    .eq('repo_id', repoId)
    .gte('snapshot_date', fromDate.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true })

  if (error) return { data: [], error }

  const history = (data ?? []).map((row, i) => ({
    date: row.snapshot_date,
    stars: row.stars,
    gained: i === 0 ? 0 : row.stars - ((data[i - 1] as any)?.stars ?? row.stars),
  }))

  return { data: history, error: null }
}

/**
 * Fetch related repos by language
 */
export async function getRelatedRepos(
  repoId: number,
  language: string,
  limit = 5
): Promise<{ data: TrendingRepo[]; error: any }> {

  const { data, error } = await supabase
    .from('repos')
    .select(`
      *,
      daily_stats(signal_score, stars_gained, velocity_score, stat_date),
      viral_alerts(id)
    `)
    .neq('id', repoId)
    .eq('language', language)
    .order('daily_stats.signal_score', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error }
  return { data: (data as Repo[]).map(mapToTrendingRepo), error: null }
}

/**
 * Search repos by name, description, or topic
 */
export async function searchRepos(
  query: string,
  limit = 20
): Promise<{ data: TrendingRepo[]; error: any }> {

  const { data, error } = await supabase
    .from('repos')
    .select(`
      *,
      daily_stats(signal_score, stars_gained, velocity_score, stat_date),
      viral_alerts(id)
    `)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,full_name.ilike.%${query}%`)
    .order('daily_stats.signal_score', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error }
  return { data: (data as Repo[]).map(mapToTrendingRepo), error: null }
}
