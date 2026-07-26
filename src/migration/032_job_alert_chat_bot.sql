-- ============================================================
-- JOB ALERT CHAT BOT
-- System recruiter user that sends daily job recommendations
-- into each eligible worker's chat inbox (08:00 Asia/Jakarta).
-- Fixed UUIDs so env JOB_ALERTS_CHAT_USER_ID can default safely.
-- ============================================================

-- users.id for the bot (JWT / conversations.recruiter_id)
-- Default: a0000000-0000-4000-8000-000000000001
-- Override via JOB_ALERTS_CHAT_USER_ID if Super Admin creates a different account.

INSERT INTO users (
    id,
    username,
    email,
    hashed_password,
    login_provider,
    role_id,
    is_suspended,
    email_verified_at,
    created_at,
    updated_at
)
SELECT
    'a0000000-0000-4000-8000-000000000001',
    'cari_kerja_alerts',
    'job-alerts@system.cari-kerja.local',
    -- Unusable login password (bot must not be used as a human account)
    '$2b$10$0RsI2mC/hOyoeWB3Em3hyuD7LpQPkmHZ4iUYAC0lcTLh7w7J/oEXC',
    'local',
    2,
    TRUE,
    NOW(),
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE id = 'a0000000-0000-4000-8000-000000000001'
)
AND NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'job-alerts@system.cari-kerja.local'
)
AND NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'cari_kerja_alerts'
);

INSERT INTO recruiters (
    id,
    user_id,
    company_name,
    contact_name,
    contact_phone,
    description,
    is_verified,
    created_at,
    updated_at
)
SELECT
    'a0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'Cari Kerja Recommendations',
    'Job Alerts',
    '0000000000',
    'Official Cari Kerja bot that sends daily job recommendations matched to your skills, position, and salary expectations.',
    TRUE,
    NOW(),
    NOW()
WHERE EXISTS (
    SELECT 1 FROM users WHERE id = 'a0000000-0000-4000-8000-000000000001'
)
AND NOT EXISTS (
    SELECT 1 FROM recruiters WHERE user_id = 'a0000000-0000-4000-8000-000000000001'
)
AND NOT EXISTS (
    SELECT 1 FROM recruiters WHERE id = 'a0000000-0000-4000-8000-000000000002'
);
