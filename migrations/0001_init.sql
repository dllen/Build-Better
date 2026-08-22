-- SharePool schema.
-- IF NOT EXISTS keeps this safe against the manually-created `items` table
-- that already exists in the live database.
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT,
  source TEXT,
  orig_name TEXT,
  created_at TEXT,
  has_thumb INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tokens (
  token_hash TEXT PRIMARY KEY,   -- SHA-256(token) hex; plaintext never stored
  created_at TEXT NOT NULL,
  expires_at INTEGER NOT NULL    -- epoch ms = created_at + 48h
);
