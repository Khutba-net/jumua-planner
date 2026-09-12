# Khutba

A production SaaS platform for mosque sermon (khutbah) planning — helping imams and institutions organize coherent, year-long sermon series.

**Live at [khutba.net](https://khutba.net)**

## Features

- **Annual Sermon Planning** — 4-season framework with elastic theme allocation, occasion interleaving, and guided planning wizard
- **Multi-Mosque Institutions** — 3-tier hierarchy (institution > mosque > khatib) with cross-mosque scheduling and theme overrides
- **Khatib Management** — Assignment, swap workflows, temporary coverage, bulk reassignment, and retirement handling
- **Sermon Approval Pipeline** — Submit, review, approve/revise workflow with email notifications
- **Bilingual (EN/AR)** — 1,170+ i18n keys across English and Arabic with RTL support
- **Offline PWA** — Service worker with offline fallback for uninterrupted access
- **Email Notifications** — 8 transactional email templates (verification, password reset, invitation, reminders, assignments, approvals)
- **Stripe Billing** — Subscription plans (Personal / Team / Institution) with 14-day trial

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, standalone output) |
| Language | TypeScript |
| Database | PostgreSQL (Neon serverless) |
| Auth | Session-based with email verification, password reset, RBAC |
| Email | Resend |
| Payments | Stripe |
| Monitoring | Sentry (client + server + edge) |
| Rate Limiting | Upstash Redis (with in-memory fallback) |
| Analytics | Vercel Analytics |
| Deployment | Vercel + Docker |
| Styling | Tailwind CSS |

## Project Stats

- **17,000+ lines** of production TypeScript
- **56 API endpoints** across auth, sermons, scheduling, org management, billing
- **23 pages** with full bilingual support
- **14 database tables** with 22 optimized indexes
- **Versioned migration system** with transaction-wrapped rollouts

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Neon, Resend, Stripe, and Sentry credentials

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

Open [http://localhost:3100](http://localhost:3100) — click **Try Demo** on the login page to explore with a pre-configured account.

## Docker

```bash
docker build -t khutba .
docker run -p 3000:3000 \
  -e DATABASE_URL="your-neon-connection-string" \
  -e RESEND_API_KEY="your-key" \
  khutba
```

## Architecture

```
src/
  app/
    (app)/          # Authenticated app pages
      dashboard/    # Personal dashboard with day-aware messaging
      sermons/      # Sermon list, editor, approval workflow
      themes/       # Annual theme planning with 4-season model
      calendar/     # Friday schedule calendar view
      org/          # Organization management
        khatibs/    # Khatib roster and profiles
        mosques/    # Multi-mosque management (institutions)
        schedule/   # Per-mosque scheduling
    auth/           # Login, signup, verification, password reset
    api/            # 56 RESTful API endpoints
  lib/
    db.ts           # PostgreSQL connection pool + migrations
    email.ts        # Resend email service (8 templates)
    logger.ts       # Structured JSON logging
    rate-limit.ts   # Upstash Redis + in-memory fallback
  i18n/             # EN/AR translation keys
migrations/         # Versioned SQL migration files
```

## License

Proprietary. All rights reserved.
