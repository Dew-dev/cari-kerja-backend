-- Widen recruiter / work_experience columns for encrypted sensitive values
-- (mirrors 012_alter_sensitive_columns.sql which only covered users/workers).
-- AES-256-CBC Base64 ciphertext routinely exceeds VARCHAR(30)/VARCHAR(100).

ALTER TABLE recruiters
  ALTER COLUMN contact_phone TYPE VARCHAR(512),
  ALTER COLUMN company_name TYPE VARCHAR(512),
  ALTER COLUMN contact_name TYPE VARCHAR(512);

ALTER TABLE work_experiences
  ALTER COLUMN company_name TYPE VARCHAR(512);

ALTER TABLE certifications
  ALTER COLUMN name TYPE VARCHAR(512);
