# Eisla Ops Hub — Next.js + PostgreSQL Migration Brief

> **Source:** `eisla-ops-v6.jsx` (v1.2, 1283 lines, single React component)
> **Target:** Next.js 14+ App Router, Supabase (PostgreSQL + Auth), Vercel deployment
> **Date:** 27 Feb 2026

---

## What This File Is

This is a migration brief for Claude Code. The source file is a fully functional browser-based React prototype. Your job is to migrate it into a production Next.js application preserving ALL existing functionality. Work in phases. Do not skip features.

---

## Current Architecture

- **Single JSX file** running as a React artifact (no build step)
- **Browser storage** via `window.storage` key-value (not localStorage)
- **Client-side auth** with SHA-256 hashing (demo only — replace with Supabase Auth)
- **Recharts** for dashboard charts (BarChart, PieChart)
- **No API, no server, no database** — everything is client-side state

---

## Target Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14+ (App Router) | TypeScript, server components by default |
| Database | Supabase (PostgreSQL) | Row-level security, realtime subscriptions |
| Auth | Supabase Auth | Email/password, NIST password policy enforced server-side |
| ORM | Prisma or Drizzle | Your choice, Drizzle preferred for edge |
| Hosting | Vercel | Edge functions where possible |
| Email | Resend | Invite emails, stage notifications |
| Payments | Stripe Checkout | Design fee collection pre-pipeline |
| Charts | Recharts | Already used in prototype, keep it |
| Styling | Tailwind CSS | Replace inline styles |

---

## Database Schema

Migrate these from the JSON blobs in the prototype. The source uses `v6-*` storage keys.

### users
```
id              UUID PRIMARY KEY
name            TEXT NOT NULL
email           TEXT UNIQUE NOT NULL
role            TEXT CHECK (role IN ('admin', 'engineer', 'auditor'))
active          BOOLEAN DEFAULT true
must_change_pw  BOOLEAN DEFAULT false    -- or 'compromise' string
password_set_at TIMESTAMPTZ
failed_attempts INT DEFAULT 0
locked_until    TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
last_login      TIMESTAMPTZ
invite_sent_at  TIMESTAMPTZ
invite_sent_by  UUID REFERENCES users(id)
```

### audit_log
```
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
event           TEXT NOT NULL
ip              INET
created_at      TIMESTAMPTZ DEFAULT now()
```

### customers
```
id              UUID PRIMARY KEY
account_number  TEXT UNIQUE NOT NULL     -- CUST-0001 format
name            TEXT
email           TEXT
phone           TEXT
company         TEXT
addr1, addr2, city, county, postcode, country  TEXT
status          TEXT DEFAULT 'Active'
source          TEXT
-- GDPR fields
lawful_basis    TEXT DEFAULT 'contract'
privacy_notice_version  TEXT
privacy_accepted        BOOLEAN DEFAULT false
privacy_accepted_at     TIMESTAMPTZ
data_processing_consent BOOLEAN DEFAULT false
mkt_email, mkt_sms, mkt_phone, mkt_post, mkt_third_party  BOOLEAN DEFAULT false
mkt_email_date, mkt_sms_date, mkt_phone_date, mkt_post_date, mkt_third_party_date  TIMESTAMPTZ
retention_period TEXT DEFAULT '6 years'
notes           TEXT
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

### consent_log
```
id              UUID PRIMARY KEY
customer_id     UUID REFERENCES customers(id)
field           TEXT NOT NULL
old_value       TEXT
new_value       TEXT
actor           TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

