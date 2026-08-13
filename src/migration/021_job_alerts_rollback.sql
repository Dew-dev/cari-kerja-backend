-- ============================================================
-- ROLLBACK: JOB ALERTS
-- ============================================================

DROP INDEX IF EXISTS idx_workers_job_alerts_enabled;

ALTER TABLE workers
    DROP COLUMN IF EXISTS job_alerts_enabled,
    DROP COLUMN IF EXISTS job_alerts_last_sent_at;
