import { supabase } from '../../supabase'

// ─── TYPES ────────────────────────────────────────────────────

export type LanguageCard = {
  name: string
  repoCount: number
  starsToday: number
  avgScore: number
  growthPercent: number
  aiSummaryCount: number
  sparkline: number[]
  topRepos: {
    name: string
    org: string
    stars: string
    score: number
  }[]
}

// ─── HELPERS ─────────────────────────────────────────────────

function formatStars(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

// ─── QUERIES ─────────────────────────────────────────────────

/**
 * Fetch all language trends for the Language Explorer grid
 */
export async function getLanguageTrends(
  sortBy: 'growth' | 'repos' | 'stars' | 'score' = 'growth'
): Promise<{ data: LanguageCard[]; error: any }> {

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: trends, error } = await supabase
    .from('language_trends')
    .select('*')
    .gte('trend_date', sevenDaysAgo.toISOString().split('T')[0])
    .order('trend_date', { ascending: true })

  if (error) return { data: [], error }

  // Group by language
  const grouped = new Map<string, any[]>()
  for (const row of (trends ?? [])) {
    if (!grouped.has(row.language)) grouped.set(row.language, [])
    grouped.get(row.language)!.push(row)
  }

  // Fetch top repos per language
  const languages = Array.from(grouped.keys())
  const topReposMap = await getTopReposPerLanguage(languages)

  // Build language cards
  const cards: LanguageCard[] = []

  for (const [lang, rows] of grouped.entries()) {
    const latest = rows[rows.length - 1]
    const oldest = rows[0]

    const growthPercent = oldest.repo_count > 0
      ? Math.round(((latest.repo_count - oldest.repo_count) / oldest.repo_count) * 100)
      : 0

    cards.push({
      name: lang,
      repoCount: latest.repo_count,
      starsToday: latest.total_stars,
      avgScore: Math.round(latest.avg_signal_score),
      growthPercent,
      aiSummaryCount: latest.ai_summary_count,
      sparkline: rows.map((r: any) => r.repo_count),
      topRepos: topReposMap[lang] ?? [],
    })
  }

  // Sort
  const sortFns: Record<string, (a: LanguageCard, b: LanguageCard) => number> = {
    growth: (a, b) => b.growthPercent - a.growthPercent,
    repos:  (a, b) => b.repoCount - a.repoCount,
    stars:  (a, b) => b.starsToday - a.starsToday,
    score:  (a, b) => b.avgScore - a.avgScore,
  }

  return { data: cards.sort(sortFns[sortBy]), error: null }
}

/**
 * Fetch top 3 repos per language for the card preview
 */
async function getTopReposPerLanguage(
  languages: string[]
): Promise<Record<string, LanguageCard['topRepos']>> {

  const result: Record<string, LanguageCard['topRepos']> = {}

  await Promise.all(
    languages.map(async (lang) => {
      const { data } = await supabase
        .from('repos')
        .select(`
          name,
          full_name,
          stargazers_count,
          daily_stats(signal_score)
        `)
        .eq('language', lang)
        .order('daily_stats.signal_score', { ascending: false })
        .limit(3)

      result[lang] = (data ?? []).map((r: any) => ({
        name: r.name,
        org: r.full_name.split('/')[0],
        stars: formatStars(r.stargazers_count),
        score: r.daily_stats?.[0]?.signal_score ?? 0,
      }))
    })
  )

  return result
}

/**
 * Fetch repos for a specific language (feed below the card)
 */
export async function getReposByLanguage(
  language: string,
  limit = 20,
  offset = 0
): Promise<{ data: any[]; count: number; error: any }> {

  const { data, count, error } = await supabase
    .from('repos')
    .select(`
      id, name, full_name, description,
      stargazers_count, language, created_at, ai_summary,
      daily_stats(signal_score, stars_gained, velocity_score, stat_date),
      viral_alerts(id)
    `, { count: 'exact' })
    .eq('language', language)
    .order('daily_stats.signal_score', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return { data: [], count: 0, error }

  return {
    data: (data ?? []).map((r: any, i: number) => ({
      rank: offset + i + 1,
      org: r.full_name.split('/')[0],
      name: r.name,
      fullName: r.full_name,
      desc: r.description,
      stars: formatStars(r.stargazers_count),
      starsToday: r.daily_stats?.[0]?.stars_gained ?? 0,
      score: r.daily_stats?.[0]?.signal_score ?? 0,
      hasAiSummary: !!r.ai_summary,
      isViral: (r.viral_alerts?.length ?? 0) > 0,
    })),
    count: count ?? 0,
    error: null,
  }
}

/**
 * Fetch the fastest growing language today (for hero stat)
 */
export async function getFastestGrowingLanguage(): Promise<string> {
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('language_trends')
    .select('language, growth_percent')
    .eq('trend_date', today)
    .order('growth_percent', { ascending: false })
    .limit(1)
    .single()

  return data?.language ?? 'Rust'
}
