# Common Ground — Engineering Handover

## What This App Does

Common Ground is a conflict-resolution tool. Person A starts a case and shares an invite link with Person B. Each party privately chats with an AI intake assistant. Once both complete their intake, the server decrypts both submissions, sends them to OpenAI, and produces a shared neutral report — neither party ever sees the other's raw words.

---

## Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server components + route handlers in one repo |
| Language | TypeScript (strict mode) | Catches bugs at compile time; `noUncheckedIndexedAccess` enforced |
| Styling | Tailwind CSS | Utility-first; design tokens (colours, spacing) in `tailwind.config.ts` |
| Database | Supabase (Postgres) | Managed Postgres with row-level security; accessed server-side only |
| AI | OpenAI GPT-4o | Structured JSON output for intake summaries and mediation reports |
| Auth | `jose` (JWT) | HttpOnly session cookies; no user accounts — token-based access |
| Encryption | Node `crypto` (AES-256-GCM) | Field-level encryption of all private text before DB storage |
| Notifications | WhatsApp Cloud API + Resend | Invite delivery; email as fallback |
| Validation | Zod | Runtime schema validation on all API inputs and AI outputs |
| Unit tests | Vitest | Fast, Jest-compatible; no DOM needed for library tests |
| E2E tests | Playwright | Full browser journey against the running dev server |
| Deploy | Vercel | Zero-config Next.js hosting |

---

## Project Structure

```
src/
├── app/                        # Next.js pages and API routes
│   ├── page.tsx                # Landing page
│   ├── start/                  # Case creation form
│   ├── invite/[token]/         # Person B invitation acceptance
│   ├── case/[reference]/
│   │   ├── intake/             # AI chat UI
│   │   ├── waiting/            # Polls for report readiness
│   │   ├── report/             # Shared neutral report
│   │   ├── agreement/          # Per-agreement response form
│   │   └── feedback/           # Post-resolution feedback
│   └── api/                    # All route handlers (server-only)
│       ├── cases/              # Create case, trigger analysis
│       ├── invitations/        # Validate + accept invite token
│       └── intake/             # Chat messages, history, complete
└── lib/                        # Shared server-side modules
    ├── ai/                     # OpenAI prompts and callers
    ├── auth/                   # JWT session creation + verification
    ├── crypto.ts               # AES-256-GCM encrypt/decrypt
    ├── tokens.ts               # Secure token generation + hashing
    ├── notifications/          # WhatsApp + email providers
    ├── db/                     # Supabase client + TypeScript types
    └── validation/schemas.ts   # Zod schemas for all API inputs
```

---

## How the Pieces Connect

### 1. Access control (no accounts)
When Person A creates a case, the server generates two random 32-byte tokens — one for Person A and one for the invite link. Only the SHA-256 hashes of these tokens are stored in the database. On first use, each token is exchanged for a signed JWT session cookie (HttpOnly, SameSite=Strict). Every subsequent API call is authenticated via that cookie.

### 2. Private intake
Each message is encrypted with AES-256-GCM (unique IV per value) before being written to the `intake_messages` table. The encryption key lives only in `SUBMISSION_ENCRYPTION_KEY` on the server — never in the database or client bundle. Decryption happens only inside `src/lib/crypto.ts`, which is never imported from a client component.

### 3. Analysis trigger
When both participants mark their intake complete, the server atomically flips the case status from `ready_for_analysis` → `analysing` (a single `UPDATE … WHERE status = 'ready_for_analysis'` prevents double-runs). The server then decrypts both submissions in memory, builds a single mediation prompt, calls OpenAI, validates the JSON response with Zod, and stores the result. The raw decrypted text is never logged or persisted outside this pipeline.

### 4. Safety gate
Every AI report includes a `safetyCategory` field. If it matches any of the four sensitive categories (`possible_coercion_or_abuse`, `possible_self_harm_or_violence`, `possible_child_safety_issue`, `legal_or_professional_support_needed`), the report page routes to `SafetyScreen` — which shows crisis resources and skips all mediation advice.

### 5. Notifications
`src/lib/notifications/index.ts` wraps both providers behind a common interface. On case creation, a WhatsApp message is attempted first; if unconfigured, it falls back to email via Resend; if neither is configured, the invite link is printed to the server console (demo behaviour). Notification failures are logged to the `notification_logs` table but never thrown to the caller.

---

## Key Files to Know

| File | What it does |
|---|---|
| `src/lib/crypto.ts` | All encryption/decryption — touch with care |
| `src/lib/auth/session.ts` | JWT creation, verification, cookie management |
| `src/lib/ai/intakePrompt.ts` | System prompt for the AI intake conversation |
| `src/lib/ai/mediationPrompt.ts` | System prompt + Zod schema for the shared report |
| `src/lib/ai/mockReport.ts` | Demo mode mock — returned instead of calling OpenAI |
| `src/app/api/cases/[id]/analyse/route.ts` | The analysis pipeline — most critical API route |
| `supabase/migrations/001_initial_schema.sql` | Full DB schema: 8 tables, RLS enabled, all indexes |
| `tailwind.config.ts` | All design tokens (colours, type scale, spacing) |
| `.env.example` | Every environment variable with descriptions |

---

## Production Readiness Checklist

### Infrastructure
- [ ] Create a Supabase project (paid plan recommended for production SLAs)
- [ ] Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor
- [ ] Enable Row Level Security on all tables (migration does this; verify in Supabase dashboard)
- [ ] Create a Vercel project linked to your GitHub repository

### Secrets
- [ ] Generate `SUBMISSION_ENCRYPTION_KEY`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Generate `SESSION_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
- [ ] Generate `CRON_SECRET`: any strong random string
- [ ] Add all variables from `.env.example` to Vercel → Settings → Environment Variables
- [ ] Set `DEMO_MODE` to `false` (or remove it entirely)
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain (used in invite links)

### OpenAI
- [ ] Create an API key at [platform.openai.com](https://platform.openai.com/api-keys)
- [ ] Set a spend limit on the OpenAI account
- [ ] Add `OPENAI_API_KEY` to Vercel environment variables
- [ ] Optionally set `OPENAI_MODEL` (default is `gpt-4o`)

### WhatsApp notifications
- [ ] Create a Meta for Developers app with the WhatsApp product enabled
- [ ] Register and verify a phone number in the WhatsApp manager
- [ ] Copy the Phone Number ID → `WHATSAPP_PHONE_ID`
- [ ] Generate a System User permanent token → `WHATSAPP_ACCESS_TOKEN`
- [ ] Submit for Meta app review to message users outside the test list (required for production)

### Email fallback (Resend)
- [ ] Create a [Resend](https://resend.com) account
- [ ] Verify your sending domain in Resend
- [ ] Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to Vercel

### Pre-launch checks
- [ ] Run `npm run typecheck` — zero errors
- [ ] Run `npm run lint` — zero errors
- [ ] Run `npm run build` — successful production build
- [ ] Run `npm run test` — all 42 unit tests pass
- [ ] Run `npm run test:e2e` against a staging environment with a real DB
- [ ] Verify the full journey end-to-end: create case → intake → invite Person B → intake → report → agreement
- [ ] Confirm invite links use `NEXT_PUBLIC_APP_URL` (not `localhost`)
- [ ] Confirm session cookies are `Secure` and `HttpOnly` in browser dev tools
- [ ] Confirm no private text appears in server logs
- [ ] Review and update `/privacy`, `/terms`, and `/safety` pages with real legal copy
- [ ] Add a custom domain in Vercel and enable HTTPS (automatic with Vercel)
