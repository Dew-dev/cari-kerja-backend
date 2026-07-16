-- ============================================================
-- LANGUAGES LOOKUP MIGRATION
-- Rename tabel per-worker `languages` -> `worker_languages`,
-- lalu buat master lookup `languages` baru + backfill.
-- `language_name` dipertahankan untuk kompatibilitas frontend lama.
-- ============================================================

-- 1. Rename tabel per-worker
ALTER TABLE languages RENAME TO worker_languages;
ALTER INDEX IF EXISTS idx_languages_worker_id RENAME TO idx_worker_languages_worker_id;

-- 2. Master lookup baru
CREATE TABLE IF NOT EXISTS languages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 3. Backfill master dari data lama (normalisasi: trim + Initcap)
INSERT INTO languages (name)
SELECT DISTINCT TRIM(INITCAP(language_name))
FROM worker_languages
WHERE language_name IS NOT NULL AND TRIM(language_name) <> ''
ON CONFLICT (name) DO NOTHING;

-- 4. Kolom referensi di worker_languages + isi via join nama
ALTER TABLE worker_languages
    ADD COLUMN IF NOT EXISTS language_id INT REFERENCES languages(id);

UPDATE worker_languages wl
SET language_id = l.id
FROM languages l
WHERE TRIM(INITCAP(wl.language_name)) = l.name
  AND wl.language_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_worker_languages_language_id ON worker_languages(language_id);
