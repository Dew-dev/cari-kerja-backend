-- Telegram bot notification channel (additive; does not alter login auth columns).
-- telegram_chat_id is set when the user presses Start on the bot after Telegram login.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS telegram_notify_username VARCHAR(255),
  ADD COLUMN IF NOT EXISTS telegram_bot_linked_at TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_telegram_chat_id
  ON users (telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_telegram_bot_linked
  ON users (login_provider, telegram_bot_linked_at)
  WHERE telegram_chat_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  channel VARCHAR(32) NOT NULL,
  notification_type VARCHAR(64) NOT NULL,
  receiver VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  duration_ms INT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at
  ON notification_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_channel_status
  ON notification_logs (channel, status);
