# Common Ground — Implementation Plan

## Status Legend
- [ ] Pending
- [x] Complete
- [~] In progress

---

## Phase 1: Project Setup
- [x] Inspect Stitch exports (8 screens: landing, start, intake-intro, intake-chat, review-consent, invitation-ready, invitation-received, shared-report)
- [~] Scaffold Next.js 15 App Router project in current directory
- [~] Configure TypeScript strict mode, Tailwind CSS (with Stitch design tokens), ESLint, Prettier
- [~] Create `.env.example` with all required variables
- [~] Create `IMPLEMENTATION_PLAN.md` (this file)

## Phase 2: Database (Supabase)
- [ ] Create `supabase/migrations/001_initial_schema.sql` — all tables: cases, participants, intake_messages, submissions, analyses, agreements, notification_logs, audit_events
- [ ] Create `src/lib/db/types.ts` — TypeScript types matching DB schema
- [ ] Create `src/lib/db/client.ts` — Supabase client (server + browser)
- [ ] Create `src/lib/db/queries/` — typed queries per domain

## Phase 3: Core Security Modules
- [ ] `src/lib/crypto.ts` — AES-256-GCM encrypt/decrypt with unique IV
- [ ] `src/lib/tokens.ts` — cryptographically secure token generation, SHA-256 hashing, expiry
- [ ] `src/lib/auth/participant.ts` — participant session via HttpOnly cookies, server-side validation
- [ ] `src/lib/validation/` — Zod schemas for all inputs
- [ ] `src/lib/env.ts` — startup env validation

## Phase 4: AI Modules
- [ ] `src/lib/ai/intakePrompt.ts` — versioned, server-only intake system prompt
- [ ] `src/lib/ai/mediationPrompt.ts` — versioned analysis system prompt + safety categories
- [ ] `src/lib/ai/intake.ts` — streamed intake conversation service
- [ ] `src/lib/ai/analysis.ts` — analysis service with Zod-validated structured output
- [ ] `src/lib/ai/mockReport.ts` — demo mode mock report

## Phase 5: Notification Modules
- [ ] `src/lib/notifications/interface.ts` — NotificationProvider interface
- [ ] `src/lib/notifications/whatsapp.ts` — Meta WhatsApp Cloud API implementation
- [ ] `src/lib/notifications/email.ts` — Resend email implementation
- [ ] `src/lib/notifications/index.ts` — fallback chain; logs in dev if no credentials

## Phase 6: API Routes (Route Handlers)
- [ ] `POST /api/cases` — create case, generate tokens, establish initiator session
- [ ] `GET /api/invitations/[token]` — validate recipient invitation token
- [ ] `POST /api/invitations/[token]/accept` — accept invitation, establish recipient session
- [ ] `POST /api/intake/message` — submit intake message (auth-gated, encrypted storage)
- [ ] `POST /api/intake/complete` — finalise intake, store encrypted summary
- [ ] `POST /api/cases/[id]/analyse` — trigger analysis (CRON_SECRET or participant-gated)
- [ ] `GET /api/cases/[id]/status` — participant-safe status (no cross-participant data)
- [ ] `GET /api/cases/[id]/report` — shared report (requires both intakes complete)
- [ ] `POST /api/cases/[id]/report/feedback` — submit report feedback
- [ ] `POST /api/cases/[id]/agreement` — submit agreement response
- [ ] `POST /api/notifications/whatsapp` — server-only webhook handler

## Phase 7: UI Pages (App Router)
- [ ] `/` — landing page (from Stitch landing screen)
- [ ] `/start` — conversation creation form (from Stitch start screen)
- [ ] `/case/[reference]/intake` — intake intro → chat → review → consent (from Stitch intake screens)
- [ ] `/invite/[token]` — recipient invitation (from Stitch invitation-received screen)
- [ ] `/case/[reference]/waiting` — status/waiting screen (from Stitch invitation-ready screen)
- [ ] `/case/[reference]/report` — shared report (from Stitch shared-report screen)
- [ ] `/case/[reference]/agreement` — agreement commitments
- [ ] `/case/[reference]/feedback` — report feedback form
- [ ] `/privacy`, `/terms`, `/safety` — informational pages

## Phase 8: Tests
- [ ] Unit: crypto encrypt/decrypt round-trip
- [ ] Unit: token generation uniqueness + hashing + expiry
- [ ] Unit: participant authorisation (valid/expired/wrong token)
- [ ] Unit: analysis Zod schema validation
- [ ] Unit: safety category branching
- [ ] Unit: notification provider fallback logic
- [ ] Unit: cross-participant data isolation (A cannot see B's submission)
- [ ] Playwright E2E: full journey (A creates → A intake → B accepts → B intake → analysis → report)
- [ ] Playwright E2E: expired invitation rejected
- [ ] Playwright E2E: B cannot see A's raw intake via UI or API

## Phase 9: Build & Verify
- [ ] Run `npm run lint` — fix all errors
- [ ] Run `npm run typecheck` — fix all TypeScript errors
- [ ] Run `npm run test` — fix all unit test failures
- [ ] Run `npm run build` — production build succeeds
- [ ] Run `npm run test:e2e` — primary Playwright test passes

## Phase 10: Documentation
- [ ] `README.md` — setup, env vars, OpenAI API key instructions, deployment
- [ ] `supabase/SETUP.md` — Supabase migration instructions
- [ ] `docs/THREAT_MODEL.md` — brief threat model
- [ ] Mermaid data-flow diagram in README

---

## Architecture Decisions

### Token-based access (no full accounts for MVP)
- Person A gets `initiator_token` → stored hashed in `participants`
- Person B gets `recipient_invitation_token` → stored hashed in `cases`
- After token validation → HttpOnly cookie `cg_session` with JWT containing `{participantId, caseId, role}`
- Cookie: Secure, SameSite=Strict, HttpOnly, 7-day expiry

### Encryption
- AES-256-GCM with 96-bit IV, 128-bit auth tag
- Key from `SUBMISSION_ENCRYPTION_KEY` env var (hex-encoded 32 bytes)
- Each field encrypted independently with unique IV
- IV stored as hex alongside ciphertext

### Demo Mode
- `DEMO_MODE=true` → seeds DB with sample case, uses mock OpenAI report
- Invitation URL printed to terminal (not sent via WhatsApp)
- Clearly labelled "DEMO" banner in UI

### Safety
- Classify before producing advice
- Categories: ordinary_conflict | high_conflict | possible_coercion_or_abuse | possible_self_harm_or_violence | possible_child_safety_issue | legal_or_professional_support_needed
- Safety categories 3-6 → no "meet in the middle" advice, show safety screen

### Analysis
- Runs server-side only via protected route
- Single analysis per case (atomic status update)
- Retry-safe: check `status !== 'analysing'` before starting
- Structured output validated against Zod schema before storage
