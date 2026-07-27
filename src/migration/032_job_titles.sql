-- ============================================================
-- Job titles taxonomy + FKs on work_experiences / job_posts
-- ============================================================

CREATE TABLE IF NOT EXISTS job_titles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_job_titles_name_active
    ON job_titles (lower(name))
    WHERE deleted_at IS NULL AND is_active IS TRUE;

ALTER TABLE work_experiences
    ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES job_titles(id) ON DELETE SET NULL;

ALTER TABLE job_posts
    ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES job_titles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_work_experiences_job_title_id
    ON work_experiences (job_title_id);

CREATE INDEX IF NOT EXISTS idx_job_posts_job_title_id
    ON job_posts (job_title_id);

-- Backfill job_titles from distinct work experience titles
INSERT INTO job_titles (name, slug, is_active, created_at, updated_at)
SELECT
  trimmed AS name,
  LEFT(
    TRIM(BOTH '-' FROM regexp_replace(lower(trimmed), '[^a-z0-9]+', '-', 'g')),
    160
  ) AS slug,
  TRUE,
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT trim(regexp_replace(job_title, '\s+', ' ', 'g')) AS trimmed
  FROM work_experiences
  WHERE job_title IS NOT NULL
    AND length(trim(job_title)) > 0
) src
WHERE length(trimmed) > 0
  AND NOT EXISTS (
    SELECT 1 FROM job_titles jt
    WHERE jt.deleted_at IS NULL
      AND jt.slug = LEFT(
        TRIM(BOTH '-' FROM regexp_replace(lower(trimmed), '[^a-z0-9]+', '-', 'g')),
        160
      )
  );

-- Link work experiences
UPDATE work_experiences we
SET job_title_id = jt.id
FROM job_titles jt
WHERE we.job_title_id IS NULL
  AND we.job_title IS NOT NULL
  AND jt.deleted_at IS NULL
  AND jt.slug = LEFT(
    TRIM(BOTH '-' FROM regexp_replace(lower(trim(regexp_replace(we.job_title, '\s+', ' ', 'g'))), '[^a-z0-9]+', '-', 'g')),
    160
  );

-- Best-effort: link job posts when headline matches an existing title slug
UPDATE job_posts jp
SET job_title_id = jt.id
FROM job_titles jt
WHERE jp.job_title_id IS NULL
  AND jp.title IS NOT NULL
  AND jt.deleted_at IS NULL
  AND jt.slug = LEFT(
    TRIM(BOTH '-' FROM regexp_replace(lower(trim(regexp_replace(jp.title, '\s+', ' ', 'g'))), '[^a-z0-9]+', '-', 'g')),
    160
  );
