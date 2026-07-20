-- ============================================================
-- ROLLBACK: BULK COMMUNICATION
-- ============================================================

DROP TABLE IF EXISTS communication_recipients;
DROP TABLE IF EXISTS communication_campaigns;
DROP TABLE IF EXISTS communication_templates;

DROP INDEX IF EXISTS idx_workers_unsubscribe_token;

ALTER TABLE workers
    DROP COLUMN IF EXISTS email_opt_out,
    DROP COLUMN IF EXISTS unsubscribe_token;
