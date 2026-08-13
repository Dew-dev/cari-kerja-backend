-- ============================================================
-- ROLLBACK: CANDIDATE PIPELINE MIGRATION
-- ============================================================

DROP TABLE IF EXISTS application_stage_history;

ALTER TABLE application_statuses
    DROP CONSTRAINT IF EXISTS uq_application_statuses_job_post_name;
ALTER TABLE application_statuses
    ADD CONSTRAINT application_statuses_name_key UNIQUE (name);

ALTER TABLE application_statuses
    DROP CONSTRAINT IF EXISTS chk_application_statuses_stage_type;

DROP INDEX IF EXISTS idx_application_statuses_job_post_id;

DELETE FROM application_statuses WHERE job_post_id IS NOT NULL;

ALTER TABLE application_statuses
    DROP COLUMN IF EXISTS job_post_id,
    DROP COLUMN IF EXISTS stage_type,
    DROP COLUMN IF EXISTS position,
    DROP COLUMN IF EXISTS is_system,
    DROP COLUMN IF EXISTS color;
