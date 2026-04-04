import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { repoId, repoName, description, language, stars, topics } =
      await request.json()

    // Check if summary already exists
    const { data: existing } = await supabaseAdmin
      .from('repos')
      .select('ai_summary, ai_one_liner, ai_why_it_matters, ai_who_should_care, ai_category')
      .eq('github_id', repoId)
      .single()

    if (existing?.ai_summary) {
      return NextResponse.json({
        oneLiner: existing.ai_one_liner,
        whyItMatters: existing.ai_why_it_matters,
        whoShouldCare: existing.ai_who_should_care,
        category: existing.ai_category,
        cached: true
      })
    }

    // Generate new summary with Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Analyze this GitHub repository and respond with ONLY a JSON object, no markdown, no backticks, no explanation.

Repo name: ${repoName}
Description: ${description || 'No description'}
Language: ${language || 'Unknown'}
Stars: ${stars}
Topics: ${(topics || []).join(', ') || 'none'}

Return this exact JSON structure:
{"oneLiner":"one sentence max 15 words","whyItMatters":"2-3 sentences why this matters now","whoShouldCare":"specific developer audience","category":"AI Tool or DevOps or Frontend or Backend or CLI or Security or Data or Mobile or Other"}`
        }]
      })
    })

    if (!response.ok) {
      const errorBody = await response.json()
      console.error('Claude API error body:', errorBody)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const rawText = data.content?.[0]?.text || ''

    console.log('Claude raw response:', rawText)

    // Clean the response — remove any markdown if present
    const cleanText = rawText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    let parsed
    try {
      parsed = JSON.parse(cleanText)
    } catch (e) {
      console.error('JSON parse failed:', cleanText)
      // Fallback if JSON parsing fails
      parsed = {
        oneLiner: description || `${repoName} — new open source project`,
        whyItMatters: `${repoName} is a new repository gaining attention in the developer community.`,
        whoShouldCare: 'Developers interested in open source',
        category: 'Other'
      }
    }

    // Store in Supabase
    await supabaseAdmin
      .from('repos')
      .update({
        ai_summary: parsed.whyItMatters,
        ai_one_liner: parsed.oneLiner,
        ai_why_it_matters: parsed.whyItMatters,
        ai_who_should_care: parsed.whoShouldCare,
        ai_category: parsed.category,
        ai_processed: true,
        ai_summary_generated_at: new Date().toISOString()
      })
      .eq('github_id', repoId)

    return NextResponse.json({
      oneLiner: parsed.oneLiner,
      whyItMatters: parsed.whyItMatters,
      whoShouldCare: parsed.whoShouldCare,
      category: parsed.category,
      cached: false
    })

  } catch (error) {
    console.error('Summary error:', error)
    return NextResponse.json({
      oneLiner: 'An interesting new open source project',
      whyItMatters: 'This repository is gaining attention in the developer community.',
      whoShouldCare: 'Open source developers',
      category: 'Other',
      cached: false
    })
  }
}