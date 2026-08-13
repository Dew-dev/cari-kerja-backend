-- ============================================================
-- Job post reject reason (admin / Trust & Safety reject)
-- ============================================================

ALTER TABLE job_posts
  ADD COLUMN IF NOT EXISTS reject_reason TEXT;

COMMENT ON COLUMN job_posts.reject_reason IS
  'Optional reason when status is REJECTED; cleared on approve/reopen.';
