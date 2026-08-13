-- Rollback 023_chat_blocks_reports
DROP INDEX IF EXISTS idx_chat_reports_conversation;
DROP INDEX IF EXISTS idx_chat_reports_status_created;
DROP TABLE IF EXISTS chat_reports;
DROP INDEX IF EXISTS idx_chat_blocks_blocked;
DROP INDEX IF EXISTS idx_chat_blocks_blocker;
DROP TABLE IF EXISTS chat_blocks;
