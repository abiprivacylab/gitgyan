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
  PHP: '#4f5d95', Shell: '#89e051', HTML: '#e34c26',
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
  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: var(--sans); font-size: 15px; line-height: 1.6; overflow-x: hidden; }
  a { text-decoration: none; }
  button { cursor: pointer; font-family: var(--sans); }
  input { font-family: var(--sans); }
  ::placeholder { color: var(--muted2); }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes twinkle { 0%,100%{opacity:0.3} 50%{opacity:0.8} }

  .pulse { animation: pulse 2s ease-in-out infinite; }
  .spin { animation: spin 1s linear infinite; }
  .fade-in { animation: fadeInUp 0.4s ease both; }

  .nav-link { color: var(--muted); transition: color 0.2s, background 0.2s; }
  .nav-link:hover { color: var(--text); background: rgba(255,255,255,0.05); }

  .repo-row { transition: background 0.15s, border-color 0.15s; }
  .repo-row:hover { background: var(--bg3) !important; }

  .sort-btn { transition: all 0.15s; }
  .sort-btn:hover { color: var(--text) !important; border-color: var(--border2) !important; }

  .gh-btn { transition: all 0.2s; }
  .gh-btn:hover { background: rgba(91,158,255,0.18) !important; }

  .search-input:focus { border-color: rgba(91,158,255,0.4) !important; outline: none; }
