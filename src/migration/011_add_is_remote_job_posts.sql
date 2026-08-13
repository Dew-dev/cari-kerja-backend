ALTER TABLE job_posts
ADD COLUMN IF NOT EXISTS is_remote BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_job_posts_is_remote ON job_posts(is_remote);
