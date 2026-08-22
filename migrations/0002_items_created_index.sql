-- Speed up list pagination (ORDER BY created_at DESC with cursor) on fresh DBs.
CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at DESC);
