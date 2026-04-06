'use client'

import { useEffect, useState, useRef } from 'react'

// ─── TYPES ────────────────────────────────────────────────────

interface Repo {
  id: number
  name: string
  full_name: string
  description: string
  stargazers_count: number
  language: string
  html_url: string
  created_at: string
  owner: { login: string }
  topics: string[]
}

interface AISummary {
  oneLiner: string
  whyItMatters: string
  whoShouldCare: string
  category: string
  cached: boolean
}

// ─── LANGUAGE COLORS ─────────────────────────────────────────

const langColors: Record<string, string> = {
  Rust: '#f74c00', Python: '#3572a5', TypeScript: '#3178c6',
  JavaScript: '#f1e05a', Go: '#00add8', 'C++': '#f34b7d',
  C: '#555555', Swift: '#f05138', Kotlin: '#7f52ff',
  Java: '#b07219', Ruby: '#701516', CSS: '#563d7c',
}

// ─── LOGO SVG ────────────────────────────────────────────────

function GitGyanLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="lb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d1a3d" />
          <stop offset="100%" stopColor="#1a0848" />
        </linearGradient>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7ec8ff" />
          <stop offset="40%" stopColor="#5b9eff" />
          <stop offset="100%" stopColor="#9175ff" />
        </linearGradient>
        <linearGradient id="lr" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5b9eff" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#a8d4ff" />
          <stop offset="100%" stopColor="#9175ff" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id="lg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5b9eff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#5b9eff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#lb)" stroke="#1a2650" strokeWidth="0.8" />
      <circle cx="18" cy="18" r="12" fill="url(#lg2)" />
      <circle cx="6" cy="14" r="0.7" fill="#fff" opacity="0.5" />
      <circle cx="30" cy="13" r="0.6" fill="#fff" opacity="0.45" />
      <circle cx="5" cy="23" r="0.6" fill="#fff" opacity="0.4" />
      <circle cx="31" cy="24" r="0.7" fill="#fff" opacity="0.4" />
      <path d="M9,9 C9,9 9.4,10.4 9,11.8 C8.6,10.4 9,9 9,9Z" fill="#a8c8ff" opacity="0.75" />
      <path d="M7.2,10.4 C7.2,10.4 9,10.8 10.8,10.4 C9,10 7.2,10.4 7.2,10.4Z" fill="#a8c8ff" opacity="0.75" />
      <path d="M27,8 C27,8 27.4,9.2 27,10.4 C26.6,9.2 27,8 27,8Z" fill="#c4b5fd" opacity="0.7" />
      <path d="M25.4,9.2 C25.4,9.2 27,9.6 28.6,9.2 C27,8.8 25.4,9.2 25.4,9.2Z" fill="#c4b5fd" opacity="0.7" />
      <ellipse cx="18" cy="19.5" rx="20" ry="5.5" fill="none" stroke="url(#lr)" strokeWidth="1.4" transform="rotate(-18 18 19.5)" />
      <ellipse cx="18" cy="19.5" rx="20" ry="5.5" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.45" strokeDasharray="14 48" strokeDashoffset="6" transform="rotate(-18 18 19.5)" />
      <circle cx="37" cy="17" r="1.8" fill="#a8c8ff" opacity="0.85" />
      <circle cx="0" cy="22" r="1.4" fill="#9175ff" opacity="0.75" />
      <text x="18" y="24" fontFamily="'DM Sans',sans-serif" fontSize="11" fontWeight="600" fill="url(#lg)" textAnchor="middle" letterSpacing="-0.5">GG</text>
    </svg>
  )
}

// ─── STARFIELD ────────────────────────────────────────────────

