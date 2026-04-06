import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// ─── READ FROM SUPABASE ───────────────────────────────────────
// This route now reads from Supabase instead of hitting GitHub
// GitHub sync happens separately via /api/cron/sync-github
// This makes page loads instant and doesn't burn API rate limits

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const language  = searchParams.get('language') || null
  const sortBy    = searchParams.get('sort') || 'stars'
  const limit     = parseInt(searchParams.get('limit') || '20')
  const offset    = parseInt(searchParams.get('offset') || '0')
  const minStars  = parseInt(searchParams.get('minStars') || '5')

  try {
    let query = supabase
      .from('repos')
      .select('*', { count: 'exact' })
      .eq('fetch_status', 'complete')
      .gte('stars', minStars)

    // Language filter
    if (language && language !== 'all') {
      query = query.eq('language', language)
    }

    // Sort
    const sortColumn = sortBy === 'stars' ? 'stars' : 'github_created_at'
    query = query.order(sortColumn, { ascending: false })

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: repos, count, error } = await query

    if (error) {
      console.error('Supabase error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get today's daily stats
    const today = new Date().toISOString().split('T')[0]
    const { data: stats } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('date', today)
      .single()

    // Map to the shape the frontend expects
    const mapped = (repos ?? []).map((r: any) => ({
      id:                r.github_id,
      name:              r.name,
      full_name:         r.full_name,
      description:       r.description,
      stargazers_count:  r.stars,
      forks_count:       r.forks,
      language:          r.language,
      html_url:          r.github_url,
      created_at:        r.github_created_at,
      updated_at:        r.github_updated_at,
      topics:            r.topics || [],
      owner: {
        login: r.owner_login,
      },
    }))

    return NextResponse.json({
      repos:   mapped,
      total:   stats?.total_repos_scanned ?? count ?? 0,
      count:   count ?? 0,
      date:    today,
      source:  'supabase', // flag so you know it's cached
    })

  } catch (err: any) {
    console.error('Repos route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}