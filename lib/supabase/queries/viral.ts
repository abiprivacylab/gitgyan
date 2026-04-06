import { supabase, supabaseAdmin } from '../../supabase'

// ─── TYPES ────────────────────────────────────────────────────

export type ViralAlertEnriched = {
  id: number
  repoId: number
  fullName: string
  name: string
  org: string
  description: string | null
  language: string | null
  stars: string
  aiSummary: string | null
  detectedAt: string
  detectedLabel: string
}

// ─── HELPERS ─────────────────────────────────────────────────

function formatStars(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── QUERIES ─────────────────────────────────────────────────

/**
 * Fetch all viral alerts from today
 */
export async function getViralAlerts({
  limit = 20,
  offset = 0,
}: {
  limit?: number
  offset?: number
} = {}): Promise<{ data: ViralAlertEnriched[]; count: number; error: any }> {

  const today = new Date().toISOString().split('T')[0]

  const { data, count, error } = await supabase
    .from('viral_alerts')
    .select(`
      id,
      repo_id,
      created_at,
      repos(
        full_name, name, description,
        language, stargazers_count, ai_summary
      )
    `, { count: 'exact' })
    .gte('created_at', today)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return { data: [], count: 0, error }

  return {
    data: (data ?? []).map((alert: any) => ({
      id:             alert.id,
      repoId:         alert.repo_id,
      fullName:       alert.repos.full_name,
      name:           alert.repos.name,
      org:            alert.repos.full_name.split('/')[0],
      description:    alert.repos.description,
      language:       alert.repos.language,
      stars:          formatStars(alert.repos.stargazers_count),
      aiSummary:      alert.repos.ai_summary,
      detectedAt:     alert.created_at,
      detectedLabel:  timeAgo(alert.created_at),
    })),
    count: count ?? 0,
    error: null,
  }
}

/**
 * Check if a specific repo has a viral alert today
 */
export async function isRepoViral(repoId: number): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  const { count } = await supabase
    .from('viral_alerts')
    .select('id', { count: 'exact', head: true })
    .eq('repo_id', repoId)
    .gte('created_at', today)
  return (count ?? 0) > 0
}

/**
 * Create a viral alert for a repo
 */
export async function createViralAlert(repoId: number): Promise<{ error: any }> {
  const alreadyViral = await isRepoViral(repoId)
  if (alreadyViral) return { error: null }

  const { error } = await supabaseAdmin
    .from('viral_alerts')
    .insert({ repo_id: repoId })

  return { error }
}

/**
 * Viral detection — call from daily cron
 * A repo is viral if today's stars >= 5x its 7-day average
 */
export async function detectAndCreateViralAlerts(): Promise<{
  detected: number
  error: any
}> {
  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: todayStats, error } = await supabase
    .from('daily_stats')
    .select('repo_id, stars_gained')
    .eq('stat_date', today)
    .gte('stars_gained', 50)

  if (error) return { detected: 0, error }

  let detected = 0

  for (const stat of (todayStats ?? [])) {
    const { data: history } = await supabase
      .from('daily_stats')
      .select('stars_gained')
      .eq('repo_id', stat.repo_id)
      .gte('stat_date', sevenDaysAgo.toISOString().split('T')[0])
      .lt('stat_date', today)

    const avg7d = history?.length
      ? history.reduce((sum, h) => sum + h.stars_gained, 0) / history.length
      : 0

    const isViral = avg7d > 0
      ? stat.stars_gained >= avg7d * 5
      : stat.stars_gained >= 500

    if (isViral) {
      const { error: alertError } = await createViralAlert(stat.repo_id)
      if (!alertError) detected++
    }
  }

  return { detected, error: null }
}
