-- ============================================================
-- ROLLBACK: CANDIDATE PIPELINE DATA REPAIR
-- ============================================================
-- Migration ini hanya melakukan perbaikan data (remap
-- job_applications.application_status_id dari template global lama ke
-- stage per-job-post yang sudah ada). Nilai lama tidak disimpan di
-- tempat lain, sehingga proses ini tidak dapat di-rollback secara aman
-- tanpa backup. Tidak ada operasi yang dijalankan di sini.
--
-- Jika perlu mengembalikan state sebelum migration 018/019, gunakan
-- backup database sebelum migration tersebut dijalankan.
-- ============================================================

SELECT 1; -- no-op
