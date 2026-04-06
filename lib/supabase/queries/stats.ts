import { supabase, supabaseAdmin } from '../../supabase'

// ─── TYPES ────────────────────────────────────────────────────

export type DashboardStats = {
  totalReposScanned: number
  highSignalReposToday: number
  aiSummariesGenerated: number
  viralAlertsToday: number
  reposCreatedToday: number
  lastUpdated: string
}

export type SignalScoreInput = {
  starsGained: number
  forksGained: number
  watchersCount: number
  issueActivity: number
  allTimeStars: number
  createdDaysAgo: number
}

// ─── SIGNAL SCORE CALCULATION ────────────────────────────────

/**
 * Calculates a 0–100 signal score for a repo
 *
 * Weights:
 *   40% — star velocity  (stars gained / repo age)
 *   30% — momentum       (today vs 7-day average)
 *   20% — adoption       (fork ratio)
 *   10% — community      (issue activity)
 */
export function calculateSignalScore(input: SignalScoreInput): number {
  const {
    starsGained, forksGained, watchersCount,
    issueActivity, allTimeStars, createdDaysAgo,
  } = input

  const safeStars = Math.max(allTimeStars, 1)
  const safeDays  = Math.max(createdDaysAgo, 1)

  // 1. Star velocity
  const starVelocity  = Math.min((starsGained / safeDays) * 10, 100)
  const velocityScore = starVelocity * 0.4

  // 2. Momentum — today vs historical average
  const historicalAvg = safeStars / safeDays
  const momentum      = historicalAvg > 0
    ? Math.min((starsGained / historicalAvg) * 20, 100) : 0
  const momentumScore = momentum * 0.3

  // 3. Adoption — fork ratio
  const forkRatio     = starsGained > 0
    ? Math.min((forksGained / starsGained) * 200, 100) : 0
  const adoptionScore = forkRatio * 0.2

  // 4. Community health
  const communityScore = Math.min(issueActivity * 5, 100) * 0.1

  return Math.min(Math.round(velocityScore + momentumScore + adoptionScore + communityScore), 100)
}

/**
 * Calculate velocity score (0–100)
 */
export function calculateVelocityScore(
  starsGainedToday: number,
  starsGainedLastWeek: number
): number {
  const weeklyAvg = starsGainedLastWeek / 7
  if (weeklyAvg === 0) return Math.min(starsGainedToday * 2, 100)
  return Math.min(Math.round((starsGainedToday / weeklyAvg) * 50), 100)
}

// ─── DASHBOARD STATS ─────────────────────────────────────────

/**
 * Fetch all live stats for hero strip and mockup
 */
export async function getDashboardStats(): Promise<{
  data: DashboardStats
  error: any
}> {
  const today = new Date().toISOString().split('T')[0]

  const [
    totalRepos,
    highSignalToday,
    aiSummaries,
    viralAlerts,
    reposCreated,
    lastUpdated,
  ] = await Promise.all([
    supabase.from('repos').select('id', { count: 'exact', head: true }),
    supabase.from('daily_stats').select('id', { count: 'exact', head: true })
      .eq('stat_date', today).gte('signal_score', 70),
    supabase.from('repos').select('id', { count: 'exact', head: true })
      .not('ai_summary', 'is', null),
    supabase.from('viral_alerts').select('id', { count: 'exact', head: true })
      .gte('created_at', today),
    supabase.from('repos').select('id', { count: 'exact', head: true })
      .gte('created_at', today),
    supabase.from('daily_stats').select('created_at')
      .order('created_at', { ascending: false }).limit(1).single(),
  ])

  return {
    data: {
      totalReposScanned:    totalRepos.count ?? 0,
      highSignalReposToday: highSignalToday.count ?? 0,
      aiSummariesGenerated: aiSummaries.count ?? 0,
      viralAlertsToday:     viralAlerts.count ?? 0,
      reposCreatedToday:    reposCreated.count ?? 0,
      lastUpdated:          lastUpdated.data?.created_at ?? new Date().toISOString(),
    },
    error: null,
  }
}

/**
 * Fetch trending history for a repo
 */
export async function getRepoTrendingHistory(repoId: number): Promise<{
  data: { date: string; rank: number; language: string }[]
  error: any
}> {
  const { data, error } = await supabase
    .from('trending_history')
    .select('trending_date, rank, language')
    .eq('repo_id', repoId)
    .order('trending_date', { ascending: false })
    .limit(30)

  if (error) return { data: [], error }
  return {
    data: (data ?? []).map(r => ({
      date: r.trending_date,
      rank: r.rank,
      language: r.language,
    })),
    error: null,
  }
}

/**
 * Write daily stats for a repo (called by cron)
 */
export async function upsertDailyStat({
  repoId, statDate, starsGained, forksGained,
  watchersCount, signalScore, velocityScore,
}: {
  repoId: number
  statDate: string
  starsGained: number
  forksGained: number
  watchersCount: number
  signalScore: number
  velocityScore: number
}): Promise<{ error: any }> {

  // Use supabaseAdmin for write operations
  const { error } = await supabaseAdmin
    .from('daily_stats')
    .upsert({
      repo_id:        repoId,
      stat_date:      statDate,
      stars_gained:   starsGained,
      forks_gained:   forksGained,
      watchers_count: watchersCount,
      signal_score:   signalScore,
      velocity_score: velocityScore,
    }, {
      onConflict: 'repo_id,stat_date',
    })

  return { error }
}
