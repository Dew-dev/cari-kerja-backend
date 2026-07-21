-- Rollback 024_job_reject_reason.sql
ALTER TABLE job_posts DROP COLUMN IF EXISTS reject_reason;
