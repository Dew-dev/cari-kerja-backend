-- 1. Tambah kembali kolom is_vip, vip_start_at, vip_end_at ke tabel job_posts
ALTER TABLE job_posts
ADD COLUMN is_vip BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN vip_start_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN vip_end_at TIMESTAMP WITH TIME ZONE;

-- 2. Buat kembali index untuk is_vip
CREATE INDEX IF NOT EXISTS idx_job_posts_is_vip ON job_posts(is_vip);