### orders
```
id              UUID PRIMARY KEY
number          TEXT UNIQUE NOT NULL     -- EISLA-2026-0001 format
customer_id     UUID REFERENCES customers(id)
-- Denormalised customer fields for display (synced on link)
customer_name, email, phone, company  TEXT
-- Delivery address
del_addr1, del_addr2, del_city, del_county, del_postcode, del_country  TEXT
del_instructions TEXT
-- Service
stage           TEXT NOT NULL DEFAULT 'enquiry'
tier            TEXT CHECK (tier IN ('T1', 'T2', 'T3')) DEFAULT 'T1'
service_level   TEXT CHECK (service_level IN ('standard', 'priority', 'express')) DEFAULT 'standard'
fee             INTEGER                  -- pence
mfg_estimate    INTEGER
description     TEXT
-- T&Cs
tos_version     TEXT
tos_accepted    BOOLEAN DEFAULT false
tos_accepted_at TIMESTAMPTZ
-- Payment (Stripe)
payment_status  TEXT DEFAULT 'Unpaid'
stripe_session_id       TEXT
stripe_payment_intent   TEXT
stripe_charge_id        TEXT
stripe_amount           INTEGER
stripe_receipt_url      TEXT
payment_date            TIMESTAMPTZ
-- Pipeline results
parse_confidence FLOAT
erc_result      TEXT
drc_result      TEXT
-- Quote
quote_ref       TEXT
quote_sent_at   TIMESTAMPTZ
-- Manufacturing
fab             TEXT
fab_ref         TEXT
fab_cost        INTEGER
tracking        TEXT
carrier         TEXT
shipped_at      TIMESTAMPTZ
delivered_at    TIMESTAMPTZ
-- Metadata
notes           TEXT
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()
```

### order_auto_review
```
order_id        UUID PRIMARY KEY REFERENCES orders(id)
checks          JSONB           -- array of 14 pass/fail strings
result          TEXT
completed_at    TIMESTAMPTZ
```

### order_sense_check
```
order_id        UUID PRIMARY KEY REFERENCES orders(id)
approved        BOOLEAN
by_user_id      UUID REFERENCES users(id)
notes           TEXT
completed_at    TIMESTAMPTZ
```

### order_engineer_review
```
order_id        UUID PRIMARY KEY REFERENCES orders(id)
engineer_id     UUID REFERENCES users(id)
sent_at         TIMESTAMPTZ
completed_at    TIMESTAMPTZ
outcome         TEXT
comments        TEXT
```

### order_customer_approval
```
order_id        UUID PRIMARY KEY REFERENCES orders(id)
approved        BOOLEAN
method          TEXT
version         TEXT
notes           TEXT
completed_at    TIMESTAMPTZ
```

### order_files
```
id              UUID PRIMARY KEY
order_id        UUID REFERENCES orders(id)
file_key        TEXT NOT NULL     -- kicad_project, schematic, gerbers, etc.
label           TEXT
url             TEXT
version         TEXT DEFAULT '1.0'
size            TEXT
uploaded_at     TIMESTAMPTZ
```

### order_comms
```
id              UUID PRIMARY KEY
order_id        UUID REFERENCES orders(id)
type            TEXT NOT NULL     -- email_out, email_in, phone_out, phone_in, meeting, note, quote, invoice
subject         TEXT
body            TEXT
by_user_id      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ DEFAULT now()
```

