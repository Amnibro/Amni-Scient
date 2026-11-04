-- Amni-Test D1 schema. Times are Unix milliseconds. Money is integer cents (USD).
-- Apply: wrangler d1 execute amni-test --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  google_sub TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  adult_at INTEGER,
  status TEXT NOT NULL DEFAULT 'active',          -- active | review | banned | terminated
  status_reason TEXT NOT NULL DEFAULT '',
  status_at INTEGER,
  appeal_used INTEGER NOT NULL DEFAULT 0,
  appeal_text TEXT,
  appeal_at INTEGER,
  appeal_decision TEXT,                           -- reinstate | deny
  tester_merits INTEGER NOT NULL DEFAULT 0,
  tester_demerits INTEGER NOT NULL DEFAULT 0,
  dev_merits INTEGER NOT NULL DEFAULT 0,
  dev_demerits INTEGER NOT NULL DEFAULT 0,
  balance_cents INTEGER NOT NULL DEFAULT 0,       -- tester earnings not yet paid out
  credit_cents INTEGER NOT NULL DEFAULT 0,        -- developer credit from unused budgets
  forfeited_cents INTEGER NOT NULL DEFAULT 0,
  stripe_account_id TEXT,
  payouts_enabled INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  app_name TEXT NOT NULL,
  package TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  slots INTEGER NOT NULL,
  max_level INTEGER NOT NULL,
  max_price_cents INTEGER NOT NULL,
  fee_cents INTEGER NOT NULL,                     -- total platform fee for the campaign
  budget_cents INTEGER NOT NULL,                  -- slots * max_price_cents
  reserved_cents INTEGER NOT NULL DEFAULT 0,      -- held for running assignments
  spent_cents INTEGER NOT NULL DEFAULT 0,         -- paid to testers
  credited_cents INTEGER NOT NULL DEFAULT 0,      -- returned to the developer's credit
  credit_used_cents INTEGER NOT NULL DEFAULT 0,
  verification TEXT NOT NULL DEFAULT 'manual',    -- manual | sdk
  sdk_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',           -- draft | open | closed | cancelled
  checkout_session_id TEXT,
  paid_at INTEGER,
  closed_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS campaigns_owner ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS campaigns_status ON campaigns(status);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
  tester_id INTEGER NOT NULL REFERENCES users(id),
  price_cents INTEGER NOT NULL,
  status TEXT NOT NULL,             -- accepted | invited | active | completed_pending | completed | exit_pending | excused | exited | no_show | expired | removed
  claim_code TEXT NOT NULL UNIQUE,
  install_id TEXT,
  accepted_at INTEGER NOT NULL,
  invited_at INTEGER,
  started_at INTEGER,
  pending_at INTEGER,               -- entered completed_pending / exit_pending
  finished_at INTEGER,
  exit_reason TEXT,
  exit_note TEXT,
  dispute_note TEXT,
  dispute_at INTEGER,
  missed_checkins INTEGER NOT NULL DEFAULT 0,
  missed_mask INTEGER NOT NULL DEFAULT 0,      -- bit per check-in window already charged
  helpful_count INTEGER NOT NULL DEFAULT 0,
  paid_cents INTEGER NOT NULL DEFAULT 0,
  UNIQUE (campaign_id, tester_id)
);
CREATE INDEX IF NOT EXISTS assignments_tester ON assignments(tester_id);
CREATE INDEX IF NOT EXISTS assignments_status ON assignments(status);

CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id),
  day INTEGER NOT NULL,             -- 1 | 7 | 14
  worked TEXT NOT NULL DEFAULT '',
  broke TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT '',
  helpful INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE (assignment_id, day)
);

CREATE TABLE IF NOT EXISTS pings (
  assignment_id INTEGER NOT NULL REFERENCES assignments(id),
  day INTEGER NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (assignment_id, day)
);

-- Reputation and money ledger, shown to the user so every change is explained.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  role TEXT NOT NULL,               -- tester | dev | account
  kind TEXT NOT NULL,
  merits INTEGER NOT NULL DEFAULT 0,
  demerits INTEGER NOT NULL DEFAULT 0,
  cents INTEGER NOT NULL DEFAULT 0,
  assignment_id INTEGER,
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS events_user ON events(user_id, created_at);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY,
  reporter_id INTEGER NOT NULL REFERENCES users(id),
  target_id INTEGER NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,               -- tester | campaign
  assignment_id INTEGER NOT NULL REFERENCES assignments(id),
  category TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',   -- open | upheld | dismissed
  fraud INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  resolved_by INTEGER,
  UNIQUE (reporter_id, assignment_id)
);
CREATE INDEX IF NOT EXISTS reports_target ON reports(target_id, status);

CREATE TABLE IF NOT EXISTS payouts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL,             -- pending | paid | failed
  stripe_transfer_id TEXT,
  error TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);
