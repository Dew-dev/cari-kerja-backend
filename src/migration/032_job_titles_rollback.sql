-- Rollback 032 job titles taxonomy

ALTER TABLE work_experiences DROP COLUMN IF EXISTS job_title_id;
ALTER TABLE job_posts DROP COLUMN IF EXISTS job_title_id;

DROP INDEX IF EXISTS idx_job_titles_name_active;
DROP TABLE IF EXISTS job_titles;
