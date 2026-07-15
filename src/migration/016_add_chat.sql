-- ============================================================
-- CHAT MIGRATION
-- Fitur: One-to-one chat between workers and recruiters
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES job_posts(id) ON DELETE SET NULL,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    worker_unread INT NOT NULL DEFAULT 0,
    recruiter_unread INT NOT NULL DEFAULT 0,
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_worker_id ON conversations(worker_id);
CREATE INDEX IF NOT EXISTS idx_conversations_recruiter_id ON conversations(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_conversations_job_id ON conversations(job_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Prevent duplicate conversations for the same worker + recruiter + job combo
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_with_job
    ON conversations(worker_id, recruiter_id, job_id)
    WHERE job_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_unique_no_job
    ON conversations(worker_id, recruiter_id)
    WHERE job_id IS NULL;

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'text',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
