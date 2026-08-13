-- 1. Hapus index terkait is_vip di tabel job_posts
DROP INDEX IF EXISTS idx_job_posts_is_vip;

-- 2. Hapus kolom is_vip, vip_start_at, vip_end_at dari tabel job_posts
ALTER TABLE job_posts
DROP COLUMN IF EXISTS is_vip,
DROP COLUMN IF EXISTS vip_start_at,
DROP COLUMN IF EXISTS vip_end_at;
