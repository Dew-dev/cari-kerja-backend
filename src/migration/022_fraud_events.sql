-- ============================================================
-- FRAUD EVENTS / TRUST & SAFETY QUEUE
-- Unified flag queue untuk job content heuristics (+ future sources)
-- ============================================================

CREATE TABLE IF NOT EXISTS fraud_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(32) NOT NULL
        CHECK (entity_type IN ('job_post', 'user', 'chat_message', 'payment_order')),
    entity_id UUID NOT NULL,
    source VARCHAR(64) NOT NULL DEFAULT 'job_content_heuristics',
    risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0),
    status VARCHAR(32) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'reviewing', 'resolved_clean', 'resolved_actioned')),
    flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_action VARCHAR(64),
    resolution_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_events_status_created
    ON fraud_events(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_events_entity
    ON fraud_events(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_fraud_events_risk_score
    ON fraud_events(risk_score DESC);

COMMENT ON TABLE fraud_events IS
  'Trust & Safety queue: flagged entities from heuristics/velocity/manual review.';
COMMENT ON COLUMN fraud_events.flags IS
  'Array of { code, detail, weight } heuristic hits.';
COMMENT ON COLUMN fraud_events.resolution_action IS
  'mark_clean | approve_job | reject_job | suspend_user';
