-- Remove cross-provider Telegram notification link columns.
-- Login identity remains users.provider_id for login_provider = 'telegram'.

DROP INDEX IF EXISTS uq_users_notification_telegram_id;

ALTER TABLE users
  DROP COLUMN IF EXISTS notification_telegram_linked_at,
  DROP COLUMN IF EXISTS notification_telegram_username,
  DROP COLUMN IF EXISTS notification_telegram_id;
