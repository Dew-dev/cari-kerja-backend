-- ============================================================
-- job_titles.category_id → categories (taxonomy)
-- ============================================================

ALTER TABLE job_titles
  ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_titles_category_id
  ON job_titles (category_id)
  WHERE deleted_at IS NULL AND is_active IS TRUE;