### order_timeline
```
id              UUID PRIMARY KEY
order_id        UUID REFERENCES orders(id)
event           TEXT NOT NULL
actor           TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

### order_feedback
```
order_id        UUID PRIMARY KEY REFERENCES orders(id)
overall, quality, comms, time, use_again  TEXT
comments        TEXT
testimonial     TEXT
```

### ncrs
```
id              UUID PRIMARY KEY
number          TEXT UNIQUE
date            DATE
severity        TEXT
description     TEXT
status          TEXT DEFAULT 'Open'
raised_by       TEXT
created_at      TIMESTAMPTZ DEFAULT now()
```

### suppliers
```
id              UUID PRIMARY KEY
name            TEXT NOT NULL
type            TEXT             -- Fabricator, Contract Engineer
quality, delivery, price, capability, comms  TEXT
approved        TEXT
notes           TEXT
```

### risks
```
id              TEXT PRIMARY KEY  -- R01, R02 format
description     TEXT
category        TEXT
likelihood      INT
impact          INT
mitigation      TEXT
owner           TEXT
status          TEXT DEFAULT 'Active'
```

### exceptions
```
id              UUID PRIMARY KEY
order_id        UUID REFERENCES orders(id)
type            TEXT
description     TEXT
resolved        BOOLEAN DEFAULT false
resolved_by     TEXT
resolved_at     TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```

---

## Route Structure

```
app/
├── (auth)/
│   ├── login/page.tsx              -- Login form
│   ├── setup/page.tsx              -- First-time admin setup
│   └── change-password/page.tsx    -- Forced password change
├── ops/                            -- Admin/Auditor portal
│   ├── layout.tsx                  -- Sidebar nav + auth guard
│   ├── page.tsx                    -- Dashboard (KPIs, SLA alerts, charts)
│   ├── search/page.tsx             -- Full-text search + filters
│   ├── pipeline/page.tsx           -- Kanban board
│   ├── orders/
│   │   ├── new/page.tsx            -- New order form
│   │   └── [id]/page.tsx           -- Order detail (all sections)
│   ├── customers/
│   │   ├── page.tsx                -- Customer list
│   │   └── [id]/page.tsx           -- Customer detail + GDPR
│   ├── sense-check/page.tsx        -- Sense check queue
│   ├── exceptions/page.tsx         -- Exception queue
│   ├── ncrs/page.tsx               -- NCR register
│   ├── suppliers/page.tsx          -- Supplier management
│   ├── risks/page.tsx              -- Risk register
│   └── users/page.tsx              -- User management + invites
├── reviews/                        -- Engineer portal (anonymised)
│   ├── layout.tsx                  -- Minimal nav, engineer auth guard
│   ├── page.tsx                    -- Review queue
│   └── [id]/page.tsx               -- Single review (anonymised order)
├── api/
│   ├── auth/[...supabase]/route.ts
│   ├── orders/route.ts             -- CRUD
│   ├── orders/[id]/advance/route.ts -- Stage transitions
│   ├── orders/[id]/comms/route.ts  -- Log communication
│   ├── orders/[id]/quote/route.ts  -- Generate + send quote
│   ├── customers/route.ts
│   ├── search/route.ts             -- Full-text search endpoint
│   ├── users/route.ts
│   ├── users/invite/route.ts       -- Generate passphrase + send email
│   └── webhooks/stripe/route.ts    -- Stripe payment webhooks
└── components/
    ├── ui/                          -- Reusable: Badge, Button, Input, Section, StatCard
    ├── orders/                      -- OrderDetail, Pipeline, SLABar, SLABadge, QuotePreview
    ├── dashboard/                   -- KPICards, Charts, ActivityFeed, SLATable
    ├── customers/                   -- CustomerList, CustomerDetail, ConsentToggle
    └── auth/                        -- LoginForm, PasswordField, SetupForm
