-- ============================================================
-- CANDIDATE PIPELINE DATA REPAIR (one-off)
-- Perbaiki job_applications yang application_status_id-nya masih
-- menunjuk ke baris application_statuses template global (job_post_id
-- IS NULL). Ini terjadi untuk aplikasi yang dibuat setelah migration
-- 018 dijalankan namun sebelum backend meng-auto-resolve stage
-- 'applied' per job post (client masih mengirim ID template lama, atau
-- job post dibuat setelah 018 sehingga belum pernah di-seed).
--
-- Idempotent & aman dijalankan berulang kali.
-- ============================================================

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

    -- Hanya proses job post yang punya job_applications tersangkut ke template lama
    FOR jp IN
        SELECT DISTINCT ja.job_post_id AS id
        FROM job_applications ja
        JOIN application_statuses ast ON ast.id = ja.application_status_id
        WHERE ast.job_post_id IS NULL
    LOOP
        -- ensureStagesForJobPost: seed 6 stage default jika job post ini belum punya stage sama sekali
        IF NOT EXISTS (SELECT 1 FROM application_statuses WHERE job_post_id = jp.id) THEN
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
        ELSE
            SELECT id INTO v_applied_id FROM application_statuses WHERE job_post_id = jp.id AND stage_type = 'applied' LIMIT 1;
            SELECT id INTO v_screening_id FROM application_statuses WHERE job_post_id = jp.id AND stage_type = 'screening' LIMIT 1;
            SELECT id INTO v_interview_id FROM application_statuses WHERE job_post_id = jp.id AND stage_type = 'interview' LIMIT 1;
            SELECT id INTO v_offer_id FROM application_statuses WHERE job_post_id = jp.id AND stage_type = 'offer' LIMIT 1;
            SELECT id INTO v_hired_id FROM application_statuses WHERE job_post_id = jp.id AND stage_type = 'hired' LIMIT 1;
            SELECT id INTO v_rejected_id FROM application_statuses WHERE job_post_id = jp.id AND stage_type = 'rejected' LIMIT 1;
        END IF;

        -- Remap job_applications job post ini dari template lama ke stage barunya
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
