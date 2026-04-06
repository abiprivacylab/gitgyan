import Anthropic from '@anthropic-ai/sdk'
import { supabase, supabaseAdmin } from '../../supabase'

// ─── CLIENT ──────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ─── TYPES ────────────────────────────────────────────────────

type RepoForSummary = {
  id: number
  full_name: string
  name: string
  description: string | null
  language: string | null
  stargazers_count: number
  topics: string[]
  readme_excerpt?: string | null
}

// ─── PROMPT ──────────────────────────────────────────────────

function buildPrompt(repo: RepoForSummary): string {
  return `You are GitGyan's AI analyst. Write a concise, developer-focused summary of this GitHub repository.

Repository: ${repo.full_name}
Language: ${repo.language ?? 'Unknown'}
Stars: ${repo.stargazers_count.toLocaleString()}
Description: ${repo.description ?? 'No description provided'}
Topics: ${repo.topics?.join(', ') || 'None'}
${repo.readme_excerpt ? `\nREADME excerpt:\n${repo.readme_excerpt.slice(0, 800)}` : ''}

Write 2-3 sentences that:
1. Explain what the project does in plain English
2. State WHY it matters or what problem it solves uniquely
3. Mention who should care

Rules:
- Be specific. Say "zero-allocation JSON parser" not "fast JSON library"
- Present tense, active voice
- No marketing language or emojis
- Max 60 words
- Output ONLY the summary text, nothing else`
}

// ─── GENERATE SUMMARY ────────────────────────────────────────

/**
 * Generate an AI summary for a single repo using Claude Haiku
 */
export async function generateRepoSummary(repo: RepoForSummary): Promise<{
  repoId: number
  summary: string
  tokensUsed: number
  error?: string
}> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: buildPrompt(repo) }],
    })

    const summary = message.content[0].type === 'text'
      ? message.content[0].text.trim() : ''

    const tokensUsed = message.usage.input_tokens + message.usage.output_tokens

    return { repoId: repo.id, summary, tokensUsed }
  } catch (err: any) {
    return { repoId: repo.id, summary: '', tokensUsed: 0, error: err.message }
  }
}

/**
 * Save summary to the repos table
 */
async function saveSummary(repoId: number, summary: string): Promise<void> {
  await supabaseAdmin
    .from('repos')
    .update({ ai_summary: summary })
    .eq('id', repoId)
}

// ─── BATCH PROCESSING ────────────────────────────────────────

/**
 * Process all repos without an AI summary
 * Called by the 3am daily cron
 */
export async function processPendingSummaries({
  limit = 100,
  batchSize = 10,
  delayMs = 2000,
}: {
  limit?: number
  batchSize?: number
  delayMs?: number
} = {}): Promise<{ processed: number; failed: number; totalTokens: number }> {

  const { data: repos, error } = await supabase
    .from('repos')
    .select(`
      id, full_name, name, description,
      language, stargazers_count, topics,
      daily_stats(signal_score)
    `)
    .is('ai_summary', null)
    .order('daily_stats.signal_score', { ascending: false })
    .limit(limit)

  if (error || !repos?.length) {
    console.log('No repos to process:', error?.message ?? 'none found')
    return { processed: 0, failed: 0, totalTokens: 0 }
  }

  let processed = 0, failed = 0, totalTokens = 0

  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(repo => generateRepoSummary(repo as RepoForSummary))
    )

    for (const result of results) {
      if (result.error || !result.summary) { failed++; continue }
      await saveSummary(result.repoId, result.summary)
      totalTokens += result.tokensUsed
      processed++
    }

    if (i + batchSize < repos.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  console.log(`✅ Summaries: ${processed} processed, ${failed} failed, ${totalTokens} tokens`)
  console.log(`💰 Est. cost: $${((totalTokens / 1_000_000) * 0.25).toFixed(4)}`)

  return { processed, failed, totalTokens }
}

// ─── ON-DEMAND (user clicks "✦ AI summary") ──────────────────

/**
 * Generate or return cached summary for a repo
 * Used by: /api/repos/[id]/summary
 */
export async function getSummaryOnDemand(repoId: number): Promise<{
  summary: string
  fromCache: boolean
  error?: string
}> {
  const { data: repo } = await supabase
    .from('repos')
    .select('id, full_name, name, description, language, stargazers_count, topics, ai_summary')
    .eq('id', repoId)
    .single()

  if (!repo) return { summary: '', fromCache: false, error: 'Repo not found' }

  // Return cached if available
  if (repo.ai_summary) return { summary: repo.ai_summary, fromCache: true }

  // Generate on the fly
  const result = await generateRepoSummary(repo as RepoForSummary)
  if (result.error || !result.summary) {
    return { summary: '', fromCache: false, error: result.error }
  }

  await saveSummary(repoId, result.summary)
  return { summary: result.summary, fromCache: false }
}
