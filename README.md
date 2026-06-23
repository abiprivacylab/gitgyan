# GitGyan 🌌

> **Where Developers Find Wisdom**

GitGyan is an open-source, AI-powered GitHub discovery engine that scans 500,000+ repositories weekly, scores them by signal strength, and surfaces the ones gaining momentum — before they go viral.

[![Live](https://img.shields.io/badge/Live-gitgyan.dev-5b9eff?style=flat-square)](https://gitgyan.dev)
[![GitHub Stars](https://img.shields.io/github/stars/abiprivacylab/gitgyan?style=flat-square&color=fcd34d)](https://github.com/abiprivacylab/gitgyan)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-4ade9e?style=flat-square)](LICENSE)
[![Built with Claude](https://img.shields.io/badge/AI-Claude%20Haiku-9175ff?style=flat-square)](https://anthropic.com)

---

## What is GitGyan?

GitHub creates **500,000+ repositories every week**. Most are noise.

GitGyan filters that down to the repos that actually matter — using a signal scoring algorithm that weighs star velocity, momentum, fork adoption, and community activity. Every high-signal repo gets an AI summary powered by Claude Haiku, so you understand *what* it does and *why* it matters in seconds.

```
544,476 repos on GitHub this week
  11,006 analyzed by GitGyan AI
      20 high-signal picks today
```

---

## Features

- **🔥 This Week** — Fresh repos gaining momentum right now (not old viral repos)
- **✦ AI Summaries** — Claude Haiku analyzes each repo: what it does, why it matters, who should care
- **⭐ Signal Scoring** — Algorithm weighs star velocity, momentum, fork ratio, and community health
- **🔥 Viral Detection** — Catches repos going viral before mainstream discovery
- **🌐 10 Languages** — Rust, Python, TypeScript, Go, C++, JavaScript, Swift, Kotlin, Java, C
- **🤖 13 AI Topics** — Claude, MCP, LLM, AI-Agent, OpenAI, LangChain, RAG, and more
- **📊 Nightly Sync** — Automated GitHub sync runs at 2am UTC every night
- **💬 Community Feedback** — Leave feedback with GitHub profile verification

---

## Tech Stack

| Technology | Role |
|-----------|------|
| **Claude Haiku** | AI summaries — $0.0002/summary, <2s response |
| **Next.js 16** | Full-stack React — frontend + API routes + cron jobs |
| **Supabase** | PostgreSQL — repos, daily stats, feedback, viral alerts |
| **GitHub Search API** | Data source — nightly sync across languages and AI topics |
| **Vercel** | Deployment + cron job scheduler |
| **TypeScript** | End-to-end type safety |

---

## How It Works

```
Every night at 2am UTC:
┌─────────────────────────────────────────┐
│ Phase 1: Fetch by Language              │
│ 10 languages × 100 repos = ~1,000 repos │
├─────────────────────────────────────────┤
│ Phase 2: Fetch by AI Topic              │
│ 13 topics × 100 repos = ~1,300 repos    │
├─────────────────────────────────────────┤
│ Phase 3: Update Daily Stats             │
│ GitHub global count → Supabase          │
└─────────────────────────────────────────┘
         ↓
All repos scored by signal algorithm
         ↓
Users visit gitgyan.dev → reads from Supabase (instant)
         ↓
Click any repo → Claude Haiku generates AI summary
         ↓
Summary cached permanently for future visitors
```

---

## Signal Score Formula

```
signal_score (0-100) =
  stars_gained_today  × 0.40   (momentum)
  vs_7day_average     × 0.30   (acceleration)
  fork_ratio          × 0.20   (adoption)
  issue_activity      × 0.10   (community health)
```

A repo that doubles its historical star average scores 90+.
**claw-code scored 97 the day it hit 100K stars.**

---

## Getting Started

### Prerequisites

```bash
node >= 18
npm >= 9
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic (Claude Haiku)
ANTHROPIC_API_KEY=your_anthropic_key

# GitHub API
GITHUB_TOKEN=your_github_token

# Vercel Cron Protection
CRON_SECRET=your_random_secret
```

### Installation

```bash
# Clone the repo
git clone https://github.com/abiprivacylab/gitgyan.git
cd gitgyan

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see GitGyan running locally.

---

## Project Structure

```
gitgyan/
├── app/
│   ├── page.tsx                    # Main trending feed
│   ├── feedback/
│   │   └── page.tsx               # Community feedback page
│   └── api/
│       ├── repos/route.ts         # Fetch repos from Supabase
│       ├── summary/route.ts       # Claude Haiku AI summaries
│       └── cron/
│           └── sync-github/
│               └── route.ts      # Nightly GitHub sync
├── lib/
│   ├── supabase.ts               # Supabase client
│   └── supabase/
│       ├── queries/
│       │   ├── repos.ts          # Repo queries
│       │   ├── languages.ts      # Language trend queries
│       │   ├── stats.ts          # Signal score + dashboard stats
│       │   └── viral.ts          # Viral alert queries
│       └── functions/
│           ├── ai-summary.ts     # Claude Haiku integration
│           └── sync-github.ts    # GitHub sync functions
└── vercel.json                   # Cron schedule
```

---

## Database Schema

Key tables in Supabase:

```
repos            → 11,000+ high-signal GitHub repos
daily_stats      → Daily GitHub global counts + averages
viral_alerts     → Repos detected as going viral
feedback         → Community reviews with GitHub verification
language_trends  → Language ecosystem trends over time
repo_snapshots   → Daily star count history per repo
trending_history → When each repo appeared on trending
```

---

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Settings → Environment Variables
```

### Cron Jobs

The nightly sync is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-github",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Runs every night at **2:00 AM UTC**.

---

## Contributing

GitGyan is open source and we welcome contributions! 🎉

### Good First Issues

Look for issues labeled `good-first-issue` on GitHub:

- 🟢 Add language filter pills to the feed
- 🟢 Add dark/light mode toggle
- 🟢 Improve mobile responsiveness
- 🟢 Add copy link button to repo cards
- 🟢 Add keyboard shortcuts for navigation
- 🟢 Add repo age badge

### How to Contribute

```bash
# Fork the repo
# Create your feature branch
git checkout -b feat/your-feature

# Commit your changes
git commit -m "feat: add your feature"

# Push to your fork
git push origin feat/your-feature

# Open a Pull Request
```

---

## Roadmap

```
Now (Data Collection Phase):
✅ Nightly GitHub sync running
✅ AI summaries on demand
✅ Community feedback page
✅ Signal scoring algorithm
✅ Viral detection (Phase 4)

Month 2:
□ Repo Insight Page (star history charts)
□ Language Explorer (real data)
□ Weekly Archive page
□ Batch AI summary pre-generation

Month 3 (Launch):
□ Product Hunt launch
□ GitGyan for Students
□ "Show HN" with 90 days of data

Month 4-6:
□ Watchlists (track repos you care about)
□ Campus workshops & partnerships
```

---

## Cost Breakdown

Building GitGyan is remarkably affordable:

```
Claude Haiku summaries:  $0.0002/summary
11,000 summaries total:  ~$3.00
Domains (gitgyan.dev):   $24/year
Vercel (Hobby plan):     Free
Supabase (Free tier):    Free
─────────────────────────────
Total cost to run:       ~$27/year + AI costs
```

---

## Hard-Won Lessons

1. **Vercel's 5-minute timeout** — Split long cron jobs into separate phases
2. **Calculate AI costs first** — Haiku is so cheap you'll over-engineer caching
3. **Separate sync from reads** — Nightly cron writes to Supabase, users read from Supabase (zero GitHub API calls during the day)
4. **GitHub `total_count`** — One API call with `per_page=1` gives you the global count
5. **Frontend without a designer** — CSS variables + inline styles + Claude = production UI at $0

---

## Live Stats

- 🌐 **Live at:** [gitgyan.dev](https://gitgyan.dev)
- 📊 **Repos analyzed:** 11,000+
- 🔄 **Syncing since:** April 2026
- 💬 **Feedback:** [gitgyan.dev/feedback](https://gitgyan.dev/feedback)

---

## Built By

**Abhishek Anand** ([@abiprivacylab](https://twitter.com/abiprivacylab))

Developer & Researcher · Originally from India · Based in Atlanta, USA for 16 years

Built with ❤️ and [Claude AI](https://anthropic.com)

---

## License

Apache 2.0 License — see [LICENSE](LICENSE) for details.
The signal scoring algorithm and viral detection 
logic are proprietary and not included in this 
open source release.
---

*GitGyan — Where Developers Find Wisdom* 🌌