# Amni-Test: product spec

Amni-Test pays real people to test Android apps in Google Play closed testing. A developer pays per tester. A tester is paid for staying opted in for 14 days and filing feedback. Each tester's reputation sets their price.

- **Web:** `amni-scient.com/test/` (static pages in `/test/`)
- **API:** Cloudflare Worker `amni-test` with D1 (`/workers/amni-test/`)
- **SDK:** Android library that confirms installs and daily use (`/sdk/amni-test-android/`)

The legal pages in `/test/terms.html` and `/test/privacy.html` are drafts. Have a lawyer review them before launch.

## 1. Why it exists, and the line it does not cross

New personal Google Play developer accounts need at least 12 testers opted in to a closed test for 14 days in a row before they can publish. Amni-Test sells **testing**, not installs:

- Testers are paid for completing a 14-day test with feedback. A download alone pays nothing.
- Testers are never paid for Play Store ratings or reviews, and the product never asks for them. Closed-test feedback goes to the developer privately.
- The marketplace is a website, not an app on Google Play.
- "Helpful" votes ask whether the feedback helped the developer fix or improve the app, not whether it was positive.

## 2. Accounts

- Users sign in with Google. The verified Google email is the address the developer adds to the closed test, so one Amni-Test account maps to one Google account.
- The same account can test and post apps. Admins are listed in `ADMIN_EMAILS`.
- Before taking a test, a tester confirms they are 18 or older. Stripe checks identity before the first payout.

## 3. A test from start to finish

| State | How it gets there | Who acts next |
|---|---|---|
| `accepted` | The tester takes an open slot, and the slot's price is reserved from the campaign budget | The developer adds the tester's email in Play Console and marks them **invited**. After 72 h the slot is released, with no penalty to anyone |
| `invited` | The developer marks the tester invited | The tester opts in through the Play testing link, installs with their referrer link, and presses **Started**. After 72 h it becomes `no_show` (−2 demerits) |
| `active` | The tester presses **Started**, or the SDK reports the install code first | Day 0 is the start time |
| `completed_pending` | It is day 14 or later and the day-14 check-in is in | The developer can **confirm** or **dispute**. After 72 h it is confirmed automatically |
| `completed` | Confirmed by the developer, automatically, or by an admin | The tester is paid |
| `exit_pending` | The tester leaves with an app-fault reason | The developer has 72 h to dispute, or the exit is excused automatically |
| `excused` | The exit is accepted | The tester gets pro-rata pay and no demerit. The developer gets a demerit |
| `exited` | An unexcused exit, an exit whose dispute an admin upheld, or no check-in at all by day 16 | The tester gets −5 demerits and no pay |
| `removed` | The tester's account was terminated | Pay for days done, unless the reason was fraud |

**Check-ins** (feedback forms) are due in three windows. Each check-in records what worked, what broke and the device.

| Check-in | Window (days since start) |
|---|---|
| Day 1 | days 0–2 |
| Day 7 | days 6–8 |
| Day 14 | days 13–16 |

- A missed window costs −1 demerit and one third of the pay.
- If no check-ins at all are in by the end of day 16, the test counts as an unexcused exit.

**SDK verification.** A campaign can require the SDK (`verification = sdk`).

- The tester installs from `https://play.google.com/store/apps/details?id=<package>&referrer=amnitest%3D<CODE>`.
- On first launch, the SDK reads the Install Referrer and claims the code. If there is no referrer, it shows a box to type the code.
- After that, the SDK sends one ping per day when the app opens.
- Completion is approved automatically only if a ping arrived on day 13 or later. Without one, the test waits for the developer to confirm, or for the 72 h auto-confirm.

## 4. Reputation

**Tester.**
- Standing = merits − demerits. Every change is written to `events`, so testers can see why their standing moved.

