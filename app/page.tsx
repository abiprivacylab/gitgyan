'use client'

import { useEffect, useState } from 'react'

interface Repo {
  id: number
  name: string
  full_name: string
  description: string
  stargazers_count: number
  language: string
  html_url: string
  created_at: string
  owner: {
    login: string
  }
  topics: string[]
}

interface AISummary {
  oneLiner: string
  whyItMatters: string
  whoShouldCare: string
  category: string
  cached: boolean
}

export default function Home() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    fetch('/api/repos')
      .then(res => res.json())
      .then(data => {
        setRepos(data.repos || [])
        setTotal(data.total)
        setLoading(false)
      })
  }, [])

  const handleRepoClick = async (repo: Repo) => {
    setSelectedRepo(repo)
    setAiSummary(null)
    setAiLoading(true)

    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: repo.id,
          repoName: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          topics: repo.topics || []
        })
      })
      const data = await res.json()
      setAiSummary(data)
    } catch (error) {
      console.error('AI summary error:', error)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">

      <div className="text-center py-12 px-8">
        <h1 className="text-5xl font-bold mb-4">🌌 GitHub Galaxy</h1>
        <p className="text-gray-400 text-xl">
          Find what matters in open source before everyone else does.
        </p>
        {!loading && (
          <p className="text-gray-600 text-sm mt-2">
            {total.toLocaleString()} repos created today — showing the {repos.length} that matter
          </p>
        )}
      </div>

      {loading && (
        <div className="text-center text-gray-500 py-20">
          Scanning the universe...
        </div>
      )}

      {!loading && (
        <div className="max-w-7xl mx-auto px-8 flex gap-8">

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <div
                key={repo.id}
                onClick={() => handleRepoClick(repo)}
                className={`bg-gray-900 border rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                  selectedRepo?.id === repo.id
                    ? 'border-indigo-500 bg-gray-800'
                    : 'border-gray-800 hover:border-indigo-500'
                }`}
              >
                {repo.language && (
                  <span className="text-xs font-mono bg-gray-800 text-indigo-400 px-2 py-1 rounded-full">
                    {repo.language}
                  </span>
                )}
                <h2 className="text-white font-bold text-lg mt-3 mb-1">
                  {repo.name}
                </h2>
                <p className="text-gray-500 text-xs font-mono mb-3">
                  by {repo.owner.login}
                </p>
                <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                  {repo.description || 'No description provided'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 text-sm font-mono">
                    ★ {repo.stargazers_count.toLocaleString()}
                  </span>
                  <span className="text-gray-600 text-xs">
                    Click for AI insight
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedRepo && (
            <div className="w-80 flex-shrink-0">
              <div className="bg-gray-900 border border-indigo-500 rounded-xl p-6 sticky top-8">

                <div className="mb-4">
                  <h3 className="text-white font-bold text-lg">
                    {selectedRepo.name}
                  </h3>
                  <p className="text-gray-500 text-xs font-mono">
                    by {selectedRepo.owner.login}
                  </p>
                </div>

                {aiLoading && (
                  <div className="text-indigo-400 text-sm font-mono animate-pulse">
                    Generating AI insight...
                  </div>
                )}

                {aiSummary && !aiLoading && (
                  <div className="space-y-4">

                    <span className="text-xs font-mono bg-indigo-900 text-indigo-300 px-2 py-1 rounded-full">
                      {aiSummary.category}
                    </span>

                    <div>
                      <p className="text-xs text-gray-500 font-mono mb-1">
                        ONE LINER
                      </p>
                      <p className="text-white font-bold text-sm leading-relaxed">
                        {aiSummary.oneLiner}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 font-mono mb-1">
                        WHY IT MATTERS
                      </p>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {aiSummary.whyItMatters}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 font-mono mb-1">
                        WHO SHOULD CARE
                      </p>
                      <p className="text-gray-400 text-sm">
                        {aiSummary.whoShouldCare}
                      </p>
                    </div>

                    {aiSummary.cached && (
                      <p className="text-xs text-gray-600 font-mono">
                        cached summary
                      </p>
                    )}

                    <button
                      onClick={() => window.open(selectedRepo.html_url, '_blank')}
                      className="w-full text-center bg-indigo-900 hover:bg-indigo-800 text-indigo-300 text-sm font-mono py-2 px-4 rounded-lg transition-colors mt-4 cursor-pointer"
                    >
                      View on GitHub
                    </button>

                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-center py-12 text-gray-700 text-xs font-mono">
        Built by @abiprivacylab · privacylab.tools
      </div>
    </main>
  )
}