function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let stars: { x: number; y: number; r: number; a: number; da: number }[] = []
    let animId: number

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
      stars = Array.from({ length: 140 }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        r: Math.random() * 1.1 + 0.2,
        a: Math.random() * 0.5 + 0.1,
        da: (Math.random() - 0.5) * 0.003,
      }))
    }

    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)
      for (const s of stars) {
        s.a += s.da
        if (s.a < 0.05 || s.a > 0.6) s.da *= -1
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180,210,255,${s.a})`
        ctx.fill()
      }
      animId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
}

// ─── HELPERS ─────────────────────────────────────────────────

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function timeAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

// ─── MAIN PAGE ────────────────────────────────────────────────

export default function Home() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'stars' | 'new'>('stars')

  // ── Fetch repos (existing API — unchanged) ──
  useEffect(() => {
    fetch('/api/repos')
      .then(res => res.json())
      .then(data => {
        setRepos(data.repos || [])
        setTotal(data.total)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // ── Handle repo click + AI summary (existing API — unchanged) ──
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
          topics: repo.topics || [],
        }),
      })
      setAiSummary(await res.json())
    } catch (e) {
      console.error('AI summary error:', e)
    } finally {
      setAiLoading(false)
    }
  }

  // ── Filter + sort ──
  const filtered = repos
    .filter(r =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.language?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sortBy === 'stars'
        ? b.stargazers_count - a.stargazers_count
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

  return (
    <div className="relative min-h-screen font-[family-name:var(--font-sans)]">
      <Starfield />

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center px-8 h-[60px] bg-[rgba(6,8,15,0.85)] backdrop-blur-xl border-b border-white/10">
        <a href="/" className="flex items-center gap-2.5 no-underline">
          <GitGyanLogo size={34} />
          <span className="font-[family-name:var(--font-serif)] text-[19px] text-white tracking-[-0.3px]">
            GitGyan
          </span>
        </a>
        <div className="flex gap-1 ml-8">
          {['Trending', 'Languages', 'Topics', 'Insights'].map(link => (
            <a key={link} href="#"
              className="text-[13px] text-white/50 no-underline px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-all">
              {link}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a href="https://github.com/abiprivacylab/gitgyan" target="_blank"
            className="flex items-center gap-1.5 text-[13px] text-white/50 px-4 py-2 rounded-[9px] border border-white/20 hover:text-white hover:border-white/30 transition-all no-underline">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Star on GitHub
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-[100px] pb-12 px-8 max-w-[1200px] mx-auto">
        <div className="inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-[11px] text-[#5b9eff] tracking-[0.12em] uppercase px-3 py-1.5 border border-[rgba(79,142,247,0.3)] rounded-full bg-[rgba(79,142,247,0.08)] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5b9eff] animate-pulse" />
          AI-Powered GitHub Discovery
        </div>

        <h1 className="font-[family-name:var(--font-serif)] text-[clamp(40px,5vw,64px)] leading-[1.08] tracking-[-1px] mb-5"
          style={{ background: 'linear-gradient(160deg,#fff 50%,rgba(180,205,255,0.8) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Where Developers<br />
          <em className="not-italic"
            style={{ background: 'linear-gradient(135deg,#5b9eff,#9175ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Find Wisdom.
          </em>
        </h1>

        <p className="text-[17px] text-white/60 leading-[1.7] max-w-[480px] mb-8">
          GitGyan scans GitHub daily, finds high-signal repos, and analyzes them with AI —
          ranked before they go viral.
        </p>

        {/* Stats strip */}
        {!loading && (
          <div className="flex gap-3 flex-wrap mb-8">
            {[
              { dot: '#4ade9e', val: repos.length, label: 'high-signal repos today' },
              { dot: '#fcd34d', val: total.toLocaleString(), label: 'repos scanned' },
              { dot: '#a78bfa', val: repos.filter(r => r.topics?.length > 0).length, label: 'AI summaries ready' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#0c1120] border border-white/10 rounded-lg px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                <span className="text-white font-medium">{s.val}</span>
                <span className="text-white/35">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Search + sort */}
        <div className="flex gap-3 items-center flex-wrap mb-8">
          <div className="relative flex-1 min-w-[240px] max-w-[440px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="9" r="6" /><path d="M15 15l3 3" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search repos, topics, or languages…"
              className="w-full bg-[#0c1120] border border-white/10 rounded-[10px] py-2.5 pl-10 pr-4 text-[14px] text-white placeholder-white/30 outline-none focus:border-[rgba(91,158,255,0.4)] transition-colors"
            />
          </div>
          <div className="flex gap-1.5">
            {[['stars', '★ Stars'], ['new', '✦ Newest']].map(([val, label]) => (
              <button key={val}
                onClick={() => setSortBy(val as 'stars' | 'new')}
                className={`font-[family-name:var(--font-mono)] text-[11px] px-3 py-2 rounded-full border transition-all ${sortBy === val ? 'bg-[rgba(91,158,255,0.12)] border-[rgba(91,158,255,0.4)] text-[#5b9eff]' : 'border-white/10 text-white/40 hover:text-white hover:border-white/20'}`}>
                {label}
              </button>
            ))}
          </div>
          <span className="font-[family-name:var(--font-mono)] text-[11px] text-white/30 ml-auto">
            {filtered.length} repos
          </span>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="relative z-10 px-8 pb-20 max-w-[1200px] mx-auto">

        {loading && (
          <div className="text-center text-white/30 font-[family-name:var(--font-mono)] text-[13px] py-20 animate-pulse">
            ✦ Scanning the universe…
          </div>
        )}

        {!loading && (
          <div className="flex gap-6 items-start">

            {/* ── REPO LIST ── */}
            <div className="flex-1 flex flex-col">
              {filtered.map((repo, i) => {
                const color = langColors[repo.language] ?? '#5b9eff'
                const isSelected = selectedRepo?.id === repo.id
                return (
                  <div key={repo.id}
                    onClick={() => handleRepoClick(repo)}
                    className={`flex items-start gap-4 px-5 py-4 border-b cursor-pointer transition-all ${
                      i === 0 ? 'rounded-t-[14px] border border-b-0' : ''
                    } ${
                      i === filtered.length - 1 ? 'rounded-b-[14px] border-t-0 border' : 'border-x'
                    } ${
                      isSelected
                        ? 'bg-[#111827] border-[rgba(91,158,255,0.25)] border-l-[3px] border-l-[#5b9eff]'
                        : 'bg-[#0c1120] border-white/10 border-l-[3px] border-l-transparent hover:bg-[#111827] hover:border-l-[#5b9eff]'
                    }`}
                    style={{ position: 'relative', zIndex: isSelected ? 1 : 0 }}
                  >
                    {/* Rank */}
                    <div className="font-[family-name:var(--font-mono)] text-[16px] text-white/12 min-w-[32px] pt-0.5">
                      {String(i + 1).padStart(2, '0')}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[15px] font-semibold text-white/50">{repo.owner.login} /</span>
                        <span className="text-[15px] font-semibold text-white">{repo.name}</span>
                        {/* Badges */}
                        {repo.topics?.length > 0 && (
                          <span className="font-[family-name:var(--font-mono)] text-[10px] px-2 py-0.5 rounded-full border text-[#a78bfa] border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.08)]">
                            ✦ AI ready
                          </span>
                        )}
                        {(() => {
                          const days = Math.floor((Date.now() - new Date(repo.created_at).getTime()) / 86400000)
                          return days <= 7 ? (
                            <span className="font-[family-name:var(--font-mono)] text-[10px] px-2 py-0.5 rounded-full border text-[#4ade9e] border-[rgba(74,222,158,0.3)] bg-[rgba(74,222,158,0.08)]">
                              ✦ new
                            </span>
                          ) : null
                        })()}
                      </div>

                      <p className="text-[13px] text-white/50 leading-[1.5] mb-2 line-clamp-1">
                        {repo.description || 'No description provided'}
                      </p>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-[family-name:var(--font-mono)] text-[12px] text-white/50">
                          ★ {formatStars(repo.stargazers_count)}
                        </span>
                        {repo.language && (
                          <span className="flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[12px] text-white/50">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                            {repo.language}
                          </span>
                        )}
                        <span className="font-[family-name:var(--font-mono)] text-[11px] text-white/30">
                          · {timeAgo(repo.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className={`text-[18px] mt-1 transition-colors flex-shrink-0 ${isSelected ? 'text-[#5b9eff]' : 'text-white/15'}`}>
                      {isSelected ? '✦' : '›'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── AI SUMMARY PANEL ── */}
            {selectedRepo && (
              <div className="w-[300px] flex-shrink-0 sticky top-[80px]">
                <div className="bg-[#0c1120] border border-[rgba(91,158,255,0.25)] rounded-[14px] p-5">

                  {/* Header */}
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/08">
                    <div className="w-[22px] h-[22px] rounded-[6px] bg-[rgba(167,139,250,0.15)] flex items-center justify-center text-[11px]">✦</div>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#a78bfa] tracking-[0.06em]">AI SUMMARY · CLAUDE HAIKU</span>
                  </div>

                  <h3 className="text-white font-semibold text-[14px] mb-0.5">{selectedRepo.name}</h3>
                  <p className="font-[family-name:var(--font-mono)] text-[11px] text-white/40 mb-4">
                    by {selectedRepo.owner.login}
                  </p>

                  {aiLoading && (
                    <div className="font-[family-name:var(--font-mono)] text-[12px] text-[#5b9eff] animate-pulse">
                      Generating summary…
                    </div>
                  )}

                  {aiSummary && !aiLoading && (
                    <div className="space-y-4">
                      {aiSummary.category && (
                        <span className="inline-block font-[family-name:var(--font-mono)] text-[10px] bg-[rgba(79,142,247,0.1)] text-[#5b9eff] border border-[rgba(79,142,247,0.2)] px-2 py-0.5 rounded-full">
                          {aiSummary.category}
                        </span>
                      )}

                      <div>
                        <p className="font-[family-name:var(--font-mono)] text-[9px] text-white/30 tracking-[0.12em] mb-1.5">ONE LINER</p>
                        <p className="text-white font-semibold text-[13px] leading-[1.5] border-l-2 border-[rgba(167,139,250,0.4)] pl-3 italic">
                          {aiSummary.oneLiner}
                        </p>
                      </div>

                      <div>
                        <p className="font-[family-name:var(--font-mono)] text-[9px] text-white/30 tracking-[0.12em] mb-1.5">WHY IT MATTERS</p>
                        <p className="text-white/65 text-[12px] leading-[1.6]">{aiSummary.whyItMatters}</p>
                      </div>

                      <div>
                        <p className="font-[family-name:var(--font-mono)] text-[9px] text-white/30 tracking-[0.12em] mb-1.5">WHO SHOULD CARE</p>
                        <p className="text-white/50 text-[12px] leading-[1.6]">{aiSummary.whoShouldCare}</p>
                      </div>

                      {aiSummary.cached && (
                        <p className="font-[family-name:var(--font-mono)] text-[10px] text-white/20">· cached summary</p>
                      )}

                      <button
                        onClick={() => window.open(selectedRepo.html_url, '_blank')}
                        className="w-full text-center bg-[rgba(91,158,255,0.1)] hover:bg-[rgba(91,158,255,0.18)] text-[#5b9eff] text-[12px] font-[family-name:var(--font-mono)] py-2.5 px-4 rounded-[9px] border border-[rgba(91,158,255,0.2)] transition-all cursor-pointer mt-2">
                        View on GitHub →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/08 py-8 px-8">
        <div className="max-w-[1200px] mx-auto flex items-center gap-4 flex-wrap">
          <a href="/" className="flex items-center gap-2 no-underline">
            <GitGyanLogo size={22} />
            <span className="font-[family-name:var(--font-serif)] text-[16px] text-white">GitGyan</span>
          </a>
          <div className="flex gap-1 ml-auto">
            {['About', 'Contact', 'Privacy', 'Terms'].map(l => (
              <a key={l} href="#" className="text-[13px] text-white/35 no-underline px-3 py-1 rounded-md hover:text-white/70 transition-colors">
                {l}
              </a>
            ))}
          </div>
          <p className="text-[12px] text-white/25 font-[family-name:var(--font-mono)] ml-4">
            © 2026 GitGyan — Where Developers Find Wisdom
          </p>
        </div>
      </footer>
    </div>
  )
}
