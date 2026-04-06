import { supabase, supabaseAdmin } from '../../supabase'
import { calculateSignalScore, calculateVelocityScore, upsertDailyStat } from '../queries/stats'

// ─── TYPES ────────────────────────────────────────────────────

type GitHubRepo = {
  id: number
  full_name: string
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  watchers_count: number
  topics: string[]
  created_at: string
  updated_at: string
  homepage: string | null
  license: { key: string } | null
  owner: { login: string }
}

// ─── GITHUB API ───────────────────────────────────────────────

async function fetchGitHub(path: string): Promise<any> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${res.statusText}`)
  return res.json()
}

async function fetchTrendingRepos(language?: string): Promise<GitHubRepo[]> {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const dateStr = sevenDaysAgo.toISOString().split('T')[0]

  let q = `created:>${dateStr} stars:>50`
  if (language) q += ` language:${language}`

  const data = await fetchGitHub(
    `/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=100`
  )
  return data.items ?? []
}

// ─── UPSERT REPO ─────────────────────────────────────────────

async function upsertRepo(repo: GitHubRepo): Promise<number | null> {
  const { data, error } = await supabaseAdmin
    .from('repos')
    .upsert({
      id:                repo.id,
      full_name:         repo.full_name,
      name:              repo.name,
      owner:             repo.owner.login,
      description:       repo.description,
      language:          repo.language,
      stargazers_count:  repo.stargazers_count,
      forks_count:       repo.forks_count,
      topics:            repo.topics,
      homepage:          repo.homepage,
      license:           repo.license?.key ?? null,
      created_at:        repo.created_at,
      updated_at:        repo.updated_at,
    }, { onConflict: 'id' })
    .select('id')
    .single()

  if (error) { console.error(`Failed to upsert ${repo.full_name}:`, error.message); return null }
  return data?.id ?? null
}

async function saveSnapshot(repoId: number, repo: GitHubRepo, today: string): Promise<void> {
  await supabaseAdmin
    .from('repo_snapshots')
    .upsert({
      repo_id:       repoId,
      snapshot_date: today,
      stars:         repo.stargazers_count,
      forks:         repo.forks_count,
      watchers:      repo.watchers_count,
    }, { onConflict: 'repo_id,snapshot_date' })
}

// ─── LANGUAGE TRENDS ─────────────────────────────────────────

async function updateLanguageTrends(today: string, languages: string[]): Promise<void> {
  for (const language of languages) {
    const { data: stats } = await supabase
      .from('repos')
      .select('id, ai_summary, daily_stats!inner(stars_gained, signal_score, stat_date)')
      .eq('language', language)
      .eq('daily_stats.stat_date', today)

    if (!stats?.length) continue

    const repoCount  = stats.length
    const totalStars = stats.reduce((s, r: any) => s + (r.daily_stats[0]?.stars_gained ?? 0), 0)
    const avgScore   = stats.reduce((s, r: any) => s + (r.daily_stats[0]?.signal_score ?? 0), 0) / repoCount
    const aiCount    = stats.filter((r: any) => r.ai_summary).length

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const { data: prevDay } = await supabase
      .from('language_trends')
      .select('repo_count')
      .eq('language', language)
      .eq('trend_date', yesterday.toISOString().split('T')[0])
      .single()

    const growthPercent = prevDay?.repo_count
      ? Math.round(((repoCount - prevDay.repo_count) / prevDay.repo_count) * 100)
      : 0

    await supabaseAdmin
      .from('language_trends')
      .upsert({
        language,
        trend_date:        today,
        repo_count:        repoCount,
        total_stars:       totalStars,
        avg_signal_score:  Math.round(avgScore),
        growth_percent:    growthPercent,
        ai_summary_count:  aiCount,
      }, { onConflict: 'language,trend_date' })
  }
  console.log('✓ Language trends updated')
}

// ─── MAIN SYNC ────────────────────────────────────────────────

const TARGET_LANGUAGES = [
  'Rust', 'Python', 'TypeScript', 'Go', 'C++',
  'JavaScript', 'Swift', 'Kotlin', 'Java', 'C',
]

export async function runDailySync(): Promise<{ synced: number; failed: number }> {
  let synced = 0, failed = 0
  const today = new Date().toISOString().split('T')[0]
  console.log(`\n🔭 GitGyan daily sync — ${today}`)

  for (const language of TARGET_LANGUAGES) {
    console.log(`\nFetching ${language}...`)
    try {
      const repos = await fetchTrendingRepos(language)
      for (const repo of repos) {
        const repoId = await upsertRepo(repo)
        if (!repoId) { failed++; continue }

        // Get yesterday's snapshot for delta
        const { data: yesterday } = await supabase
          .from('repo_snapshots')
          .select('stars, forks')
          .eq('repo_id', repoId)
          .lt('snapshot_date', today)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .single()

        const starsGained = yesterday ? Math.max(repo.stargazers_count - yesterday.stars, 0) : 0
        const forksGained = yesterday ? Math.max(repo.forks_count - yesterday.forks, 0) : 0

        const createdDaysAgo = Math.floor(
          (Date.now() - new Date(repo.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )

        const signalScore   = calculateSignalScore({
          starsGained, forksGained,
          watchersCount: repo.watchers_count,
          issueActivity: 0,
          allTimeStars: repo.stargazers_count,
          createdDaysAgo,
        })
        const velocityScore = calculateVelocityScore(starsGained, starsGained * 7)

        await upsertDailyStat({ repoId, statDate: today, starsGained, forksGained, watchersCount: repo.watchers_count, signalScore, velocityScore })
        await saveSnapshot(repoId, repo, today)
        synced++
      }
    } catch (err: any) {
      console.error(`✗ ${language}:`, err.message)
      failed++
    }

    // GitHub allows 30 search req/min — stay safe
    await new Promise(resolve => setTimeout(resolve, 2500))
  }

  await updateLanguageTrends(today, TARGET_LANGUAGES)
  console.log(`\n✅ Done — ${synced} synced, ${failed} failed`)
  return { synced, failed }
}
