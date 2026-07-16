-- ============================================================
-- ROLLBACK: LANGUAGES LOOKUP MIGRATION
-- ============================================================

DROP INDEX IF EXISTS idx_worker_languages_language_id;

ALTER TABLE worker_languages DROP COLUMN IF EXISTS language_id;

DROP TABLE IF EXISTS languages;

ALTER TABLE worker_languages RENAME TO languages;
ALTER INDEX IF EXISTS idx_worker_languages_worker_id RENAME TO idx_languages_worker_id;
