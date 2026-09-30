# Samis Online

## Context

White-label money transfer experience for **Samis Online**, a UK-based Nigerian e-commerce business. The "Send Money" journey is embedded inside their branded web experience, powered by **Mito.Money**. Users must feel they never left the partner website.

## Rules

- Always ask queries one by one if confused or need clarity.
- Ask before implementing if you have a suggestion.
- UI/UX must always be world-class, modern, and premium.
- Every new page or element must match the default theme.
- Always show proper messaging (popup/toast) after any submission or processing.
- Mind back buttons for returning to previous step/screen.
- Always keep close/abort button on popups unless they are mandatory modals.
- Always plan before coding and get approval if it is a suggestion.
- Screenshots can be shared, but always mind the theme/colour and fintech logic/flow before implementing.
- Mind functionality and effects across the app when adding or changing anything — don't break existing flow/functionality.

## Git Workflow

1. **Branch before changes:** Clear branch name (e.g., `feature/add-UI-validation`, `fix/payment-amount-display`).
2. **Run all tests:** Unit, integration, and E2E before committing.
3. **Open a Pull Request:** Push branch, open PR to merge into main.
4. **Review before merge:** PR must include a review step.
5. **Delete branch after merge:** Locally and remotely.
6. **Monitor after merge:** Roll back or fix in a new branch if issues arise.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript |
| Build | Vite 6 |
| Routing | Wouter 3 (NOT React Router) |
| Server State | TanStack React Query 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York style) |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod validation |
| Icons | Lucide React |
| Backend | Express.js + TypeScript (via tsx) |
| Database | PostgreSQL + Drizzle ORM |
| Session Auth | express-session + connect-pg-simple |
| E2E Testing | Playwright |
| Unit Testing | Vitest + Testing Library |

## Project Structure

```
client/src/
  components/ui/    # shadcn/ui primitives — add via CLI, do NOT edit manually
  components/       # App-level shared components (modals, layout, etc.)
  pages/            # Route page components
  hooks/            # Custom React hooks (use-toast, use-mobile)
  lib/queryClient.ts # apiRequest(), getQueryFn(), queryClient config
  lib/utils.ts      # cn() utility (clsx + tailwind-merge)
  data/             # Static data (knownSenders, payoutAccounts)
  index.css         # Theme CSS variables and Tailwind base
  App.tsx            # Root: ErrorBoundary → QueryProvider → Router

server/
  index.ts          # Express server entry point
  routes.ts         # API route definitions
  vite.ts           # Vite dev middleware integration

shared/
  schema.ts         # Drizzle ORM schema + Zod insert schemas

tests/e2e/          # Playwright E2E specs (.spec.js)
```

## Path Aliases

Configured in `tsconfig.json` — always use these, never cross-boundary relative paths:

- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`

## Coding Conventions

### Components

- Functional components with TypeScript interfaces for props
- shadcn/ui components live in `components/ui/` — add new ones via shadcn CLI
- Use CVA (`class-variance-authority`) for component variants
- Use `cn()` from `@/lib/utils` to merge Tailwind classes

### State Management

- **Server state:** TanStack Query (`useQuery`, `useMutation`) — never store API data in local React state
- **Local UI state:** `useState` / `useReducer`
- Query client uses `staleTime: Infinity` — invalidate manually after mutations

### API Patterns

```typescript
// Queries — queryKey doubles as the URL
import { getQueryFn } from "@/lib/queryClient";
useQuery({
  queryKey: ["/api/endpoint"],
  queryFn: getQueryFn({ on401: "returnNull" }), // or "throw"
});

