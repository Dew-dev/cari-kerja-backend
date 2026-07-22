-- Rollback: restore optional Telegram notification link columns.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_telegram_id TEXT,
  ADD COLUMN IF NOT EXISTS notification_telegram_username VARCHAR(255),
  ADD COLUMN IF NOT EXISTS notification_telegram_linked_at TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_notification_telegram_id
  ON users (notification_telegram_id)
  WHERE notification_telegram_id IS NOT NULL;
