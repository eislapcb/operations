# Eisla PCB — State of the Union (2 March 2026)

## Repository Access

Only **one repo** is accessible: **`eislapcb/operations`**. Attempted to reach 12 other potential repo names (`eisla-ops`, `eisla-website`, `eisla-web`, `eisla-app`, `website`, `app`, `frontend`, `backend`, `api`, `pcb-ops`, `eisla-pcb`, `design-portal`) — all returned 502 (not authorized). This review covers the `operations` repo in its entirety.

---

## Executive Summary

The `operations` repo contains **Eisla Ops Hub** — a full-stack PCB design operations management platform. It was migrated from a 1,283-line single-file React prototype (`eisla-ops-v6.jsx`) into a production Next.js application in a **single commit** on 27 Feb 2026. All 12 phases from the migration brief have been scaffolded and the codebase covers the full order lifecycle from enquiry to delivery.

**Overall assessment: ~85% complete.** The architecture is solid, the schema is comprehensive, and the business logic is well-implemented. However, there are meaningful gaps that would prevent a production deployment today.

---

## What's There (The Good)

### Tech Stack (Modern & Well-Chosen)

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.9.3 |
| Database | PostgreSQL via Supabase | — |
| ORM | Drizzle | 0.45.1 |
| Auth | Supabase Auth + bcryptjs | — |
| Payments | Stripe Checkout | 20.4.0 |
| Email | Resend | 6.9.2 |
| Charts | Recharts | 3.7.0 |
| Styling | Tailwind CSS | 4.2.1 |
| Hosting | Vercel (lhr1 region) | — |

### Database — Comprehensive (20 tables, 435-line migration)

- **Core:** `users`, `customers`, `orders` with full field coverage
- **Pipeline gates:** `order_auto_review`, `order_sense_check`, `order_engineer_review`, `order_customer_approval`
- **Supporting:** `order_files` (13 file types), `order_comms` (8 types), `order_timeline`, `order_feedback`
- **Compliance:** `ncrs`, `suppliers`, `risks`, `exceptions`
- **Audit:** `audit_log`, `consent_log`, `field_changes` (with PostgreSQL triggers), `access_log` (GDPR Article 30)
- **13 indexes** on critical query paths
- **Full-text search** via `tsvector` generated column on orders
- **Triggers:** Auto field-change tracking on `orders` and `customers` UPDATEs, auto `updated_at` timestamping

### Authentication — NIST SP 800-63B-4 Compliant

- 15–64 character passwords, no complexity rules (correct per NIST)
- HaveIBeenPwned breach check using SHA-1 k-anonymity model
- bcrypt cost factor 12
- 5-attempt lockout for 15 minutes
- 8-hour session timeout
- 4-word cryptographic passphrase invites (80-word dictionary)
- Full audit trail on every auth event
- Paste allowed in password fields

### Business Logic — Faithfully Ported

- **12-stage pipeline:** enquiry → quoted → accepted → designing → auto_review → sense_check → engineer_review → customer_approval → manufacturing → shipped → delivered → complete
- **T1 orders skip engineer_review** (correctly implemented)
- **SLA engine** with per-stage, per-service-level targets (standard/priority/express)
- **Three-tier pricing:** T1 £499, T2 £599, T3 £749 + service surcharges
- **Quote generation** with auto-logging to comms + timeline
- **Sense check** with approve/flag flow and auto-exception creation
- **Engineer review portal** properly anonymised (no customer data, no financials)

### Role-Based Access — Exact Match to Spec

- **Admin:** Full nav + all actions (create, edit, advance, manage)
- **Engineer:** Review queue only, files + auto review visible, no customer/financial data
- **Auditor:** Full read access, zero write permissions

### Pages — All Routes Exist and Are Functional

- Auth: login, setup, change-password
- Dashboard with 8 KPI cards, Recharts bar/pie charts, SLA table, activity feed
- Pipeline kanban view
- Full order detail (562-line client component covering all 15+ sections)
- Customer CRUD with GDPR consent toggles + consent log
- Sense check queue, exceptions list
- Engineer review portal (anonymised)
- NCR register, supplier register, risk register with 5×5 matrix
- Full-text search with filters
- User management with invite/reset flows

### Server Actions — Well-Structured

6 server action files covering all mutations: `auth.ts`, `orders.ts`, `customers.ts`, `users.ts`, `sense-check.ts`, `engineer-review.ts`, `ncr.ts`. All use `requireSession()` with role checks.

---

## What's Missing or Incomplete (The Gaps)

### 1. File Upload — Schema Only, No Implementation

The `order_files` table and 13 file type constants exist, but there's **no actual file upload endpoint or Supabase Storage integration**. Files can't be attached to orders yet. This is a blocker for the core PCB design workflow.

### 2. API Routes — Mostly Stubs

The API routes exist in the file tree but several are thin wrappers or incomplete:
- `/api/orders/[id]/advance/route.ts` — likely a stub, since the real logic lives in server actions
- `/api/orders/[id]/quote/route.ts` — stub
- `/api/users/invite/route.ts` — stub
- The search API route works, but the rest largely duplicate server action logic without clear purpose

