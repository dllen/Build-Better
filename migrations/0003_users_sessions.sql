-- SharePool user accounts: users + revocable sessions (auth layer only;
-- items stays a shared pool, no ownership column).
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,          -- normalized: trim + lowercase
  password_hash TEXT NOT NULL,         -- pbkdf2$<iter>$<salt_b64>$<hash_b64>
  email_verified INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  verify_token_hash TEXT,              -- one-time email-verification token hash
  verify_expires_at INTEGER,           -- epoch ms
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,         -- SHA-256(opaque token) hex
  user_id TEXT,                        -- NULL for AUTH_TOKEN admin sessions
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
