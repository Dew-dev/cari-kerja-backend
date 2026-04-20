-- Add employee_count, instagram_url, tiktok_url to recruiters table
ALTER TABLE recruiters
  ADD COLUMN IF NOT EXISTS employee_count VARCHAR(50),
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
