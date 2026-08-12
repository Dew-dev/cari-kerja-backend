-- ============================================================
-- Employer company verification applications (KYC-lite)
-- Grace period → auto-block → reactivation via resubmit docs
-- ============================================================

-- Suspension reason for soft-restricted KYC blocks
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS suspension_reason VARCHAR(64);

COMMENT ON COLUMN users.suspension_reason IS
  'null | verification_incomplete | admin | fraud | other';

ALTER TABLE recruiters
  ADD COLUMN IF NOT EXISTS verification_deadline_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE recruiters
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(32) NOT NULL DEFAULT 'grace';

ALTER TABLE recruiters
  DROP CONSTRAINT IF EXISTS chk_recruiters_verification_status;

ALTER TABLE recruiters
  ADD CONSTRAINT chk_recruiters_verification_status
  CHECK (verification_status IN (
    'grace',
    'pending_review',
    'verified',
    'rejected',
    'blocked_incomplete'
  ));

COMMENT ON COLUMN recruiters.verification_status IS
  'grace=within deadline; pending_review=docs submitted; verified; rejected; blocked_incomplete=auto-suspended';

CREATE TABLE IF NOT EXISTS employer_verification_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
    company_legal_name VARCHAR(255),
    npwp_number VARCHAR(64),
    nib_number VARCHAR(64),
    applicant_notes TEXT,
    admin_note TEXT,
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eva_recruiter_created
    ON employer_verification_applications(recruiter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_eva_status_submitted
    ON employer_verification_applications(status, submitted_at DESC);

CREATE TABLE IF NOT EXISTS employer_verification_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES employer_verification_applications(id) ON DELETE CASCADE,
    doc_type VARCHAR(64) NOT NULL
        CHECK (doc_type IN (
            'npwp',
            'nib',
            'akta',
            'ktp_pic',
            'sk_kemenkumham',
            'domicile'
        )),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    mime_type VARCHAR(128),
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (application_id, doc_type)
);

CREATE INDEX IF NOT EXISTS idx_evd_application
    ON employer_verification_documents(application_id);

CREATE TABLE IF NOT EXISTS account_reactivation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
    application_id UUID REFERENCES employer_verification_applications(id) ON DELETE SET NULL,
    reason TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'approved', 'rejected', 'cancelled')),
    admin_note TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arr_status_created
    ON account_reactivation_requests(status, created_at DESC);

-- Backfill existing recruiters: verified stay verified; others get grace from created_at
UPDATE recruiters r
SET verification_status = CASE
      WHEN r.is_verified IS TRUE THEN 'verified'
      ELSE COALESCE(r.verification_status, 'grace')
    END,
    verification_deadline_at = CASE
      WHEN r.is_verified IS TRUE THEN NULL
      WHEN r.verification_deadline_at IS NOT NULL THEN r.verification_deadline_at
      ELSE r.created_at + INTERVAL '7 days'
    END
WHERE TRUE;

-- System settings for grace period
INSERT INTO system_settings (setting_key, setting_value)
VALUES
  ('employer_verification_grace_days', '7'),
  ('employer_verification_auto_block', 'true')
ON CONFLICT (setting_key) DO NOTHING;
