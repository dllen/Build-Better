export const INIT_SQL = `
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'unknown',
  orig_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  has_thumb INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at DESC);
`;
