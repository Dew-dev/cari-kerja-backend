DROP INDEX IF EXISTS uq_users_notification_telegram_id;

ALTER TABLE users
  DROP COLUMN IF EXISTS notification_telegram_linked_at,
  DROP COLUMN IF EXISTS notification_telegram_username,
  DROP COLUMN IF EXISTS notification_telegram_id;

-- WARNING: cannot safely restore cleared telegram emails.
-- Re-apply NOT NULL only if no NULL emails remain.
-- ALTER TABLE users ALTER COLUMN email SET NOT NULL;
