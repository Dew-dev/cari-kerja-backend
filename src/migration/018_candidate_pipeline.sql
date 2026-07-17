-- ============================================================
-- CANDIDATE PIPELINE MIGRATION
-- Ubah application_statuses dari template global menjadi pipeline
-- stage per job post + tabel riwayat perpindahan stage.
-- ============================================================

-- 1. Extend application_statuses
ALTER TABLE application_statuses
    ADD COLUMN IF NOT EXISTS job_post_id UUID NULL REFERENCES job_posts(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS stage_type VARCHAR(20) NOT NULL DEFAULT 'custom',
    ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS color VARCHAR(20) NULL;

ALTER TABLE application_statuses
    DROP CONSTRAINT IF EXISTS chk_application_statuses_stage_type;
ALTER TABLE application_statuses
    ADD CONSTRAINT chk_application_statuses_stage_type
    CHECK (stage_type IN ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'custom'));

-- name hanya unik per job post (job_post_id NULL = template global lama)
ALTER TABLE application_statuses
    DROP CONSTRAINT IF EXISTS application_statuses_name_key;
ALTER TABLE application_statuses
    DROP CONSTRAINT IF EXISTS uq_application_statuses_job_post_name;
ALTER TABLE application_statuses
    ADD CONSTRAINT uq_application_statuses_job_post_name UNIQUE (job_post_id, name);

CREATE INDEX IF NOT EXISTS idx_application_statuses_job_post_id ON application_statuses(job_post_id);

-- 2. Tabel riwayat perpindahan stage
CREATE TABLE IF NOT EXISTS application_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
    from_stage_id INT NULL REFERENCES application_statuses(id),
    to_stage_id INT NOT NULL REFERENCES application_statuses(id),
    changed_by_recruiter_id UUID NULL REFERENCES recruiters(id),
    note TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_application_stage_history_application_id ON application_stage_history(application_id);

-- 3. Data migration: clone 6 stage default untuk setiap job post yang sudah ada,
--    lalu mapping ulang job_applications yang lama ke clone yang sesuai.
DO $$
DECLARE
    jp RECORD;
    v_applied_id INT;
    v_screening_id INT;
    v_interview_id INT;
    v_offer_id INT;
    v_hired_id INT;
    v_rejected_id INT;
    v_old_applied INT;
    v_old_in_review INT;
    v_old_shortlisted INT;
    v_old_rejected INT;
    v_old_hired INT;
BEGIN
    SELECT id INTO v_old_applied FROM application_statuses WHERE name = 'APPLIED' AND job_post_id IS NULL;
    SELECT id INTO v_old_in_review FROM application_statuses WHERE name = 'IN_REVIEW' AND job_post_id IS NULL;
    SELECT id INTO v_old_shortlisted FROM application_statuses WHERE name = 'SHORTLISTED' AND job_post_id IS NULL;
    SELECT id INTO v_old_rejected FROM application_statuses WHERE name = 'REJECTED' AND job_post_id IS NULL;
    SELECT id INTO v_old_hired FROM application_statuses WHERE name = 'HIRED' AND job_post_id IS NULL;

    FOR jp IN SELECT id FROM job_posts LOOP
        -- skip job post yang sudah pernah di-seed (idempotent re-run)
        IF EXISTS (SELECT 1 FROM application_statuses WHERE job_post_id = jp.id) THEN
            CONTINUE;
        END IF;

        INSERT INTO application_statuses (name, job_post_id, stage_type, position, is_system, color)
        VALUES ('Applied', jp.id, 'applied', 0, true, '#64748B')
        RETURNING id INTO v_applied_id;

        INSERT INTO application_statuses (name, job_post_id, stage_type, position, is_system, color)
        VALUES ('Screening', jp.id, 'screening', 1, false, '#3B82F6')
        RETURNING id INTO v_screening_id;

        INSERT INTO application_statuses (name, job_post_id, stage_type, position, is_system, color)
        VALUES ('Interview', jp.id, 'interview', 2, false, '#F59E0B')
        RETURNING id INTO v_interview_id;

        INSERT INTO application_statuses (name, job_post_id, stage_type, position, is_system, color)
        VALUES ('Offer', jp.id, 'offer', 3, false, '#8B5CF6')
        RETURNING id INTO v_offer_id;

        INSERT INTO application_statuses (name, job_post_id, stage_type, position, is_system, color)
        VALUES ('Hired', jp.id, 'hired', 4, true, '#22C55E')
        RETURNING id INTO v_hired_id;

        INSERT INTO application_statuses (name, job_post_id, stage_type, position, is_system, color)
        VALUES ('Rejected', jp.id, 'rejected', 5, true, '#EF4444')
        RETURNING id INTO v_rejected_id;

        UPDATE job_applications SET application_status_id = v_applied_id
            WHERE job_post_id = jp.id AND application_status_id = v_old_applied;
        UPDATE job_applications SET application_status_id = v_screening_id
            WHERE job_post_id = jp.id AND application_status_id = v_old_in_review;
        UPDATE job_applications SET application_status_id = v_interview_id
            WHERE job_post_id = jp.id AND application_status_id = v_old_shortlisted;
        UPDATE job_applications SET application_status_id = v_rejected_id
            WHERE job_post_id = jp.id AND application_status_id = v_old_rejected;
        UPDATE job_applications SET application_status_id = v_hired_id
            WHERE job_post_id = jp.id AND application_status_id = v_old_hired;
    END LOOP;
END $$;
