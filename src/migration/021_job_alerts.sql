-- ============================================================
-- JOB ALERTS
-- Preferensi harian rekomendasi lowongan untuk job seeker
-- ============================================================

ALTER TABLE workers
    ADD COLUMN IF NOT EXISTS job_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS job_alerts_last_sent_at TIMESTAMP WITH TIME ZONE NULL;

COMMENT ON COLUMN workers.job_alerts_enabled IS
  'Toggle job alerts email. Effective only when users.email IS NOT NULL.';
COMMENT ON COLUMN workers.job_alerts_last_sent_at IS
  'Last time a job alerts email was successfully queued for this worker.';

CREATE INDEX IF NOT EXISTS idx_workers_job_alerts_enabled
    ON workers(job_alerts_enabled)
    WHERE deleted_at IS NULL AND job_alerts_enabled = TRUE;
