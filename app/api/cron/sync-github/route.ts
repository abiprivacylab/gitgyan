import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ─── DAILY GITHUB SYNC ────────────────────────────────────────
//
// Route:    GET /api/cron/sync-github
// Schedule: 2am UTC daily (configured in vercel.json)
// Security: Protected by CRON_SECRET environment variable
//
// What this does every night:
//   1. Fetches top 100 repos per programming language
//   2. Fetches top 100 repos per AI topic
//   3. Upserts everything into Supabase repos table
//   4. Updates daily_stats with total counts
//
// To add a new language: add it to LANGUAGES array below
// To add a new AI topic: add it to AI_TOPICS array below
// ─────────────────────────────────────────────────────────────

// ── Programming languages to track ──────────────────────────
// Add any language here and it will be tracked from next sync
const LANGUAGES = [
  'Rust',
  'Python',
  'TypeScript',
  'JavaScript',
  'Go',
  'C++',
  'Swift',
  'Kotlin',
  'Java',
  'C',
  // Add more languages here anytime:
  // 'Ruby',
  // 'Zig',
  // 'Elixir',
  // 'Dart',
  // 'Solidity',
]

// ── AI / Hot topics to track ─────────────────────────────────
// These capture the AI wave regardless of language
// Stars threshold is lower (>5) to catch emerging projects early
const AI_TOPICS = [
  'topic:llm',
  'topic:claude',
  'topic:mcp',
  'topic:ai-agent',
  'topic:openai',
  'topic:langchain',
  'topic:rag',
  'topic:vibe-coding',
  'topic:cursor',
  'topic:ollama',
  'topic:anthropic',
  'topic:gemini',
  'topic:deepseek',
  // Add new hot topics here anytime:
  // 'topic:mcp-server',
  // 'topic:local-llm',
]

// ── Shared GitHub API headers ─────────────────────────────────
function githubHeaders(token: string | undefined) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

// ── Upsert a single repo into Supabase ───────────────────────
// Uses your actual schema column names
async function upsertRepo(repo: any): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('repos')
    .upsert({
      github_id:         repo.id,
      name:              repo.name,
      full_name:         repo.full_name,
      description:       repo.description,
      language:          repo.language,
      stars:             repo.stargazers_count,
      forks:             repo.forks_count,
      watchers:          repo.watchers_count,
      open_issues:       repo.open_issues_count,
      github_url:        repo.html_url,
      topics:            repo.topics || [],
      owner_login:       repo.owner?.login,
      github_created_at: repo.created_at,
      github_updated_at: repo.updated_at,
      fetch_status:      'complete',
      last_fetched_at:   new Date().toISOString(),
    }, {
      onConflict: 'github_id',
    })

  if (error) {
    console.error(`  ✗ ${repo.full_name}:`, error.message)
    return false
  }
  return true
}

