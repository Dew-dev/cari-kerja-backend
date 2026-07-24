-- Rollback 026_widen_encrypted_recruiter_columns
-- WARNING: may fail if encrypted values exceed the restored lengths.

ALTER TABLE certifications
  ALTER COLUMN name TYPE VARCHAR(150);

ALTER TABLE work_experiences
  ALTER COLUMN company_name TYPE VARCHAR(150);

ALTER TABLE recruiters
  ALTER COLUMN contact_phone TYPE VARCHAR(30),
  ALTER COLUMN company_name TYPE VARCHAR(150),
  ALTER COLUMN contact_name TYPE VARCHAR(100);
