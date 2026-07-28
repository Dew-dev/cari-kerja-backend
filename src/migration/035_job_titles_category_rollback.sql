-- Rollback: drop job_titles.category_id

DROP INDEX IF EXISTS idx_job_titles_category_id;

ALTER TABLE job_titles
  DROP COLUMN IF EXISTS category_id;