// ── Fetch repos from GitHub and save to Supabase ─────────────
// Reusable for both language and topic queries
async function fetchAndSave(
  query: string,
  token: string | undefined,
  label: string
): Promise<{ synced: number; failed: number }> {
  let synced = 0
  let failed = 0

  try {
    console.log(`\nFetching ${label}...`)

    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100`,
      { headers: githubHeaders(token) }
    )

    if (!res.ok) {
      console.error(`  ✗ GitHub API error ${res.status} for: ${label}`)
      return { synced: 0, failed: 1 }
    }

    const data = await res.json()
    const repos = data.items || []
    console.log(`  Found ${repos.length} repos`)

    // Save each repo to Supabase
    for (const repo of repos) {
      const ok = await upsertRepo(repo)
      if (ok) synced++
      else failed++
    }

    console.log(`  ✓ ${synced} saved, ${failed} failed`)

  } catch (err: any) {
    console.error(`  ✗ ${label} crashed:`, err.message)
    failed++
  }

  // Rate limit: GitHub allows 30 search req/min
  // 2.5s delay keeps us well under the limit
  await new Promise(resolve => setTimeout(resolve, 1000))

  return { synced, failed }
}

// ─── MAIN HANDLER ─────────────────────────────────────────────
export async function GET(request: Request) {

  // ── Security: only Vercel cron can call this ──
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.GITHUB_TOKEN
  const today = new Date().toISOString().split('T')[0]

  // Look back 7 days for repos created in this window
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const fromDate = sevenDaysAgo.toISOString().split('T')[0]

  let totalSynced = 0
  let totalFailed = 0

  console.log(`\n🔭 GitGyan daily sync starting — ${today}`)
  console.log(`   Looking for repos created since: ${fromDate}`)

  // ── PHASE 1: Sync by programming language ────────────────
  // Each language gets its own API call fetching top 100 repos
  console.log(`\n── Phase 1: Languages (${LANGUAGES.length} languages × 100 repos) ──`)

  for (const language of LANGUAGES) {
    const query = `created:>=${fromDate} language:${language} stars:>10`
    const { synced, failed } = await fetchAndSave(query, token, `language:${language}`)
    totalSynced += synced
    totalFailed += failed
  }

  // ── PHASE 2: Sync by AI topic ─────────────────────────────
  // Lower star threshold (>5) to catch emerging AI projects early
  console.log(`\n── Phase 2: AI Topics (${AI_TOPICS.length} topics × 100 repos) ──`)

  for (const topic of AI_TOPICS) {
    const query = `created:>=${fromDate} ${topic} stars:>5`
    const { synced, failed } = await fetchAndSave(query, token, topic)
    totalSynced += synced
    totalFailed += failed
  }

  // ── PHASE 3: Update daily stats ───────────────────────────
  // Fetch overall GitHub stats for the dashboard counters
  console.log(`\n── Phase 3: Updating daily stats ──`)

  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const res = await fetch(
      `https://api.github.com/search/repositories?q=created:>=${yesterdayStr}+stars:>5&sort=stars&order=desc&per_page=1`,
      { headers: githubHeaders(token) }
    )

    if (res.ok) {
      const data = await res.json()

      await supabaseAdmin
        .from('daily_stats')
        .upsert({
          date:                today,
          total_repos_scanned: data.total_count,
          avg_stars_top15:     totalSynced > 0 ? totalSynced / LANGUAGES.length : 0,
        }, {
          onConflict: 'date',
        })

      console.log(`  ✓ Daily stats updated — ${data.total_count.toLocaleString()} total repos on GitHub today`)
    }
  } catch (err: any) {
    console.error('  ✗ Daily stats update failed:', err.message)
  }

  // ── PHASE 4: Viral detection on existing repos ───────────
  //
  // Smart approach — no external API needed for most of this:
  // 1. Pull all repos from OUR database created in last 1 year
  // 2. Fetch their CURRENT star count from GitHub
  // 3. Compare with stored star count
  // 4. If delta > threshold → repo is going viral → create alert
  // 5. Update stored star count with latest
  //
  // Why 1 year limit?
  // - Repos older than 1 year rarely go viral suddenly
  // - Keeps the check fast and API calls manageable
  // - You can adjust this window anytime
  //
  // Viral threshold: gained 3x their stored stars overnight
  // Example: stored=500, current=1800 → delta=1300 → VIRAL 🔥
  // ── PHASE 4: Temporarily moved to /api/cron/detect-viral ── 04/06/2026
  // Disabled here to avoid Vercel 5min timeout
  // Runs separately at 4am UTC via its own cron job
  
  const viralDetected = 0 // placeholder until detect-viral cron runs

  /*console.log(`\n── Phase 4: Viral detection on existing repos ──`)

  let viralDetected = 0

  try {
    // ── Step 1: Get all repos from our DB created in last 1 year ──
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0]

    const { data: existingRepos, error: fetchError } = await supabaseAdmin
      .from('repos')
      .select('github_id, full_name, github_url, stars, github_created_at')
      .gte('github_created_at', oneYearAgoStr)
      .order('stars', { ascending: false })

    if (fetchError) {
      console.error('  ✗ Could not fetch existing repos:', fetchError.message)
    } else {
      console.log(`  Checking ${existingRepos?.length ?? 0} repos created in last 1 year...`)

      // ── Step 2: Check in batches of 10 to avoid rate limits ──
      // GitHub doesn't have a bulk stars endpoint so we check
      // each repo individually but batch them to stay efficient
      const repos = existingRepos ?? []
      const BATCH_SIZE = 10

      for (let i = 0; i < repos.length; i += BATCH_SIZE) {
        const batch = repos.slice(i, i + BATCH_SIZE)

        await Promise.all(batch.map(async (repo) => {
          try {
            // ── Step 3: Fetch current star count from GitHub ──
            const res = await fetch(
              `https://api.github.com/repos/${repo.full_name}`,
              { headers: githubHeaders(token) }
            )

            if (!res.ok) return

            const data = await res.json()
            const currentStars: number = data.stargazers_count
            const storedStars: number  = repo.stars ?? 0
            const delta: number        = currentStars - storedStars

            // ── Step 4: Check if viral ──
            // Viral = gained more than 3x stored stars overnight
            // OR gained more than 500 absolute stars (established repos)
            const isViral =
              (storedStars > 0 && currentStars >= storedStars * 3) ||
              (delta >= 500)

            if (isViral) {
              console.log(`  🔥 VIRAL: ${repo.full_name} — ${storedStars} → ${currentStars} stars (+${delta})`)

              // Create viral alert (ignore if already exists today)
              await supabaseAdmin
                .from('viral_alerts')
                .upsert({
                  repo_id:    repo.github_id,
                  created_at: new Date().toISOString(),
                }, {
                  onConflict: 'repo_id', // one alert per repo per day
                  ignoreDuplicates: true,
                })

              viralDetected++
            }

            // ── Step 5: Update star count in our database ──
            // Keep our stored stars fresh regardless of viral status
            if (delta > 0) {
              await supabaseAdmin
                .from('repos')
                .update({
                  stars:           currentStars,
                  last_fetched_at: new Date().toISOString(),
                })
                .eq('github_id', repo.github_id)
            }

          } catch (err: any) {
            // Silent fail — don't let one repo crash the whole check
          }
        }))

        // Small delay between batches to respect GitHub rate limits
        // GitHub allows 5,000 requests/hour with a token
        // 10 repos per batch × delay = safe and steady
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      console.log(`  ✓ Viral check complete — ${viralDetected} viral repos detected`)
    }
  } catch (err: any) {
    console.error('  ✗ Phase 4 failed:', err.message)
  }*/ 

  // ── DONE ──────────────────────────────────────────────────
  console.log(`\n✅ GitGyan sync complete!`)
  console.log(`   ✓ Synced:  ${totalSynced} repos`)
  console.log(`   ✗ Failed:  ${totalFailed} repos`)
  //console.log(`   🔥 Viral:  ${viralDetected} repos detected`)  -- Removed Vercel 5 min
  console.log(`   📅 Date:   ${today}`)

  return NextResponse.json({
    success:  true,
    date:     today,
    synced:   totalSynced,
    failed:   totalFailed,
    //viral:    viralDetected,  -- Vercel 5 min timeout 04/06/2026
    languages: LANGUAGES.length,
    aiTopics:  AI_TOPICS.length,
    message:  `Synced ${totalSynced} repos across ${LANGUAGES.length} languages and ${AI_TOPICS.length} AI topics`,
  })
}