```

---

## Roles & Permissions (preserve exactly)

```typescript
const ROLES = {
  admin: {
    nav: ['home', 'search', 'sense', 'exceptions', 'pipeline', 'customers', 'ncrs', 'suppliers', 'risks', 'users'],
    canSee: { customer: true, finance: true, delivery: true, gdpr: true, notes: true, timeline: true, ncr: true, feedback: true, files: true, autoReview: true, senseCheck: true, engReview: true, custApproval: true, mfg: true, tos: true },
    canDo: { createOrder: true, advanceOrder: true, editOrder: true, senseCheck: true, raiseNcr: true, manageUsers: true, manageCustomers: true, runPipeline: true, editFiles: true },
  },
  engineer: {
    nav: ['eng_queue'],
    canSee: { files: true, autoReview: true, engReview: true },
    canDo: {},  // read-only, submits reviews via anonymised portal
  },
  auditor: {
    nav: ['home', 'search', 'pipeline', 'customers', 'ncrs', 'suppliers', 'risks'],
    canSee: { /* everything */ },
    canDo: {},  // fully read-only
  },
};
```

Enforce these with Supabase Row Level Security policies AND middleware route guards.

---

## Auth Requirements (NIST SP 800-63B-4)

These are non-negotiable. The prototype implements all of them — production must too.

1. **Minimum 15 characters**, maximum 64. No complexity rules (no forced uppercase/special/numbers).
2. **Blocklist screening** — check against HaveIBeenPwned Passwords API (k-anonymity model). Prototype uses a hardcoded list of ~28 entries.
3. **No mandatory periodic expiration** — only force change on compromise or first login.
4. **Account lockout** after 5 failed attempts for 15 minutes. Show remaining attempts.
5. **Session timeout** after 8 hours of inactivity.
6. **Passphrase-based invites** — admin creates user, system generates 4-word cryptographic passphrase (from 80-word dictionary), sends via Resend, user must change on first login.
7. **Admin never sees passwords** — only the initial passphrase on the invite confirmation screen.
8. **Credential reset** — admin triggers reset, new passphrase generated, user sees security warning on next login.
9. **Audit log** — every login, logout, lockout, password change, credential reset, account creation logged with timestamp and IP.
10. **Allow paste** in password fields (for password managers).
11. **Live validation** — real-time feedback on password requirements as user types. Strength meter based on length.

Use **bcrypt** (cost factor 12+) for password hashing server-side. The prototype uses SHA-256 as a browser demo.

---

## SLA Engine (preserve exactly)

Target hours per stage per service level:

| Stage | Standard | Priority | Express |
|-------|----------|----------|---------|
| Enquiry | 24h | 12h | 4h |
| Quoted | 72h | 48h | 24h |
| Accepted | 24h | 12h | 4h |
| Designing | 48h | 24h | 8h |
| Auto Review | 2h | 1h | 30m |
| Sense Check | 8h | 4h | 2h |
| Engineer Review | 24h | 12h | 4h |
| Customer Approval | 48h | 24h | 8h |
| Manufacturing | 72h | 48h | 24h |
| Shipped | 120h | 72h | 48h |
| Delivered | 24h | 12h | 8h |
| **Total** | **168h (7d)** | **96h (4d)** | **48h (2d)** |

Status logic: **On track** (green, <75% used), **At risk** (amber, 75-100%), **OVERDUE** (red, >100%).

Calculate from last timeline entry for current stage. Display SLA badges on pipeline cards, order detail (as progress bar), and dashboard SLA table sorted worst-first.

---

## Quote Generation (preserve exactly)

Tier-based pricing:
- T1: £499, T2: £599, T3: £749
- Service surcharge: Standard £0, Priority +£50, Express +£150
- Manufacturing estimate shown separately (billed at production)

Quote includes: branded Eisla header, customer details, project description, line-item table, 30-day expiry, T&Cs footer. Auto-logged as comms entry + timeline event.

---

## Communications Log (preserve exactly)

Per-order log with 8 types:
- email_out, email_in, phone_out, phone_in, meeting, note, quote, invoice

Each entry: type, subject, body, timestamp, logged-by user. Each comms entry also creates a timeline event. Search across comms content in the search view.

---

## Search (preserve exactly)

Full-text search across: order numbers, customer names, emails, companies, descriptions, notes, quote refs, comms subjects/bodies, timeline events.

Filters: stage, tier, payment status, service level, SLA status (overdue/at-risk/on-track/complete), date range.

Use PostgreSQL full-text search (`tsvector`/`tsquery`) for production. The prototype does naive string matching.

---

## Pipeline Stages (11)

```
enquiry → quoted → accepted → designing → auto_review → sense_check →
engineer_review (T2/T3 only, skipped for T1) → customer_approval →
manufacturing → shipped → delivered → complete
```

Stage transitions are button-driven by admins. Each transition logs to timeline. Engineer review is accessed via anonymised portal (engineer sees files + auto review results only, no customer data, no financials).

---

## Phase Plan

Work through these in order. Complete each phase before starting the next.

### Phase 1: Scaffold + Database
- `npx create-next-app@latest eisla-ops --typescript --tailwind --app --src-dir`
- Set up Supabase project, create all tables from schema above
- Set up Prisma/Drizzle, generate types
- Create seed script from prototype's SEED_SUP and SEED_RISKS data
- Set up environment variables (.env.local)

### Phase 2: Auth
- Supabase Auth with email/password
- Custom password validation (NIST rules) as server-side middleware
- Login, first-time setup, forced password change pages
- Passphrase generator (port the 80-word dictionary + crypto.getRandomValues)
- Invite flow with Resend email
- Account lockout logic (track in users table)
- Session timeout (8 hours)
- Audit log writes on every auth event
- Middleware route guards checking role permissions

### Phase 3: Layout + Navigation
- Sidebar component matching prototype (teal background, copper accents)
- Role-based nav filtering
- Badge counts (overdue orders, sense check queue, exceptions, engineer queue)
- User info + logout in sidebar footer
- Saved/saving indicator

### Phase 4: Dashboard + KPIs
- Stat cards: active orders, customers, revenue, pipeline value, SLA compliance, conversion rate, open NCRs, avg turnaround by tier
- Recharts: pipeline by stage (bar), revenue trend (bar), tier mix (pie)
- SLA alerts banner (overdue + at-risk orders)
- Sense check + exceptions alerts
- SLA status table (all active orders, sorted worst-first)
- Activity feed (last 12 timeline events across all orders)

### Phase 5: Pipeline + Orders
- Kanban board with SLA-coloured cards
- Order detail page with all sections (customer, service, payment, delivery, comms, files, auto review, timeline, notes)
- Stage advancement buttons with timeline logging
- Customer linking (select from customers table, sync address fields)
- Quote generation with branded preview
- Communications log (add + history)
- SLA progress bar per order

### Phase 6: Customers + GDPR
- Customer list with search
- Customer detail with contact fields
- GDPR consent toggles (email, SMS, phone, post, third party)
- Consent log (timestamped, shows who changed what)
- Data request tracking (SAR, erasure, rectification, portability, restriction, objection)

### Phase 7: Sense Check + Exceptions + Engineer Portal
- Sense check queue (orders at sense_check stage)
- Approve/flag with notes, auto-advance stage
- Exceptions list with resolve functionality
- Engineer portal: anonymised order view (files + auto review only)
- Engineer submits review outcome + comments

### Phase 8: NCR / Suppliers / Risks
- NCR register with CRUD, severity, status tracking
- Supplier register with scorecard fields
- Risk register with likelihood × impact matrix

### Phase 9: Search
- PostgreSQL full-text search with tsvector index
- Filter dropdowns: stage, tier, payment, service level, SLA, date range
- Results with SLA badges, comms count, clickthrough to order

### Phase 10: User Management
- User list with status badges (active, locked, invite pending)
- Invite new user (name, email, role → passphrase → Resend email)
- Resend invite, credential reset
- Edit user details (not password)
- Security audit log per user

### Phase 11: Stripe + Email
- Stripe Checkout for design fee collection
- Webhook handler for payment confirmation
- Auto-advance from quoted → accepted on payment
- Resend transactional emails: invite, quote, stage transitions, review assignment

### Phase 12: Deploy
- Vercel deployment
- Supabase production project
- Environment variables in Vercel dashboard
- Custom domain: ops.eisla.io

---

## Brand Constants

```
Teal:   #0E3D3F  (primary, sidebar, headings)
Copper: #C27840  (accents, CTAs, tier badges)
Cream:  #FDF8F0  (light backgrounds)
Light:  #E8F0F0  (section backgrounds)
```

Font: System sans-serif (Arial in prototype → Tailwind's default font stack is fine).

---

## File Types (order attachments)

13 file types tracked per order:
```
kicad_project, schematic, pcb_layout, gerbers, drill, bom, placement,
render_top, render_bottom, design_summary, erc_report, drc_report, customer_package
```

---

## Design Review Checklist (14 items)

Used by auto-review (all checked automatically) and sense-check (human verification):
```
Description reviewed, Schematic matches reqs, ERC passed (0), Components in stock,
PCB layout complete, DRC passed, Silkscreen correct, Board outline correct,
BOM verified, Gerbers generated, 3D render generated, All files in folder,
Design summary written, Eisla mark included
```

---

## Notes for Claude Code

1. **Do not simplify or remove features.** Every feature in the prototype exists for a reason. If something seems redundant, it isn't.
2. **Preserve the exact role permissions matrix.** Engineers must never see customer data or financials.
3. **The SLA targets are business-critical.** Don't approximate or round them.
4. **NIST password rules are non-negotiable.** No complexity requirements, no periodic expiration, 15-char minimum, blocklist, lockout.
5. **The prototype uses `uid()` for IDs** — replace with UUIDs from `crypto.randomUUID()` or Supabase's `gen_random_uuid()`.
6. **The passphrase dictionary is 80 specific words.** Port it exactly from the source file.
7. **Comms and timeline are separate concerns.** Comms are the human record (emails, calls, notes). Timeline is the system audit trail. A comms entry creates a timeline event, but not vice versa.
8. **Test each phase works before moving to the next.** Don't scaffold everything then debug.
9. **Use server components by default.** Only use `'use client'` where interactivity requires it (forms, charts, toggles).
10. **Keep the source file `eisla-ops-v6.jsx` in the repo root as reference.** Don't delete it until migration is verified complete.
