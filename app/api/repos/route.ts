import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// ─── READ FROM SUPABASE ───────────────────────────────────────
// This route now reads from Supabase instead of hitting GitHub
// GitHub sync happens separately via /api/cron/sync-github
// This makes page loads instant and doesn't burn API rate limits

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const language  = searchParams.get('language') || null
  const sortBy    = searchParams.get('sort') || 'thisWeek'  // ← default changed
  const limit     = parseInt(searchParams.get('limit') || '20')
  const offset    = parseInt(searchParams.get('offset') || '0')
  const minStars  = parseInt(searchParams.get('minStars') || '10') // ← raised from 5

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

    // ── Sort logic ──────────────────────────────────────────
    if (sortBy === 'thisWeek') {
      // Repos created in last 7 days, sorted by stars
      // This shows what's gaining momentum RIGHT NOW
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      query = query
        .gte('github_created_at', sevenDaysAgo.toISOString())
        .order('stars', { ascending: false })

    } else if (sortBy === 'stars') {
      // All-time stars — claw-code territory
      query = query.order('stars', { ascending: false })

    } else if (sortBy === 'new') {
      // Newest repos first
      query = query.order('github_created_at', { ascending: false })
    }

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

    // Get total repos in our database
    const { count: totalInDb } = await supabase
      .from('repos')
      .select('*', { count: 'exact', head: true })
      .eq('fetch_status', 'complete')

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
      total:   totalInDb ?? 0,
      count:   count ?? 0,
      date:    today,
      source:  'supabase',
      sortBy:  sortBy, // useful for debugging
    })

  } catch (err: any) {
    console.error('Repos route error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}