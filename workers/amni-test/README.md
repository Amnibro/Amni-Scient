# amni-test Worker

This is the API for Amni-Test (`amni-scient.com/test/`). It is a Cloudflare Worker backed by a D1 database. It has no npm dependencies; Stripe, Google sign-in verification and webhook signatures are all handled with `fetch` and Web Crypto. The rules are in [`docs/amni-test/README.md`](../../docs/amni-test/README.md).

| File | What it does |
|---|---|
| `worker/index.js` | Routes and handlers for testers, developers, admin, the SDK and the Stripe webhook |
| `worker/rules.js` | Pure rules: levels, prices, fees, check-in windows, pay |
| `worker/sweep.js` | Cron timers: expiry, no-shows, missed check-ins, the 72-hour auto-confirm and auto-excuse, closing campaigns |
| `worker/db.js` | D1 helpers and the reputation and money ledger |
| `worker/google.js` | Google ID token verification (RS256 against Google's JWKS) |
| `worker/stripe.js` | Form-encoded Stripe client and `Stripe-Signature` check |
| `schema.sql` | D1 schema |
| `test/` | Scenario tests and a local dev server (Node 22+, using `node:sqlite` as a stand-in for D1) |

## Test locally

```bash
node --test workers/amni-test/test/api.test.mjs
node workers/amni-test/test/dev-server.mjs          # API on http://127.0.0.1:8787
python3 -m http.server 8080 --bind 127.0.0.1        # from the repo root, then open http://127.0.0.1:8080/test/
```

The dev server turns on email sign-in without Google and marks campaigns paid without Stripe. Sign in as `admin@example.com` for the Admin tab. Two extra routes let you exercise the timers: `POST /__dev/tick {"days":1}` moves the server clock forward, and `POST /__dev/sweep` runs the cron sweep.

## Deploy (one time)

1. **Database:** run `wrangler d1 create amni-test`, put the ID in `wrangler.toml`, then run `wrangler d1 execute amni-test --remote --file=workers/amni-test/schema.sql`.
2. **Google sign-in:**
   - In Google Cloud Console, open APIs & Services › Credentials and create an OAuth client of type Web application.
   - Set its authorized JavaScript origin to `https://amni-scient.com`.
   - Put the client ID in `GOOGLE_CLIENT_ID`.
3. **Stripe** (start in test mode):
   - Turn on Connect with Express accounts in the dashboard.
   - Run `wrangler secret put STRIPE_SECRET_KEY` and enter the `sk_test_…` key.
   - Add a webhook endpoint at `https://amni-test.amnibro7.workers.dev/api/stripe/webhook` for the `checkout.session.completed` and `account.updated` events. For `account.updated`, also turn on "Listen to events on Connected accounts".
   - Run `wrangler secret put STRIPE_WEBHOOK_SECRET` and enter the `whsec_…` secret.
4. **Admins:** set `ADMIN_EMAILS` to the Google accounts that should see the Admin tab.
5. **Publish:** run `wrangler deploy` from `workers/amni-test/`. The cron runs every 15 minutes.

## Before taking real money

- Have a lawyer review `/test/terms.html` and `/test/privacy.html`.
- Run a full test-mode campaign end to end with real Stripe test cards and a test Connect account.
- Payouts are Stripe Transfers from the platform balance. A card payment takes a few days to become available, so early payouts can fail with "insufficient funds". When a payout fails, the tester's balance is restored and they can try again later.
- Refunds to a developer's card are done by hand in the Stripe dashboard. Closing a campaign only adds the unused money back as credit.
