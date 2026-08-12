-- Rollback 026_employer_verification_applications.sql

DROP TABLE IF EXISTS account_reactivation_requests;
DROP TABLE IF EXISTS employer_verification_documents;
DROP TABLE IF EXISTS employer_verification_applications;

ALTER TABLE recruiters DROP CONSTRAINT IF EXISTS chk_recruiters_verification_status;
ALTER TABLE recruiters DROP COLUMN IF EXISTS verification_status;
ALTER TABLE recruiters DROP COLUMN IF EXISTS verification_deadline_at;

ALTER TABLE users DROP COLUMN IF EXISTS suspension_reason;

DELETE FROM system_settings
WHERE setting_key IN (
  'employer_verification_grace_days',
  'employer_verification_auto_block'
);