`

// ─── LOGO ─────────────────────────────────────────────────────

function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <defs>
        <linearGradient id="lb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d1a3d"/><stop offset="100%" stopColor="#1a0848"/>
        </linearGradient>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7ec8ff"/><stop offset="40%" stopColor="#5b9eff"/><stop offset="100%" stopColor="#9175ff"/>
        </linearGradient>
        <linearGradient id="lr" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5b9eff" stopOpacity="0.9"/>
          <stop offset="50%" stopColor="#a8d4ff"/>
          <stop offset="100%" stopColor="#9175ff" stopOpacity="0.7"/>
        </linearGradient>
        <radialGradient id="lg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5b9eff" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#5b9eff" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#lb)" stroke="#1a2650" strokeWidth="0.8"/>
      <circle cx="18" cy="18" r="12" fill="url(#lg2)"/>
      <circle cx="6" cy="14" r="0.7" fill="#fff" opacity="0.5"/>
      <circle cx="30" cy="13" r="0.6" fill="#fff" opacity="0.45"/>
      <circle cx="5" cy="23" r="0.6" fill="#fff" opacity="0.4"/>
      <circle cx="31" cy="24" r="0.7" fill="#fff" opacity="0.4"/>
      <path d="M9,9 C9,9 9.4,10.4 9,11.8 C8.6,10.4 9,9 9,9Z" fill="#a8c8ff" opacity="0.75"/>
      <path d="M7.2,10.4 C7.2,10.4 9,10.8 10.8,10.4 C9,10 7.2,10.4 7.2,10.4Z" fill="#a8c8ff" opacity="0.75"/>
      <path d="M27,8 C27,8 27.4,9.2 27,10.4 C26.6,9.2 27,8 27,8Z" fill="#c4b5fd" opacity="0.7"/>
      <path d="M25.4,9.2 C25.4,9.2 27,9.6 28.6,9.2 C27,8.8 25.4,9.2 25.4,9.2Z" fill="#c4b5fd" opacity="0.7"/>
      <ellipse cx="18" cy="19.5" rx="20" ry="5.5" fill="none" stroke="url(#lr)" strokeWidth="1.4" transform="rotate(-18 18 19.5)"/>
      <ellipse cx="18" cy="19.5" rx="20" ry="5.5" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.45" strokeDasharray="14 48" strokeDashoffset="6" transform="rotate(-18 18 19.5)"/>
      <circle cx="37" cy="17" r="1.8" fill="#a8c8ff" opacity="0.85"/>
      <circle cx="0" cy="22" r="1.4" fill="#9175ff" opacity="0.75"/>
      <text x="18" y="24" fontFamily="'DM Sans',sans-serif" fontSize="11" fontWeight="600" fill="url(#lg)" textAnchor="middle" letterSpacing="-0.5">GG</text>
    </svg>
  )
}

// ─── STARFIELD ────────────────────────────────────────────────

function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    let stars: any[] = [], id: number
    const resize = () => {
      c.width = window.innerWidth; c.height = window.innerHeight
      stars = Array.from({length:130}, () => ({
        x: Math.random()*c.width, y: Math.random()*c.height,
        r: Math.random()*1.1+0.2, a: Math.random()*0.5+0.1,
        da: (Math.random()-0.5)*0.003,
      }))
    }
    const draw = () => {
      ctx.clearRect(0,0,c.width,c.height)
      for(const s of stars){
        s.a+=s.da; if(s.a<0.05||s.a>0.6)s.da*=-1
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2)
        ctx.fillStyle=`rgba(180,210,255,${s.a})`; ctx.fill()
      }
      id = requestAnimationFrame(draw)
    }
    resize(); draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none'}}/>
}

// ─── HELPERS ─────────────────────────────────────────────────

function fmtStars(n: number) { return n>=1000?`${(n/1000).toFixed(1)}k`:String(n) }
function timeAgo(d: string) {
  const days = Math.floor((Date.now()-new Date(d).getTime())/86400000)
  if(days===0)return'today'; if(days===1)return'1 day ago'
  if(days<7)return`${days} days ago`; if(days<30)return`${Math.floor(days/7)}w ago`
  return`${Math.floor(days/30)}mo ago`
}

// ─── MAIN ────────────────────────────────────────────────────

export default function Home() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Repo|null>(null)
  const [summary, setSummary] = useState<AISummary|null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'stars'|'new'>('stars')

  useEffect(() => {
    fetch('/api/repos').then(r=>r.json()).then(d=>{
      setRepos(d.repos||[]); setTotal(d.total); setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  const handleClick = async (repo: Repo) => {
    setSelected(repo); setSummary(null); setAiLoading(true)
    try {
      const res = await fetch('/api/summary', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({repoId:repo.id,repoName:repo.name,description:repo.description,language:repo.language,stars:repo.stargazers_count,topics:repo.topics||[]})
      })
      setSummary(await res.json())
    } catch(e){console.error(e)} finally{setAiLoading(false)}
  }

  const filtered = repos
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase()) || r.language?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sort==='stars' ? b.stargazers_count-a.stargazers_count : new Date(b.created_at).getTime()-new Date(a.created_at).getTime())

  const S: Record<string,React.CSSProperties> = {
    page:     {minHeight:'100vh', fontFamily:'var(--sans)', position:'relative'},
    nav:      {position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',padding:'0 32px',height:60,background:'rgba(6,8,15,0.88)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.1)'},
    navLogo:  {display:'flex',alignItems:'center',gap:10,color:'#fff',fontFamily:'var(--serif)',fontSize:19,letterSpacing:'-0.3px'},
    navLinks: {display:'flex',gap:4,marginLeft:32},
    navLink:  {fontSize:13,color:'var(--muted)',padding:'5px 12px',borderRadius:8},
    navRight: {marginLeft:'auto',display:'flex',gap:8,alignItems:'center'},
    ghBtn:    {display:'flex',alignItems:'center',gap:6,fontSize:13,color:'var(--muted)',padding:'7px 16px',borderRadius:9,border:'1px solid rgba(255,255,255,0.2)',background:'transparent'},
    main:     {position:'relative',zIndex:1,paddingTop:80,paddingBottom:60,maxWidth:1200,margin:'0 auto',padding:'80px 32px 60px'},
    eyebrow:  {display:'inline-flex',alignItems:'center',gap:8,fontFamily:'var(--mono)',fontSize:11,color:'var(--accent)',letterSpacing:'0.12em',textTransform:'uppercase',padding:'5px 14px',border:'1px solid rgba(91,158,255,0.3)',borderRadius:100,background:'rgba(91,158,255,0.08)',marginBottom:24},
    eyeDot:   {width:6,height:6,borderRadius:'50%',background:'var(--accent)'},
    h1:       {fontFamily:'var(--serif)',fontSize:'clamp(40px,5vw,64px)',lineHeight:1.08,letterSpacing:'-1px',marginBottom:20,background:'linear-gradient(160deg,#fff 50%,rgba(180,205,255,0.8) 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'},
    h1em:     {fontStyle:'italic',background:'linear-gradient(135deg,#5b9eff,#9175ff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'},
    sub:      {fontSize:17,color:'var(--muted)',lineHeight:1.7,maxWidth:480,marginBottom:28},
    statsRow: {display:'flex',gap:10,flexWrap:'wrap' as const,marginBottom:24},
    statPill: {display:'flex',alignItems:'center',gap:8,background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:9,padding:'7px 14px',fontFamily:'var(--mono)',fontSize:11},
    statDot:  {width:6,height:6,borderRadius:'50%',flexShrink:0},
    statVal:  {color:'#fff',fontWeight:500},
    statLbl:  {color:'var(--muted2)'},
    toolRow:  {display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' as const,marginBottom:24},
    searchWrap:{position:'relative',flex:1,minWidth:240,maxWidth:440},
    searchIcon:{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--muted2)',pointerEvents:'none' as const},
    searchIn: {width:'100%',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 16px 10px 40px',fontSize:14,color:'var(--text)',transition:'border-color 0.2s'},
    sortRow:  {display:'flex',gap:6},
    sortBtn:  (active:boolean):React.CSSProperties => ({fontFamily:'var(--mono)',fontSize:11,padding:'6px 14px',borderRadius:100,border:`1px solid ${active?'rgba(91,158,255,0.4)':'rgba(255,255,255,0.11)'}`,background:active?'rgba(91,158,255,0.12)':'transparent',color:active?'var(--accent)':'var(--muted)'}),
    repoCount:{fontFamily:'var(--mono)',fontSize:11,color:'var(--muted2)',marginLeft:'auto'},
    content:  {display:'flex',gap:20,alignItems:'flex-start'},
    list:     {flex:1,display:'flex',flexDirection:'column' as const},
    row:      (i:number,total:number,sel:boolean):React.CSSProperties => ({
      display:'flex',alignItems:'flex-start',gap:14,padding:'16px 20px',
      background: sel?'#111827':'#0c1120',
      border:'1px solid',
      borderColor: sel?'rgba(91,158,255,0.25)':'rgba(255,255,255,0.11)',
      borderLeft: `3px solid ${sel?'#5b9eff':'transparent'}`,
      borderTop: i===0?undefined:'none',
      borderRadius: i===0?'14px 14px 0 0': i===total-1?'0 0 14px 14px':'0',
      cursor:'pointer',
    }),
    rank:     {fontFamily:'var(--mono)',fontSize:16,color:'rgba(255,255,255,0.12)',minWidth:32,paddingTop:2},
    info:     {flex:1,minWidth:0},
    nameRow:  {display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' as const,marginBottom:4},
    org:      {fontSize:15,fontWeight:600,color:'var(--muted)'},
    name:     {fontSize:15,fontWeight:600,color:'#fff'},
    badge:    (color:string,bg:string,border:string):React.CSSProperties => ({fontFamily:'var(--mono)',fontSize:10,padding:'2px 8px',borderRadius:100,color,background:bg,border:`1px solid ${border}`}),
    desc:     {fontSize:13,color:'var(--muted)',lineHeight:1.5,marginBottom:8,overflow:'hidden',whiteSpace:'nowrap' as const,textOverflow:'ellipsis'},
    metaRow:  {display:'flex',alignItems:'center',gap:12,flexWrap:'wrap' as const},
    meta:     {fontFamily:'var(--mono)',fontSize:12,color:'var(--muted)'},
    metaAge:  {fontFamily:'var(--mono)',fontSize:11,color:'var(--muted2)'},
    langDot:  (color:string):React.CSSProperties => ({width:7,height:7,borderRadius:'50%',background:color,display:'inline-block',marginRight:4}),
    arrow:    (sel:boolean):React.CSSProperties => ({fontSize:18,color:sel?'var(--accent)':'rgba(255,255,255,0.15)',flexShrink:0,marginTop:2}),

    // AI panel
    panel:    {width:300,flexShrink:0,position:'sticky' as const,top:80},
    panelBox: {background:'var(--bg2)',border:'1px solid rgba(91,158,255,0.25)',borderRadius:14,padding:20},
    panelHdr: {display:'flex',alignItems:'center',gap:8,marginBottom:16,paddingBottom:14,borderBottom:'1px solid rgba(255,255,255,0.07)'},
    aiIcon:   {width:22,height:22,borderRadius:6,background:'rgba(167,139,250,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,flexShrink:0},
    aiLabel:  {fontFamily:'var(--mono)',fontSize:10,color:'#a78bfa',letterSpacing:'0.06em'},
    panelName:{fontSize:14,fontWeight:600,color:'#fff',marginBottom:2},
    panelOrg: {fontFamily:'var(--mono)',fontSize:11,color:'var(--muted2)',marginBottom:16},
    catBadge: {display:'inline-block',fontFamily:'var(--mono)',fontSize:10,background:'rgba(79,142,247,0.1)',color:'var(--accent)',border:'1px solid rgba(79,142,247,0.2)',padding:'2px 8px',borderRadius:100,marginBottom:14},
    secLabel: {fontFamily:'var(--mono)',fontSize:9,color:'var(--muted2)',letterSpacing:'0.12em',marginBottom:6},
    oneLiner: {fontSize:13,color:'#fff',fontWeight:600,lineHeight:1.5,fontStyle:'italic',borderLeft:'2px solid rgba(167,139,250,0.4)',paddingLeft:10,marginBottom:14},
    bodyText: {fontSize:12,color:'var(--muted)',lineHeight:1.6,marginBottom:14},
    viewBtn:  {width:'100%',textAlign:'center' as const,background:'rgba(91,158,255,0.1)',color:'var(--accent)',fontSize:12,fontFamily:'var(--mono)',padding:'10px 16px',borderRadius:9,border:'1px solid rgba(91,158,255,0.2)',marginTop:8},
    loading:  {fontFamily:'var(--mono)',fontSize:12,color:'var(--accent)'},
    footer:   {position:'relative',zIndex:1,borderTop:'1px solid rgba(255,255,255,0.07)',padding:'28px 32px',marginTop:20},
    footInner:{maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap' as const},
    footLogo: {display:'flex',alignItems:'center',gap:8,color:'#fff',fontFamily:'var(--serif)',fontSize:16},
    footLinks:{display:'flex',gap:4,marginLeft:'auto'},
    footLink: {fontSize:13,color:'var(--muted2)',padding:'3px 10px',borderRadius:6},
    footCopy: {fontSize:12,color:'rgba(255,255,255,0.2)',fontFamily:'var(--mono)',marginLeft:12},
  }

  return (
    <div style={S.page}>
      <style>{css}</style>
      <Starfield />

      {/* NAV */}
      <nav style={S.nav}>
        <a href="/" style={S.navLogo}><Logo size={32}/> GitGyan</a>
        <div style={S.navLinks}>
          {['Trending','Languages','Topics','Insights'].map(l=>(
            <a key={l} href="#" className="nav-link" style={S.navLink}>{l}</a>
          ))}
        </div>
        <div style={S.navRight}>
          <a href="https://github.com/abiprivacylab/gitgyan" target="_blank" className="gh-btn" style={S.ghBtn}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            Star on GitHub
          </a>
        </div>
      </nav>

      {/* MAIN */}
      <div style={S.main}>

        {/* HERO */}
        <div style={S.eyebrow}>
          <span className="pulse" style={S.eyeDot}/>
          AI-Powered GitHub Discovery
        </div>

        <h1 style={S.h1}>
          Where Developers<br/>
          <em style={S.h1em}>Find Wisdom.</em>
        </h1>

        <p style={S.sub}>
          GitGyan scans GitHub daily, finds high-signal repos, and analyzes them with AI —
          ranked before they go viral.
        </p>

        {/* Stats */}
        {!loading && (
          <div style={S.statsRow}>
            <div style={S.statPill}>
              <span className="pulse" style={{...S.statDot,background:'#4ade9e'}}/>
              <span style={S.statVal}>{repos.length}</span>
              <span style={S.statLbl}>high-signal repos today</span>
            </div>
            <div style={S.statPill}>
              <span style={{...S.statDot,background:'#fcd34d'}}/>
              <span style={S.statVal}>{total.toLocaleString()}</span>
              <span style={S.statLbl}>repos scanned</span>
            </div>
            <div style={S.statPill}>
              <span style={{...S.statDot,background:'#a78bfa'}}/>
              <span style={S.statVal}>{repos.filter(r=>r.topics?.length>0).length}</span>
              <span style={S.statLbl}>AI summaries ready</span>
            </div>
          </div>
        )}

        {/* Search + Sort */}
        <div style={S.toolRow}>
          <div style={S.searchWrap}>
            <svg style={S.searchIcon} width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="9" r="6"/><path d="M15 15l3 3"/>
            </svg>
            <input
              className="search-input"
              style={S.searchIn}
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Search repos, topics, or languages…"
            />
          </div>
          <div style={S.sortRow}>
            {([['stars','★ Stars'],['new','✦ Newest']] as const).map(([v,l])=>(
              <button key={v} className="sort-btn" style={S.sortBtn(sort===v)} onClick={()=>setSort(v)}>{l}</button>
            ))}
          </div>
          <span style={S.repoCount}>{filtered.length} repos</span>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{textAlign:'center',padding:'60px 0',fontFamily:'var(--mono)',fontSize:13,color:'var(--muted2)'}}>
            <div style={{display:'inline-block',width:16,height:16,border:'1.5px solid rgba(91,158,255,0.3)',borderTopColor:'var(--accent)',borderRadius:'50%',marginRight:8,verticalAlign:'middle'}} className="spin"/>
            Scanning the universe…
          </div>
        )}

        {/* Content */}
        {!loading && (
          <div style={S.content}>

            {/* Repo list */}
            <div style={S.list}>
              {filtered.map((repo,i) => {
                const color = langColors[repo.language]??'#5b9eff'
                const sel = selected?.id===repo.id
                const isNew = Math.floor((Date.now()-new Date(repo.created_at).getTime())/86400000)<=7
                return (
                  <div key={repo.id} className="repo-row" style={S.row(i,filtered.length,sel)} onClick={()=>handleClick(repo)}>
                    <div style={S.rank}>{String(i+1).padStart(2,'0')}</div>
                    <div style={S.info}>
                      <div style={S.nameRow}>
                        <span style={S.org}>{repo.owner.login} /</span>
                        <span style={S.name}>{repo.name}</span>
                        {repo.topics?.length>0 && <span style={S.badge('#a78bfa','rgba(167,139,250,0.08)','rgba(167,139,250,0.3)')}>✦ AI ready</span>}
                        {isNew && <span style={S.badge('#4ade9e','rgba(74,222,158,0.08)','rgba(74,222,158,0.3)')}>✦ new</span>}
                      </div>
                      <div style={S.desc}>{repo.description||'No description provided'}</div>
                      <div style={S.metaRow}>
                        <span style={S.meta}>★ {fmtStars(repo.stargazers_count)}</span>
                        {repo.language && (
                          <span style={S.meta}>
                            <span style={S.langDot(color)}/>{repo.language}
                          </span>
                        )}
                        <span style={S.metaAge}>· {timeAgo(repo.created_at)}</span>
                      </div>
                    </div>
                    <div style={S.arrow(sel)}>{sel?'✦':'›'}</div>
                  </div>
                )
              })}
            </div>

            {/* AI Panel */}
            {selected && (
              <div style={S.panel}>
                <div style={S.panelBox}>
                  <div style={S.panelHdr}>
                    <div style={S.aiIcon}>✦</div>
                    <span style={S.aiLabel}>AI SUMMARY · CLAUDE HAIKU</span>
                  </div>
                  <div style={S.panelName}>{selected.name}</div>
                  <div style={S.panelOrg}>by {selected.owner.login}</div>

                  {aiLoading && (
                    <div style={S.loading} className="pulse">Generating summary…</div>
                  )}

                  {summary && !aiLoading && (
                    <>
                      {summary.category && <div style={S.catBadge}>{summary.category}</div>}
                      <div style={S.secLabel}>ONE LINER</div>
                      <div style={S.oneLiner}>{summary.oneLiner}</div>
                      <div style={S.secLabel}>WHY IT MATTERS</div>
                      <div style={S.bodyText}>{summary.whyItMatters}</div>
                      <div style={S.secLabel}>WHO SHOULD CARE</div>
                      <div style={{...S.bodyText,marginBottom:0}}>{summary.whoShouldCare}</div>
                      {summary.cached && <div style={{fontFamily:'var(--mono)',fontSize:10,color:'rgba(255,255,255,0.2)',marginTop:8}}>· cached summary</div>}
                      <button className="gh-btn" style={S.viewBtn} onClick={()=>window.open(selected.html_url,'_blank')}>
                        View on GitHub →
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={S.footer}>
        <div style={S.footInner}>
          <a href="/" style={S.footLogo}><Logo size={22}/> GitGyan</a>
          <div style={S.footLinks}>
            {['About','Contact','Privacy','Terms'].map(l=>(
              <a key={l} href="#" style={S.footLink} className="nav-link">{l}</a>
            ))}
          </div>
          <span style={S.footCopy}>© 2026 GitGyan — Where Developers Find Wisdom</span>
        </div>
      </footer>
    </div>
  )
}