// Mutations
import { apiRequest } from "@/lib/queryClient";
const res = await apiRequest("POST", "/api/endpoint", body);
```

All requests use `credentials: "include"` for session cookies.

### Forms

- React Hook Form + `@hookform/resolvers/zod` for validation
- Use shadcn `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormMessage>`
- Define Zod schemas in `shared/schema.ts` using `drizzle-zod` when tied to DB

### Styling

- **Tailwind CSS only** — no inline styles, no CSS modules
- Theme variables in `client/src/index.css` — use via `hsl(var(--variable))`
- Always use shadcn color tokens: `primary`, `secondary`, `muted`, `accent`, `destructive`
- Headings: `font-display` (Plus Jakarta Sans) / Body: `font-sans` (Inter)

### Animation

- Framer Motion for page transitions and micro-interactions
- Keep animations subtle and premium — no flashy or distracting motion

### Routing

- **Wouter** (`Switch`, `Route`, `useLocation`, `useRoute`)
- All routes defined in `App.tsx`

### Toasts & Feedback

- Use `useToast()` from `@/hooks/use-toast` — Toaster is already mounted in App.tsx
- Always show a toast after: form submissions, API errors, state changes

## Theme

```css
--primary: 268 48% 34%;           /* Brand purple — main logo oval */
--destructive: 348 81% 42%;       /* Red — errors / warning states */
--teal: 144 78% 36%;              /* Green — success / positive actions */
--purple: 272 55% 28%;            /* Deep purple — secondary brand accent */
--accent: 48 92% 52%;             /* Gold/yellow — ONLINE text highlight */
--background: 270 25% 97%;        /* Soft lavender-white page background */
--card: 0 0% 100%;                /* Card surfaces */
--foreground: 270 20% 12%;        /* Main text */
--muted: 270 16% 92%;             /* Soft muted surfaces */
--border: 270 14% 85%;            /* Borders / dividers */
--input: 270 14% 85%;             /* Input border/background */
--ring: 268 48% 34%;              /* Focus ring */
--radius: 0.75rem;                /* Base border radius */
```

Fonts: `Plus Jakarta Sans` (display), `Inter` (body). See `components.json` for full shadcn/ui config.

## Testing

### E2E (Playwright) — run from project root, dev server must be running

```bash
npx.cmd playwright test --reporter=line          # Full suite
npx.cmd playwright test tests/e2e/dashboard.spec.js  # Single file
npx.cmd playwright test --ui                      # Debug UI mode
```

### Unit Tests (Vitest)

```bash
cd client && npx vitest run    # Single run
cd client && npx vitest        # Watch mode
```

### Pre-commit — always run before git commit

```bash
npx.cmd playwright test --reporter=line
```

---

## Business Goal

Build a white-label, partner-branded money transfer flow that allows customers to:

- Start a money transfer from the partner website
- Go through MITO-powered KYC/profile creation if required
- Complete the transfer within a partner-branded embedded experience
- Optionally use partner loyalty points as part of payment (later phase)
- Eventually use MITO as a checkout/payment option in the partner's commerce flow (separate integration path)

### Two Types of KYC

1. **Mini KYC:** Country, First name, Last name, DOB, Address Line 1 (mandatory), Address Line 2 (optional), City, PIN/ZIP/POST Code, Phone (optional)
2. **Full KYC:** When threshold is hit — ID document upload + Selfie liveness check

After adding the beneficiary/recipient (narration/TXN remarks is optional but mandatory for Nigerian beneficiaries), the Sender reviews the Transaction and Pays using a selected payment method.

**Additional features:** Receiving/requesting payments, GroupPay funding campaigns, bonuses and discounts, collection accounts, managing recipients/beneficiaries and senders, help tickets, and notifications (bell + PUSH).

### Supported Currencies & Countries

**Currencies:** GBP, USD, EUR, NGN, CAD, AUD, JPY, CNY, INR, ZAR, KES, GHS, AED

**Countries:** UK, USA, Nigeria, Canada, Ghana, Kenya, South Africa, Germany, France, India, China, UAE

## 1) Phase 1 Scope

### In Scope

- Partner-branded entry point for sending money
- Branded shell/layout that feels like the partner website
- Transfer initiation flow
- MITO KYC/profile collection flow where needed
- Transfer details and review flow
- Payment selection flow
- Success/confirmation flow
- Route back to partner website/store
- Responsive design, web-first but mobile-friendly
- Clean component structure for later extension

### Out of Scope (design for future support)

- Full partner checkout integration using MITO as a payment option
- Full loyalty points redemption implementation
- Major backend rebuilds
- Deep redesign of the partner's full website header/navigation system

## 2) Delivery Priority

1. **Priority 1:** White-label money transfer flow
2. **Priority 2:** MITO as a payment option in the partner checkout flow
3. **Priority 3:** Loyalty points / wallet-backed payment using partner points

## 3) Product Principles

- User must feel they are still on the partner website
- UI preserves partner branding at the top level
- MITO-powered journey sits beneath the partner shell/frame
- Experience is modern, clean, trustworthy, and consumer-friendly
- UI is responsive and usable on both desktop and mobile
- Journey avoids confusion around leaving the partner site
- Clear route back: "Go back to shopping" or "Return to store"

## 4) Functional Scope (Phase 1)

### A. Entry Point
- CTA: "Send Money Home"
- Enter the transfer journey from the partner-branded context

### B. White-Label Shell
- Top area: partner brand/logo/header-style zone
- Main content area: MITO-powered flow
- Return action back to partner site/store

### C. Customer Onboarding / KYC
- Collect KYC/profile/registration details within MITO flow when required
- Create MITO-side customer profile
- Guided path: initiation → KYC → transfer completion

### D. Transfer Journey
- Transfer amount input
- Destination/recipient-related flow
- Rate/quote visibility
- Transfer review and confirmation

### E. Payment
- Payment method step
- Architecture supports later addition of partner points as a payment source

### F. Confirmation
- Success state
- Transaction confirmation summary
- Route back to partner/store

## 5) Future Scope (Design For)

### A. MITO as Checkout Payment Option
Users select Mito.Money during checkout as a payment option. Data may be collected by partner and passed to MITO, or MITO may ask the user to confirm details.

### B. Loyalty Points / Points Redemption
- Show available points and point-to-currency value
- Let users choose to use points in payment
- Debit equivalent value on backend
- Record audit trail and transaction history tied to user ID and transaction

## 6) Screens List

| Screen | Key Elements |
|--------|-------------|
| Partner Entry / Landing | CTA: Send Money Home, partner branding visible |
| Transfer Start | Transfer intro, amount initiation, optional rate/benefit teaser |
| Sign-In / Identity Handoff | Only if needed, flexible design (session strategy TBD) |
| KYC / Registration | Personal details, address/compliance fields, onboarding |
| Transfer Details | Amount, route/recipient/payout details |
| Quote / Review | Fees, rate, total, receive amount, summary before payment |
| Payment Method | Initial methods + architecture placeholder for points |
| Confirmation | Transaction confirmation, summary, back-to-store CTA |
| Error / Retry States | Failed validation, session handoff, payment, recoverable nav |
| Responsive Mobile Variants | Mobile layouts for all above |

## 7) User Flow (Phase 1)

1. User is on partner website
2. User clicks "Send Money Home"
3. User enters partner-branded money transfer shell
4. User begins transfer
5. If not onboarded/verified → MITO-side KYC/profile setup
6. User continues with transfer details
7. User reviews summary
8. User chooses payment method
9. User confirms transaction
10. User sees success/confirmation
11. User can return to partner website/store

### Future User Flow (Points)

1. User reaches payment stage
2. System displays available points and conversion value
3. User selects whether to use points
4. System applies points value toward payment
5. System records wallet/points debit trail and transaction mapping

## 8) Technical Assumptions

- Primarily a frontend / integration project
- Most core MITO capability already exists
- Backend work should be minimal
- White-label flow sits under a partner subdomain or branded path
- Partner has its own existing login/session model
- MITO may still require its own KYC/customer profile creation
- Identity/session handoff model is not fully final — implementation must stay modular
- Payment methods may evolve later
- Partner points logic comes later — should not be hardcoded into first build
- Reusable theming/config should support additional future white-label partners

## 9) Architecture Notes

Keep these concerns **separate**:

- Branding shell/layout
- Identity/session handoff
- KYC/onboarding flow
- Transfer flow
- Payment flow
- Confirmation flow
- Future points module
- Future checkout-integration module

The codebase must make it easy to switch between mock services and real APIs.

## 10) UX Notes

- Keep the experience premium and polished
- Use simple language
- Keep financial information prominent and easy to scan
- Make navigation clear
- Keep step transitions intuitive
- Avoid abrupt change of brand context
- Preserve user trust through clean confirmation and review states
- Ensure mobile responsiveness (web-first priority)

## 11) Build Instructions

### Do

- Create a clean, modular frontend architecture
- Create reusable layout and screen components
- Make partner branding configurable
- Include mocks/stubs for unresolved backend endpoints
- Structure the app for additional flows later
- Optimise for UAT/demo readiness
- Create realistic empty/loading/error states
- Include basic validation and screen-to-screen state continuity
- Include a configuration layer for:
  - Partner name
  - Logo/header content
  - Return URL
  - Feature flags for points and checkout integration

### Don't

- Hardcode the final session model
- Tightly couple the UI to one partner only
- Over-engineer backend logic that already exists elsewhere
- Build points redemption as a fixed first-phase dependency
- Build a generic remittance app divorced from white-label needs

## 12) Suggested Folder/Module Structure

| Module | Purpose |
|--------|---------|
| `shell/` | Layout, branding, navigation container |
| `onboarding/` | KYC/profile flow |
| `transfer/` | Send-money journey |
| `payments/` | Payment method step |
| `points/` | Future points redemption logic |
| `shared/` | UI components, validation, state models |
| `config/` | Partner branding and feature toggles |
| `mocks/` | API mocks and UAT data |

## 13) Acceptance Criteria (Phase 1)

A good first deliverable allows a stakeholder to:

- [ ] Open the partner-branded web flow
- [ ] See clear partner identity
- [ ] Start a transfer
- [ ] Move through onboarding/KYC (mock or integrated)
- [ ] Review and confirm a transfer
- [ ] Reach a confirmation screen
- [ ] Navigate back to partner/store
- [ ] View a responsive version on mobile
