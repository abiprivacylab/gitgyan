import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ─── DAILY GITHUB SYNC ────────────────────────────────────────
// Runs once daily via Vercel Cron (see vercel.json)
// Schedule: 2am UTC every day
//
// Add to vercel.json:
// {
//   "crons": [
//     { "path": "/api/cron/sync-github", "schedule": "0 2 * * *" }
//   ]
// }
//
// Protected by CRON_SECRET env variable

const LANGUAGES = [
  'Rust', 'Python', 'TypeScript', 'JavaScript',
  'Go', 'C++', 'Swift', 'Kotlin', 'Java', 'C',
]

export async function GET(request: Request) {

  // ── Security check ──
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token  = process.env.GITHUB_TOKEN
  const today  = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const fromDate = sevenDaysAgo.toISOString().split('T')[0]

  let totalSynced = 0
  let totalFailed = 0

  console.log(`\n🔭 GitGyan daily sync — ${today}`)

  for (const language of LANGUAGES) {
    console.log(`\nFetching ${language}...`)

    try {
      // Search GitHub for trending repos in this language
      const q = `created:>=${fromDate} language:${language} stars:>10`
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=30`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      )

      if (!res.ok) {
        console.error(`GitHub API error for ${language}: ${res.status}`)
        totalFailed++
        continue
      }

      const data = await res.json()
      const repos = data.items || []
      console.log(`  Found ${repos.length} repos`)

      for (const repo of repos) {
        // ── Upsert repo using YOUR schema ──
        const { error } = await supabaseAdmin
          .from('repos')
          .upsert({
            github_id:          repo.id,
            name:               repo.name,
            full_name:          repo.full_name,
            description:        repo.description,
            language:           repo.language,
            stars:              repo.stargazers_count,
            forks:              repo.forks_count,
            watchers:           repo.watchers_count,
            open_issues:        repo.open_issues_count,
            github_url:         repo.html_url,
            topics:             repo.topics || [],
            owner_login:        repo.owner?.login,
            github_created_at:  repo.created_at,
            github_updated_at:  repo.updated_at,
            fetch_status:       'complete',
            last_fetched_at:    new Date().toISOString(),
          }, {
            onConflict: 'github_id',
          })

        if (error) {
          console.error(`  ✗ ${repo.full_name}:`, error.message)
          totalFailed++
        } else {
          totalSynced++
        }
      }

      // GitHub search API allows 30 req/min — stay safe
      await new Promise(resolve => setTimeout(resolve, 2500))

    } catch (err: any) {
      console.error(`  ✗ ${language} failed:`, err.message)
      totalFailed++
    }
  }

  // ── Also fetch general trending (no language filter) ──
  try {
    const fromDate1 = new Date()
    fromDate1.setDate(fromDate1.getDate() - 1)
    const yesterday = fromDate1.toISOString().split('T')[0]

    const res = await fetch(
      `https://api.github.com/search/repositories?q=created:>=${yesterday}+stars:>50&sort=stars&order=desc&per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (res.ok) {
      const data = await res.json()
      const repos = data.items || []

      // Update daily_stats with today's total
      await supabaseAdmin
        .from('daily_stats')
        .upsert({
          date:                  today,
          total_repos_scanned:   data.total_count,
          avg_stars_top15:       repos.slice(0, 15).reduce(
            (sum: number, r: any) => sum + r.stargazers_count, 0
          ) / Math.min(repos.length, 15),
        }, {
          onConflict: 'date',
        })

      console.log(`\n✓ Daily stats updated — ${data.total_count} total repos scanned`)
    }
  } catch (err: any) {
    console.error('Daily stats update failed:', err.message)
  }

  console.log(`\n✅ Sync complete — ${totalSynced} synced, ${totalFailed} failed`)

  return NextResponse.json({
    success: true,
    date:    today,
    synced:  totalSynced,
    failed:  totalFailed,
  })
}