| Event | Change |
|---|---|
| Test completed | +3 merits |
| Developer marks a check-in helpful (at most 3 per test) | +1 merit |
| Missed check-in window | −1 |
| No-show after invite | −2 |
| Unexcused exit (also an excuse that loses a dispute) | −5 |

| Standing | Level | Tester price |
|---|---|---|
| below 10 | 1 | $1 |
| 10–24 | 2 | $2 |
| 25–49 | 3 | $3 |
| 50–99 | 4 | $4 |
| 100 and up | 5 | $5 |

- A tester's price is fixed when they accept a test. It is capped at the campaign's maximum level.
- A tester can run at most 3 tests at once.
- **Standing of −10 or below** bans the account (`banned`). The user can appeal.

**Excused exit reasons:** `crash`, `wont_install`, `not_as_described`, `privacy`, `offensive`.
- Excused exits pay the price × days/14.
- The developer gets 1 demerit, or 3 for `privacy` or `offensive`.

**Unexcused exit reasons:** `no_time`, `lost_interest`, `other`.

**Developer.**
- Dev standing = dev merits (+1 per completed tester) − dev demerits (from excused exits, disputes they lose, and upheld reports).
- Testers see each app's dev standing and completion rate before accepting.
- A dev standing of −10 or below blocks new campaigns.

## 5. Reports, termination and the single appeal

- Either side can report the other: a developer can report a tester it has an assignment with, and a tester can report a campaign it has an assignment in. Report categories:
  - harassment
  - fraud (fake devices or several accounts)
  - spam_feedback
  - malware
  - inappropriate
- **The first open report freezes the account (`review`):** it can't accept new tests or create campaigns, and payouts are held. Running tests continue.
- **Reports from `REPORT_THRESHOLD` different users within 30 days (default 2) terminate the account automatically.** An admin can also uphold a single report. Setting `REPORT_THRESHOLD=1` gives one-report termination.
- **Dismissing the last open report** returns the account to `active`.
- **On termination:**
  - Running tests become `removed`.
  - Pay for days already done is credited unless an admin marked the report as fraud.
  - On fraud, the balance is forfeited.
- **One appeal per account, ever,** for `banned` or `terminated` accounts.
  - If an admin reinstates the account, a negative tester standing is raised to 0; a positive one is kept.
  - If the admin denies it, the decision is final.

## 6. Money

- **Campaign budget:** `slots` × `max_price`.
- **Platform fee per slot:** the larger of `FEE_MIN_CENTS` (50) and `FEE_PCT` (30%) of `max_price`.
- **Payment:** the developer pays once through Stripe Checkout. Any developer credit is applied first. When credit covers everything, no Checkout is needed.
- **Slot prices:** each slot reserves the accepting tester's price. When a slot is released, the reservation goes back to the budget.
- **Closing a campaign** returns the unreserved budget to the developer's credit. Refunds to the card are handled by an admin in the Stripe dashboard.
- **Tester pay:**
  - Earned pay goes to the tester's balance.
  - Payouts use Stripe Connect Express: the tester onboards once, then requests a payout when their balance is at least `PAYOUT_MIN_CENTS` ($10).
  - Each payout is a Stripe Transfer with an idempotency key.
- **Who holds the money:** Stripe holds all of it ("separate charges and transfers"). Amni-Test never takes custody of funds outside Stripe.

## 7. API

All endpoints take and return JSON, and use `Authorization: Bearer <session token>` unless marked public. Errors look like `{ "error": "message" }` with a 4xx or 5xx status.

**Public**

| Method and path | What it does |
|---|---|
| `GET /api/config` | Returns `{ googleClientId, devAuth, levels, feePct, feeMinCents, payoutMinCents }` |
| `POST /api/auth/google { credential }` | Returns `{ token, user }` |
| `POST /api/auth/dev { email }` | Local dev only (`DEV_AUTH=1`). Returns `{ token, user }` |
| `POST /api/stripe/webhook` | Stripe-signed |
| `POST /api/sdk/claim { key, package, code, installId }` | Returns `{ ok, assignment }` |
| `POST /api/sdk/ping { key, package, installId }` | Returns `{ ok, day }` |

