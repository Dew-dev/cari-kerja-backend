-- Allow users without email (Telegram login). Email is optional notification channel.
ALTER TABLE users
  ALTER COLUMN email DROP NOT NULL;

-- Ensure email verification column exists (used by auth flows).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Telegram notification channel for email/google login users (NOT a login method).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_telegram_id TEXT,
  ADD COLUMN IF NOT EXISTS notification_telegram_username VARCHAR(255),
  ADD COLUMN IF NOT EXISTS notification_telegram_linked_at TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_notification_telegram_id
  ON users (notification_telegram_id)
  WHERE notification_telegram_id IS NOT NULL;

-- Clear synthetic / unused emails for Telegram-login accounts.
-- They must re-add a real email via change-email for notifications only.
UPDATE users
SET
  email = NULL,
  email_verified_at = NULL,
  updated_at = NOW()
WHERE login_provider = 'telegram';