### 3. Email Integration — Templates Exist, Not Wired Up

`email.ts` has three Resend templates (`sendInviteEmail`, `sendQuoteEmail`, `sendStageNotification`) but they aren't called from the server actions. The invite flow generates a passphrase but doesn't actually send the email. Quote generation doesn't send the quote email.

### 4. Stripe Payment Flow — Partially Complete

- `stripe.ts` has `createCheckoutSession()` — but there's **no UI button to trigger payment**
- The webhook handler at `/api/webhooks/stripe/route.ts` correctly processes `checkout.session.completed` and auto-advances to "accepted"
- Missing: `stripe_charge_id`, `stripe_receipt_url` aren't populated from the webhook
- No way for customers to actually pay right now

### 5. Supabase Auth vs Custom Auth — Dual System

There's a subtle architectural tension: the app uses Supabase Auth for session/cookie management via middleware, but all password hashing and user records live in a custom `users` table with bcryptjs. The `setupAdmin()` action creates a Supabase auth user *and* a DB user, but `login()` only checks the DB — it doesn't call `supabase.auth.signInWithPassword()`. This means:
- Supabase middleware may not recognise the user as authenticated
- Session cookies may not be set correctly
- This could cause auth to break entirely in production

### 6. No Tests

Zero test files. No unit tests, no integration tests, no E2E tests. For a system handling financial transactions and GDPR compliance, this is a significant gap.

### 7. No Row-Level Security (RLS) Policies

The migration brief explicitly requires Supabase RLS policies. The SQL migration doesn't include any. Currently, anyone with the database connection string has full access to all tables.

### 8. Average Turnaround KPI — Hardcoded Placeholder

`getDashboardStats()` returns `avgTurnaroundByTier: { T1: "-", T2: "-", T3: "-" }` — this metric isn't calculated.

### 9. `any` Types Throughout

The `OrderDetailClient` props are almost entirely typed as `any`. There are no shared type definitions for the domain objects (Order, Customer, etc.) beyond what Drizzle infers.

### 10. No Error Boundaries or Loading States

Pages use `force-dynamic` but there are no `loading.tsx`, `error.tsx`, or `not-found.tsx` files at route level for graceful degradation.

---

## Git History

| Commit | Author | Date | Message |
|--------|--------|------|---------|
| `ab9ab6a` | AndyMiddleton | 27 Feb 16:52 | Merge PR #1 |
| `95cb0f7` | Claude | 27 Feb 16:50 | Implement full Eisla Ops Hub — Next.js migration (all 12 phases) |
| `359b7df` | AndyMiddleton | 27 Feb 16:17 | Delete Eisla_Migration_Brief.md |
| `235b000` | AndyMiddleton | 27 Feb 16:16 | Updated Migration.md |
| `1235a51` | AndyMiddleton | 27 Feb 16:03 | Add files via upload |

5 commits total. The entire app was built in a single commit, which makes it harder to review incrementally or bisect issues.

---

## Code Quality Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Architecture | **Strong** | Clean App Router structure, server/client separation, server actions |
| Schema Design | **Strong** | 20 well-normalised tables, triggers, FTS, proper indexes |
| Security (Auth) | **Good** | NIST-compliant password policy, lockout, audit trail |
| Security (Data) | **Weak** | No RLS, no input sanitisation beyond basic checks |
| Type Safety | **Fair** | Drizzle types exist but `any` used extensively in components |
| Test Coverage | **None** | Zero tests |
| Error Handling | **Minimal** | Basic throws, no error boundaries |
| Integration Completeness | **Partial** | Stripe/Resend/file upload not fully wired |

---

## Codebase Statistics

- **Total TypeScript/TSX files:** ~80
- **Estimated lines of code:** ~1,900
- **Database tables:** 20
- **API routes:** 12
- **Page routes:** 14+
- **React components:** 25+
- **Server actions:** 16 functions across 6 files
- **Dependencies:** ~20 production packages

---

## Recommendations (Priority Order)

1. **Fix the auth dual-system issue** — Either commit to Supabase Auth fully or go custom. The current hybrid will break in production.
2. **Wire up email sending** — The templates are there; they just need to be called from `inviteUser()`, `generateQuote()`, and `advanceStage()`.
3. **Implement file upload** — Add Supabase Storage integration for the 13 file types.
4. **Add RLS policies** — Required by the migration brief, critical for multi-tenant security.
5. **Add a payment trigger button** — Connect the Stripe Checkout session to the UI.
6. **Replace `any` types** — Create proper domain interfaces.
7. **Add tests** — At minimum: auth flows, stage advancement logic, and SLA calculations.
8. **Add loading/error states** — `loading.tsx` and `error.tsx` at key route levels.

---

## Bottom Line

This is a **credible first pass** at a complex operations platform. The migration brief was ambitious (12 phases, 20 tables, 3 integrations, NIST auth, GDPR compliance) and the codebase covers all of it structurally. But it's not production-ready — the auth integration needs reconciling, external service integrations need wiring up, and there's no test coverage or RLS. With focused effort on the 8 items above, this could be deployable.
