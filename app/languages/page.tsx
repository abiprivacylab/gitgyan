'use client'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;600&family=DM+Mono&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #06080f; color: #f0f2ff; font-family: 'DM Sans', sans-serif; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
`

// Change these per page:
const PAGE = {
  icon:        '🌐',
  title:       'Languages',
  description: 'Explore trending repositories by programming language — Rust, Python, TypeScript, Go and more.',
  eta:         'Coming Month 2',
}

export default function ComingSoon() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      <style>{css}</style>

      {typeof window !== 'undefined' && [...Array(20)].map((_, i) => (
       <div key={i} style={{
          position: 'fixed',
          width: Math.random() * 2 + 1,
          height: Math.random() * 2 + 1,
          borderRadius: '50%',
          background: '#a8c8ff',
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          opacity: Math.random() * 0.5 + 0.1,
          animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 2}s`,
        }} />
      ))}

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', padding: '0 32px', height: 60, background: 'rgba(6,8,15,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 100 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
            <defs>
              <linearGradient id="lb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#0d1a3d"/><stop offset="100%" stopColor="#1a0848"/></linearGradient>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#7ec8ff"/><stop offset="40%" stopColor="#5b9eff"/><stop offset="100%" stopColor="#9175ff"/></linearGradient>
              <linearGradient id="lr" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#5b9eff" stopOpacity="0.9"/><stop offset="50%" stopColor="#a8d4ff"/><stop offset="100%" stopColor="#9175ff" stopOpacity="0.7"/></linearGradient>
              <radialGradient id="lg2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#5b9eff" stopOpacity="0.3"/><stop offset="100%" stopColor="#5b9eff" stopOpacity="0"/></radialGradient>
            </defs>
            <circle cx="18" cy="18" r="17" fill="url(#lb)" stroke="#1a2650" strokeWidth="0.8"/>
            <circle cx="18" cy="18" r="12" fill="url(#lg2)"/>
            <ellipse cx="18" cy="19.5" rx="20" ry="5.5" fill="none" stroke="url(#lr)" strokeWidth="1.4" transform="rotate(-18 18 19.5)"/>
            <text x="18" y="24" fontFamily="'DM Sans',sans-serif" fontSize="11" fontWeight="600" fill="url(#lg)" textAnchor="middle" letterSpacing="-0.5">GG</text>
          </svg>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 19, color: '#fff' }}>GitGyan</span>
        </a>
        <div style={{ display: 'flex', gap: 4, marginLeft: 32 }}>
          {[['/', 'Trending'], ['#', 'Languages'], ['#', 'Topics'], ['#', 'Insights'], ['/feedback', '💬 Feedback']].map(([href, label]) => (
            <a key={label} href={href}
              style={{ fontSize: 13, color: 'rgba(200,215,248,0.65)', padding: '5px 12px', borderRadius: 8, textDecoration: 'none' }}>
              {label}
            </a>
          ))}
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <a href="https://github.com/abiprivacylab/gitgyan" target="_blank"
            style={{ fontSize: 13, color: 'rgba(200,215,248,0.65)', padding: '7px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none' }}>
            ⭐ Star on GitHub
          </a>
        </div>
      </nav>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>

        <div style={{ fontSize: 64, marginBottom: 24 }}>{PAGE.icon}</div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#5b9eff', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 14px', border: '1px solid rgba(91,158,255,0.3)', borderRadius: 100, background: 'rgba(91,158,255,0.08)', marginBottom: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5b9eff', animation: 'pulse 2s infinite' }} />
          {PAGE.eta}
        </div>

        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 48, lineHeight: 1.1, marginBottom: 16, background: 'linear-gradient(160deg,#fff 50%,rgba(180,205,255,0.8) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {PAGE.title} Explorer
        </h1>

        <p style={{ fontSize: 16, color: 'rgba(200,215,248,0.65)', lineHeight: 1.7, marginBottom: 32 }}>
          {PAGE.description}
        </p>

        {/* Stats teaser */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ background: '#0c1120', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 9, padding: '10px 20px', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
            <span style={{ color: '#fff', fontWeight: 600 }}>11,088</span>
            <span style={{ color: 'rgba(160,180,230,0.4)', marginLeft: 6 }}>repos ready</span>
          </div>
          <div style={{ background: '#0c1120', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 9, padding: '10px 20px', fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
            <span style={{ color: '#fff', fontWeight: 600 }}>10</span>
            <span style={{ color: 'rgba(160,180,230,0.4)', marginLeft: 6 }}>languages tracked</span>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/" style={{ background: 'rgba(91,158,255,0.15)', color: '#5b9eff', border: '1px solid rgba(91,158,255,0.3)', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            ← Back to Trending
          </a>
          <a href="/feedback" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            💬 Leave Feedback
          </a>
        </div>

        <p style={{ marginTop: 32, fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'rgba(160,180,230,0.3)' }}>
          gitgyan.dev · Where Developers Find Wisdom
        </p>
      </div>
    </div>
  )
}
