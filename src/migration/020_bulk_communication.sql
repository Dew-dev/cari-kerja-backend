-- ============================================================
-- BULK COMMUNICATION
-- Templates, campaigns, recipients + worker email preferences
-- ============================================================

-- Worker communication preferences
ALTER TABLE workers
    ADD COLUMN IF NOT EXISTS email_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS unsubscribe_token UUID UNIQUE DEFAULT gen_random_uuid();

UPDATE workers
SET unsubscribe_token = gen_random_uuid()
WHERE unsubscribe_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_workers_unsubscribe_token ON workers(unsubscribe_token);

-- Recruiter-owned message templates
CREATE TABLE IF NOT EXISTS communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'email',
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_communication_templates_channel CHECK (channel IN ('email'))
);

CREATE INDEX IF NOT EXISTS idx_communication_templates_recruiter_id
    ON communication_templates(recruiter_id)
    WHERE deleted_at IS NULL;

-- Bulk send campaigns
CREATE TABLE IF NOT EXISTS communication_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
    job_post_id UUID NULL REFERENCES job_posts(id) ON DELETE SET NULL,
    template_id UUID NULL REFERENCES communication_templates(id) ON DELETE SET NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'email',
    status VARCHAR(20) NOT NULL DEFAULT 'processing',
    total INT NOT NULL DEFAULT 0,
    sent INT NOT NULL DEFAULT 0,
    failed INT NOT NULL DEFAULT 0,
    skipped INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_communication_campaigns_channel CHECK (channel IN ('email')),
    CONSTRAINT chk_communication_campaigns_status CHECK (
        status IN ('processing', 'completed', 'partial', 'failed')
    )
);

CREATE INDEX IF NOT EXISTS idx_communication_campaigns_recruiter_id
    ON communication_campaigns(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_communication_campaigns_job_post_id
    ON communication_campaigns(job_post_id);

-- Per-recipient delivery tracking
CREATE TABLE IF NOT EXISTS communication_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES communication_campaigns(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    worker_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    skip_reason VARCHAR(100) NULL,
    error TEXT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_communication_recipients_status CHECK (
        status IN ('queued', 'sent', 'failed', 'skipped')
    )
);

CREATE INDEX IF NOT EXISTS idx_communication_recipients_campaign_id
    ON communication_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_communication_recipients_application_id
    ON communication_recipients(application_id);
