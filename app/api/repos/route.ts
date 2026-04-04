import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const token = process.env.GITHUB_TOKEN

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateStr = today.toISOString().split('T')[0]

  const response = await fetch(
    `https://api.github.com/search/repositories?q=created:>=${dateStr}&sort=stars&order=desc&per_page=15`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  )

  const data = await response.json()
  const repos = data.items || []

  // Store each repo in Supabase
  for (const repo of repos) {
    const { error } = await supabaseAdmin
      .from('repos')
      .upsert({
        github_id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.watchers_count,
        open_issues: repo.open_issues_count,
        github_url: repo.html_url,
        topics: repo.topics,
        owner_login: repo.owner?.login,
        github_created_at: repo.created_at,
        github_updated_at: repo.updated_at,
        fetch_status: 'complete',
        last_fetched_at: new Date().toISOString(),
      }, {
        onConflict: 'github_id'
      })

    if (error) {
      console.error('Error storing repo:', repo.name, error.message)
    } else {
      console.log('Stored repo:', repo.name)
    }
  }

  // Update daily stats
  await supabaseAdmin
    .from('daily_stats')
    .upsert({
      date: dateStr,
      total_repos_scanned: data.total_count,
      avg_stars_top15: repos.reduce((sum: number, r: any) => 
        sum + r.stargazers_count, 0) / repos.length,
    }, {
      onConflict: 'date'
    })

  console.log(`✓ Stored ${repos.length} repos in Supabase`)

  return NextResponse.json({
    repos: repos,
    total: data.total_count,
    date: dateStr,
    stored: repos.length,
  })
}