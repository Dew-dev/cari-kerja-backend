-- ============================================================
-- CHAT BLOCKS + REPORTS
-- User-to-user block list and report queue for Trust & Safety
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_chat_blocks_pair UNIQUE (blocker_user_id, blocked_user_id),
    CONSTRAINT chk_chat_blocks_not_self CHECK (blocker_user_id <> blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_blocks_blocker
    ON chat_blocks(blocker_user_id);

CREATE INDEX IF NOT EXISTS idx_chat_blocks_blocked
    ON chat_blocks(blocked_user_id);

CREATE TABLE IF NOT EXISTS chat_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'resolved')),
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_reports_status_created
    ON chat_reports(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_reports_conversation
    ON chat_reports(conversation_id);

COMMENT ON TABLE chat_blocks IS
  'Mutual messaging is blocked if either user blocked the other.';
COMMENT ON TABLE chat_reports IS
  'User-submitted chat reports; mirrored into fraud_events for Trust & Safety.';
