CREATE TABLE IF NOT EXISTS signups (email TEXT NOT NULL, app TEXT NOT NULL, device TEXT NOT NULL, handle TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, PRIMARY KEY (email, app));
CREATE INDEX IF NOT EXISTS signups_app ON signups (app, created_at);
