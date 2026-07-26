DROP INDEX IF EXISTS idx_users_telegram_user_id;
DROP INDEX IF EXISTS uq_users_telegram_user_id;

ALTER TABLE users
  DROP COLUMN IF EXISTS telegram_user_id;
