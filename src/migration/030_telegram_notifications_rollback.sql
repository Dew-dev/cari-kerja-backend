DROP INDEX IF EXISTS idx_notification_logs_channel_status;
DROP INDEX IF EXISTS idx_notification_logs_created_at;
DROP TABLE IF EXISTS notification_logs;

DROP INDEX IF EXISTS idx_users_telegram_bot_linked;
DROP INDEX IF EXISTS uq_users_telegram_chat_id;

ALTER TABLE users
  DROP COLUMN IF EXISTS telegram_bot_linked_at,
  DROP COLUMN IF EXISTS telegram_notify_username,
  DROP COLUMN IF EXISTS telegram_chat_id;
