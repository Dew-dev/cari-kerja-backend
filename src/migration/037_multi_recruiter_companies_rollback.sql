-- Rollback 037_multi_recruiter_companies.sql
-- Note: does not restore company data back onto recruiters rows.

ALTER TABLE employer_verification_applications DROP COLUMN IF EXISTS company_id;

ALTER TABLE subscription_plans DROP COLUMN IF EXISTS max_seats;

ALTER TABLE job_post_boosts DROP COLUMN IF EXISTS company_id;
ALTER TABLE recruiter_single_posts DROP COLUMN IF EXISTS company_id;
ALTER TABLE recruiter_subscriptions DROP COLUMN IF EXISTS company_id;
ALTER TABLE payment_orders DROP COLUMN IF EXISTS paid_by_user_id;
ALTER TABLE payment_orders DROP COLUMN IF EXISTS company_id;

ALTER TABLE job_posts DROP COLUMN IF EXISTS created_by_user_id;
ALTER TABLE job_posts DROP COLUMN IF EXISTS created_by_recruiter_id;
ALTER TABLE job_posts DROP COLUMN IF EXISTS company_id;

ALTER TABLE recruiters DROP COLUMN IF EXISTS company_id;

DROP TABLE IF EXISTS company_invitations;
DROP TABLE IF EXISTS company_members;
DROP TABLE IF EXISTS companies;
