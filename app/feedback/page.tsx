'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── TYPES ────────────────────────────────────────────────────

type FeedbackItem = {
  id: number
  name: string
  github_username: string | null
  role: string | null
  rating: number
  comment: string
  use_case: string | null
  city: string | null
  would_recommend: boolean
  created_at: string
}

// ─── CSS ─────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #06080f; --bg2: #0c1120; --bg3: #111827;
    --border: rgba(255,255,255,0.11); --border2: rgba(255,255,255,0.20);
    --text: #f0f2ff; --muted: rgba(200,215,248,0.65); --muted2: rgba(160,180,230,0.40);
    --accent: #5b9eff; --accent2: #9175ff;
    --green: #4ade9e; --amber: #fcd34d; --purple: #a78bfa;
    --serif: 'Instrument Serif', Georgia, serif;
    --sans: 'DM Sans', system-ui, sans-serif;
    --mono: 'DM Mono', monospace;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--sans); overflow-x: hidden; }
  input, textarea, select { font-family: var(--sans); }
  input:focus, textarea:focus, select:focus { outline: none; border-color: rgba(91,158,255,0.5) !important; }
  ::placeholder { color: var(--muted2); }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  .fade-in { animation: fadeInUp 0.4s ease both; }
  .star-btn:hover { transform: scale(1.2); }
  .star-btn { transition: transform 0.1s; cursor: pointer; }
  .submit-btn:hover { background: rgba(91,158,255,0.25) !important; }
  .submit-btn { transition: all 0.2s; }
  .nav-link:hover { color: #fff !important; background: rgba(255,255,255,0.05) !important; }
  .card-hover:hover { border-color: rgba(91,158,255,0.25) !important; background: #111827 !important; }
  .card-hover { transition: all 0.2s; }
`

// ─── LOGO ────────────────────────────────────────────────────

function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="lb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#0d1a3d"/><stop offset="100%" stopColor="#1a0848"/></linearGradient>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7ec8ff"/><stop offset="40%" stopColor="#5b9eff"/><stop offset="100%" stopColor="#9175ff"/></linearGradient>
        <linearGradient id="lr" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#5b9eff" stopOpacity="0.9"/><stop offset="50%" stopColor="#a8d4ff"/><stop offset="100%" stopColor="#9175ff" stopOpacity="0.7"/></linearGradient>
        <radialGradient id="lg2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#5b9eff" stopOpacity="0.3"/><stop offset="100%" stopColor="#5b9eff" stopOpacity="0"/></radialGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#lb)" stroke="#1a2650" strokeWidth="0.8"/>
      <circle cx="18" cy="18" r="12" fill="url(#lg2)"/>
      <circle cx="6" cy="14" r="0.7" fill="#fff" opacity="0.5"/>
      <circle cx="30" cy="13" r="0.6" fill="#fff" opacity="0.45"/>
      <ellipse cx="18" cy="19.5" rx="20" ry="5.5" fill="none" stroke="url(#lr)" strokeWidth="1.4" transform="rotate(-18 18 19.5)"/>
      <ellipse cx="18" cy="19.5" rx="20" ry="5.5" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.45" strokeDasharray="14 48" strokeDashoffset="6" transform="rotate(-18 18 19.5)"/>
      <text x="18" y="24" fontFamily="'DM Sans',sans-serif" fontSize="11" fontWeight="600" fill="url(#lg)" textAnchor="middle" letterSpacing="-0.5">GG</text>
    </svg>
  )
}

// ─── STAR RATING ─────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className="star-btn"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{ fontSize: 28, color: n <= (hover || value) ? '#fcd34d' : 'rgba(255,255,255,0.15)' }}
        >
          ★
        </span>
      ))}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [github, setGithub] = useState('')
  const [role, setRole] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [useCase, setUseCase] = useState('')
  const [city, setCity] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState(true)
  const [error, setError] = useState('')

  // Fetch existing feedback
  useEffect(() => {
    fetchFeedback()
  }, [])

  async function fetchFeedback() {
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(50)
    setFeedbackList(data ?? [])
    setLoading(false)
  }

  async function handleSubmit() {
    setError('')
    if (!name.trim()) { setError('Please enter your name'); return }
    if (!comment.trim()) { setError('Please share your thoughts'); return }
    if (rating === 0) { setError('Please select a rating'); return }

    setSubmitting(true)
    const { error: err } = await supabase
      .from('feedback')
      .insert({
        name:             name.trim(),
        github_username:  github.trim() || null,
        role:             role || null,
        rating,
        comment:          comment.trim(),
        use_case:         useCase || null,
        city:             city.trim() || null,
        would_recommend:  wouldRecommend,
        is_approved:      true,
      })

    if (err) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
    fetchFeedback() // refresh the list
  }

  function timeAgo(dateStr: string) {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const avgRating = feedbackList.length
    ? (feedbackList.reduce((s, f) => s + f.rating, 0) / feedbackList.length).toFixed(1)
    : '0'

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--sans)', background: 'var(--bg)' }}>
      <style>{css}</style>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', padding: '0 32px', height: 60, background: 'rgba(6,8,15,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontFamily: 'var(--serif)', fontSize: 19, textDecoration: 'none' }}>
          <Logo size={32} /> GitGyan
        </a>
        <div style={{ display: 'flex', gap: 4, marginLeft: 32 }}>
          {[['/', 'Trending'], ['/languages', 'Languages'], ['/topics', 'Topics'], ['/insights', 'Insights'], ['/feedback', 'Feedback']].map(([href, label]) => (
            <a key={label} href={href} className="nav-link"
              style={{ fontSize: 13, color: label === 'Feedback' ? 'var(--accent)' : 'var(--muted)', padding: '5px 12px', borderRadius: 8, textDecoration: 'none', background: label === 'Feedback' ? 'rgba(91,158,255,0.08)' : 'transparent' }}>
              {label === 'Feedback' ? '💬 ' : ''}{label}
            </a>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <a href="https://github.com/abiprivacylab/gitgyan" target="_blank"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)', padding: '7px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', textDecoration: 'none' }}>
            ⭐ Star on GitHub
          </a>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '90px 32px 60px' }}>

        {/* HERO */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 14px', border: '1px solid rgba(91,158,255,0.3)', borderRadius: 100, background: 'rgba(91,158,255,0.08)', marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite' }} />
            Community Feedback
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(32px,4vw,52px)', lineHeight: 1.1, marginBottom: 16, background: 'linear-gradient(160deg,#fff 50%,rgba(180,205,255,0.8) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            What Developers Think
          </h1>
          <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 480, margin: '0 auto 24px' }}>
            Built by developers, for developers. Share your honest thoughts about GitGyan.
          </p>

          {/* Stats */}
          {!loading && feedbackList.length > 0 && (
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, padding: '7px 16px', fontFamily: 'var(--mono)', fontSize: 12 }}>
                <span style={{ color: '#fcd34d' }}>★</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>{avgRating}</span>
                <span style={{ color: 'var(--muted2)' }}>avg rating</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, padding: '7px 16px', fontFamily: 'var(--mono)', fontSize: 12 }}>
                <span style={{ color: 'var(--green)' }}>●</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>{feedbackList.length}</span>
                <span style={{ color: 'var(--muted2)' }}>reviews</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 9, padding: '7px 16px', fontFamily: 'var(--mono)', fontSize: 12 }}>
                <span style={{ color: 'var(--purple)' }}>●</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>{feedbackList.filter(f => f.would_recommend).length}</span>
                <span style={{ color: 'var(--muted2)' }}>would recommend</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>

          {/* FORM */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Share Your Thoughts</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>No account needed. Just your honest feedback.</p>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }} className="fade-in">
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Thank you!</h3>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>Your feedback means a lot to the GitGyan team.</p>
                <button onClick={() => { setSubmitted(false); setName(''); setGithub(''); setRole(''); setRating(0); setComment(''); setUseCase(''); setCity(''); }}
                  style={{ background: 'rgba(91,158,255,0.1)', color: 'var(--accent)', border: '1px solid rgba(91,158,255,0.2)', borderRadius: 9, padding: '8px 20px', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--mono)' }}>
                  Submit Another
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Name */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted2)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>NAME *</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px', fontSize: 14, color: 'var(--text)', transition: 'border-color 0.2s' }} />
                </div>

                {/* GitHub */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted2)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>GITHUB USERNAME</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted2)', fontSize: 13 }}>github.com/</span>
                    <input value={github} onChange={e => setGithub(e.target.value)}
                      placeholder="username"
                      style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px 10px 100px', fontSize: 14, color: 'var(--text)', transition: 'border-color 0.2s' }} />
                  </div>
                </div>

                {/* Role + City */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--muted2)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>ROLE</label>
                    <select value={role} onChange={e => setRole(e.target.value)}
                      style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px', fontSize: 14, color: role ? 'var(--text)' : 'var(--muted2)', transition: 'border-color 0.2s' }}>
                      <option value="">Select...</option>
                      <option>Developer</option>
                      <option>Student</option>
                      <option>Founder</option>
                      <option>Researcher</option>
                      <option>Designer</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--muted2)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>CITY</label>
                    <input value={city} onChange={e => setCity(e.target.value)}
                      placeholder="Atlanta, GA"
                      style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px', fontSize: 14, color: 'var(--text)', transition: 'border-color 0.2s' }} />
                  </div>
                </div>

                {/* Use case */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted2)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>HOW DO YOU USE GITGYAN?</label>
                  <select value={useCase} onChange={e => setUseCase(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px', fontSize: 14, color: useCase ? 'var(--text)' : 'var(--muted2)', transition: 'border-color 0.2s' }}>
                    <option value="">Select...</option>
                    <option>Discovering trending repos</option>
                    <option>Learning & Education</option>
                    <option>Hackathon preparation</option>
                    <option>Work & Professional</option>
                    <option>Open source contributions</option>
                    <option>Just exploring</option>
                  </select>
                </div>

                {/* Rating */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted2)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>RATING *</label>
                  <StarRating value={rating} onChange={setRating} />
                </div>

                {/* Comment */}
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted2)', fontFamily: 'var(--mono)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>YOUR THOUGHTS *</label>
                  <textarea value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="What do you think about GitGyan? Brutal honesty welcome!"
                    rows={4}
                    style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px', fontSize: 14, color: 'var(--text)', resize: 'vertical', transition: 'border-color 0.2s' }} />
                </div>

                {/* Would recommend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="recommend" checked={wouldRecommend} onChange={e => setWouldRecommend(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                  <label htmlFor="recommend" style={{ fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
                    I would recommend GitGyan to other developers
                  </label>
                </div>

                {/* Error */}
                {error && (
                  <div style={{ background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f472b6' }}>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button onClick={handleSubmit} disabled={submitting} className="submit-btn"
                  style={{ background: 'rgba(91,158,255,0.15)', color: 'var(--accent)', border: '1px solid rgba(91,158,255,0.3)', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: 'var(--sans)' }}>
                  {submitting ? 'Submitting...' : '✦ Submit Feedback'}
                </button>
              </div>
            )}
          </div>

          {/* TESTIMONIALS */}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              {feedbackList.length > 0 ? `${feedbackList.length} Developer${feedbackList.length > 1 ? 's' : ''} Reviewed` : 'Be the first to review!'}
            </h2>

            {loading && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted2)', animation: 'pulse 2s infinite' }}>
                Loading feedback...
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {feedbackList.map((f, i) => (
                <div key={f.id} className="card-hover fade-in"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, animationDelay: `${i * 0.05}s` }}>

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>{f.name}</span>
                        {f.role && (
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', background: 'rgba(91,158,255,0.1)', border: '1px solid rgba(91,158,255,0.2)', padding: '2px 8px', borderRadius: 100 }}>
                            {f.role}
                          </span>
                        )}
                        {f.would_recommend && (
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)', background: 'rgba(74,222,158,0.08)', border: '1px solid rgba(74,222,158,0.2)', padding: '2px 8px', borderRadius: 100 }}>
                            ✓ Recommends
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {f.github_username && (
                          <a href={`https://github.com/${f.github_username}`} target="_blank"
                            style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted2)', textDecoration: 'none' }}>
                            github.com/{f.github_username}
                          </a>
                        )}
                        {f.city && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted2)' }}>· {f.city}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#fcd34d', fontSize: 14, marginBottom: 2 }}>
                        {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted2)' }}>
                        {timeAgo(f.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Comment */}
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, borderLeft: '2px solid rgba(91,158,255,0.3)', paddingLeft: 12, fontStyle: 'italic' }}>
                    "{f.comment}"
                  </p>

                  {/* Use case */}
                  {f.use_case && (
                    <div style={{ marginTop: 10, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted2)' }}>
                      Used for: {f.use_case}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {feedbackList.length === 0 && !loading && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🌌</div>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>No feedback yet — be the first!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '24px 32px', marginTop: 40 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontFamily: 'var(--serif)', fontSize: 16, textDecoration: 'none' }}>
            <Logo size={20} /> GitGyan
          </a>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--mono)', marginLeft: 'auto' }}>
            © 2026 GitGyan — Where Developers Find Wisdom
          </span>
        </div>
      </footer>
    </div>
  )
}
