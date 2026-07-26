-- Store numeric Telegram user id from OIDC claim `id` (Bot API chat.id).
-- OIDC `sub` remains in users.provider_id and is NOT equal to Bot API chat.id.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_telegram_user_id
  ON users (telegram_user_id)
  WHERE telegram_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_telegram_user_id
  ON users (telegram_user_id)
  WHERE telegram_user_id IS NOT NULL;
