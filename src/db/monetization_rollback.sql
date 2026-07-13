-- ============================================================
-- MONETIZATION ROLLBACK
-- Jalankan jika perlu rollback migration monetisasi
-- ============================================================

-- Hapus indexes
DROP INDEX IF EXISTS idx_payment_orders_recruiter_id;
DROP INDEX IF EXISTS idx_payment_orders_status;
DROP INDEX IF EXISTS idx_payment_orders_xendit_external_id;
DROP INDEX IF EXISTS idx_recruiter_subscriptions_recruiter_id;
DROP INDEX IF EXISTS idx_recruiter_subscriptions_is_active;
DROP INDEX IF EXISTS idx_recruiter_single_posts_recruiter_id;
DROP INDEX IF EXISTS idx_job_post_boosts_job_post_id;
DROP INDEX IF EXISTS idx_job_post_boosts_is_active;
DROP INDEX IF EXISTS idx_job_posts_boost_type;

-- Hapus kolom tambahan di job_posts
ALTER TABLE job_posts
    DROP COLUMN IF EXISTS boost_type,
    DROP COLUMN IF EXISTS boost_expires_at,
    DROP COLUMN IF EXISTS is_hot;

-- Hapus tabel (urut dari dependan ke induk)
DROP TABLE IF EXISTS payment_logs;
DROP TABLE IF EXISTS job_post_boosts;
DROP TABLE IF EXISTS recruiter_single_posts;
DROP TABLE IF EXISTS recruiter_subscriptions;
DROP TABLE IF EXISTS payment_orders;
DROP TABLE IF EXISTS boost_plans;
DROP TABLE IF EXISTS single_post_plans;
DROP TABLE IF EXISTS subscription_plans;