**Signed in**

| Method and path | What it does |
|---|---|
| `POST /api/auth/logout` | Signs out |
| `GET /api/me` | Returns `{ user, tester: { merits, demerits, standing, level, priceCents, maxActive }, dev: { merits, demerits, standing }, balanceCents, creditCents, events[] }` |
| `POST /api/me/adult` | Records the 18+ confirmation |
| `POST /api/me/appeal { text }` | Files the one appeal |
| `GET /api/tests` | Open campaigns with free slots and the price this tester would get |
| `POST /api/tests/:campaignId/accept` | Takes a slot |
| `GET /api/assignments` | My tests, with next check-in window, claim code, opt-in and install links |
| `POST /api/assignments/:id/start` | Tester confirms they opted in and installed |
| `POST /api/assignments/:id/checkin { worked, broke, device }` | Files a check-in |
| `POST /api/assignments/:id/exit { reason, note }` | Leaves a test |
| `POST /api/reports { kind: "tester"\|"campaign", assignmentId, category, note }` | Files a report |
| `POST /api/payouts/onboard` | Returns `{ url }`, the Stripe onboarding link |
| `POST /api/payouts/request` | Returns `{ payout }` |
| `POST /api/campaigns { appName, package, description, instructions, slots, maxLevel, verification }` | Creates a campaign |
| `GET /api/campaigns` | My campaigns |
| `GET /api/campaigns/:id` | Campaign, assignments with check-ins, tester emails, `sdkKey` |
| `POST /api/campaigns/:id/checkout` | Returns `{ url }` or `{ funded: true }` |
| `POST /api/campaigns/:id/invited { assignmentIds? }` | Marks testers invited (all `accepted` ones when the list is omitted) |
| `POST /api/campaigns/:id/close` | Closes the campaign and credits the unused budget |
| `POST /api/checkins/:id/helpful` | Marks a check-in helpful |
| `POST /api/assignments/:id/confirm` | Confirms a completion |
| `POST /api/assignments/:id/dispute { note }` | Disputes an `exit_pending` or `completed_pending` test |

**Admin**

| Method and path | What it does |
|---|---|
| `GET /api/admin/queue` | Returns `{ reports, disputes, appeals }` |
| `POST /api/admin/reports/:id { decision: "uphold"\|"dismiss", fraud }` | Rules on a report |
| `POST /api/admin/disputes/:assignmentId { decision: "tester"\|"developer" }` | Rules on a dispute |
| `POST /api/admin/appeals/:userId { decision: "reinstate"\|"deny" }` | Rules on an appeal |

**Scheduled.** A Cron Trigger runs every 15 minutes and applies the timers:
- invites and no-shows
- missed check-ins
- exits with no check-ins by day 16
- 72 h auto-confirm and auto-excuse
- campaigns with every slot finished close

## 8. Configuration

| Name | Kind | Purpose |
|---|---|---|
| `DB` | D1 binding | Database (`schema.sql`) |
| `GOOGLE_CLIENT_ID` | var | Web OAuth client ID used by Google sign-in on `/test/` |
| `ALLOWED_ORIGINS` | var | Comma list, e.g. `https://amni-scient.com` |
| `SITE_URL` | var | `https://amni-scient.com/test/` (Stripe return links) |
| `ADMIN_EMAILS` | var | Comma list |
| `FEE_PCT`, `FEE_MIN_CENTS`, `PAYOUT_MIN_CENTS`, `REPORT_THRESHOLD` | var | Defaults 30, 50, 1000, 2 |
| `STRIPE_SECRET_KEY` | secret | `sk_test_…` until launch |
| `STRIPE_WEBHOOK_SECRET` | secret | `whsec_…` |
| `DEV_AUTH`, `DEV_FAKE_PAY` | var | `1` only for local development |
