-- ============================================================
-- Multi-recruiter companies: org entity, members, invitations
-- Jobs / VIP / verification / monetization → company-scoped
-- ============================================================

-- ----------------------------
-- 1. COMPANIES
-- ----------------------------
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(512) NOT NULL,
    avatar_url TEXT,
    company_website VARCHAR(255),
    address TEXT,
    industry_id INTEGER REFERENCES industries(id) ON DELETE SET NULL,
    description TEXT,
    employee_count VARCHAR(50),
    instagram_url VARCHAR(255),
    tiktok_url VARCHAR(255),
    is_vip BOOLEAN NOT NULL DEFAULT FALSE,
    vip_start_at TIMESTAMP WITH TIME ZONE,
    vip_end_at TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_deadline_at TIMESTAMP WITH TIME ZONE,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'grace'
        CHECK (verification_status IN (
            'grace',
            'pending_review',
            'verified',
            'rejected',
            'blocked_incomplete'
        )),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry_id);
CREATE INDEX IF NOT EXISTS idx_companies_verification_status ON companies(verification_status);
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON companies(deleted_at);

-- ----------------------------
-- 2. COMPANY MEMBERS
-- ----------------------------
CREATE TABLE IF NOT EXISTS company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'recruiter'
        CHECK (role IN ('owner', 'admin', 'recruiter')),
    status VARCHAR(32) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_company_members_one_active_owner
    ON company_members(company_id)
    WHERE role = 'owner' AND status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS uq_company_members_one_active_per_user
    ON company_members(user_id)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_company_members_company ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON company_members(user_id);

-- ----------------------------
-- 3. COMPANY INVITATIONS
-- ----------------------------
CREATE TABLE IF NOT EXISTS company_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'recruiter'
        CHECK (role IN ('admin', 'recruiter')),
    token_hash VARCHAR(128) NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_company_invitations_pending_email
    ON company_invitations(company_id, lower(email))
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_company_invitations_token_hash
    ON company_invitations(token_hash)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_company_invitations_company
    ON company_invitations(company_id, status);

-- ----------------------------
-- 4. Link recruiters → company
-- ----------------------------
ALTER TABLE recruiters
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recruiters_company_id ON recruiters(company_id);

-- ----------------------------
-- 5. Backfill: one company + owner membership per existing recruiter
-- ----------------------------
DO $$
DECLARE
    rec RECORD;
    new_company_id UUID;
    has_is_verified BOOLEAN;
    has_verification_status BOOLEAN;
    has_verification_deadline BOOLEAN;
    has_deleted_at BOOLEAN;
    v_is_verified BOOLEAN;
    v_verification_status TEXT;
    v_verification_deadline TIMESTAMPTZ;
    v_deleted_at TIMESTAMPTZ;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recruiters' AND column_name = 'is_verified'
    ) INTO has_is_verified;
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recruiters' AND column_name = 'verification_status'
    ) INTO has_verification_status;
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recruiters' AND column_name = 'verification_deadline_at'
    ) INTO has_verification_deadline;
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'recruiters' AND column_name = 'deleted_at'
    ) INTO has_deleted_at;

    FOR rec IN
        SELECT
            id,
            user_id,
            company_name,
            avatar_url,
            company_website,
            address,
            industry_id,
            description,
            employee_count,
            instagram_url,
            tiktok_url,
            is_vip,
            vip_start_at,
            vip_end_at,
            created_at,
            updated_at
        FROM recruiters
        WHERE company_id IS NULL
    LOOP
        v_is_verified := FALSE;
        v_verification_status := 'grace';
        v_verification_deadline := NULL;
        v_deleted_at := NULL;

        IF has_is_verified THEN
            EXECUTE 'SELECT COALESCE(is_verified, FALSE) FROM recruiters WHERE id = $1'
                INTO v_is_verified USING rec.id;
        END IF;
        IF has_verification_status THEN
            EXECUTE 'SELECT COALESCE(NULLIF(verification_status, ''''), ''grace'') FROM recruiters WHERE id = $1'
                INTO v_verification_status USING rec.id;
        END IF;
        IF has_verification_deadline THEN
            EXECUTE 'SELECT verification_deadline_at FROM recruiters WHERE id = $1'
                INTO v_verification_deadline USING rec.id;
        END IF;
        IF has_deleted_at THEN
            EXECUTE 'SELECT deleted_at FROM recruiters WHERE id = $1'
                INTO v_deleted_at USING rec.id;
        END IF;

        INSERT INTO companies (
            company_name, avatar_url, company_website, address, industry_id,
            description, employee_count, instagram_url, tiktok_url,
            is_vip, vip_start_at, vip_end_at, is_verified,
            verification_deadline_at, verification_status, deleted_at, created_at, updated_at
        ) VALUES (
            COALESCE(NULLIF(TRIM(rec.company_name), ''), 'Company'),
            rec.avatar_url, rec.company_website, rec.address,
            CASE
                WHEN rec.industry_id IS NOT NULL
                     AND EXISTS (SELECT 1 FROM industries i WHERE i.id = rec.industry_id)
                THEN rec.industry_id
                ELSE NULL
            END,
            rec.description, rec.employee_count, rec.instagram_url, rec.tiktok_url,
            COALESCE(rec.is_vip, FALSE), rec.vip_start_at, rec.vip_end_at, v_is_verified,
            v_verification_deadline, COALESCE(NULLIF(v_verification_status, ''), 'grace'),
            v_deleted_at, COALESCE(rec.created_at, NOW()), COALESCE(rec.updated_at, NOW())
        ) RETURNING id INTO new_company_id;

        UPDATE recruiters
        SET company_id = new_company_id, updated_at = NOW()
        WHERE id = rec.id;

        IF EXISTS (SELECT 1 FROM users u WHERE u.id = rec.user_id) THEN
            INSERT INTO company_members (company_id, user_id, role, status, joined_at, created_at, updated_at)
            VALUES (
                new_company_id,
                rec.user_id,
                'owner',
                'active',
                COALESCE(rec.created_at, NOW()),
                NOW(),
                NOW()
            )
            ON CONFLICT (company_id, user_id) DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- ----------------------------
-- 6. JOB POSTS → company scope
-- ----------------------------
ALTER TABLE job_posts
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE job_posts
    ADD COLUMN IF NOT EXISTS created_by_recruiter_id UUID REFERENCES recruiters(id) ON DELETE SET NULL;

ALTER TABLE job_posts
    ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

UPDATE job_posts jp
SET company_id = r.company_id,
    created_by_recruiter_id = COALESCE(jp.created_by_recruiter_id, jp.recruiter_id),
    created_by_user_id = COALESCE(
        jp.created_by_user_id,
        CASE
            WHEN EXISTS (SELECT 1 FROM users u WHERE u.id = r.user_id) THEN r.user_id
            ELSE NULL
        END
    )
FROM recruiters r
WHERE jp.recruiter_id = r.id
  AND (jp.company_id IS NULL OR jp.created_by_recruiter_id IS NULL OR jp.created_by_user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_job_posts_company_id ON job_posts(company_id);

-- ----------------------------
-- 7. MONETIZATION → company_id (skip if tables absent)
-- ----------------------------
DO $$
BEGIN
    IF to_regclass('public.payment_orders') IS NOT NULL THEN
        ALTER TABLE payment_orders
            ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
        ALTER TABLE payment_orders
            ADD COLUMN IF NOT EXISTS paid_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
        UPDATE payment_orders po
        SET company_id = r.company_id,
            paid_by_user_id = COALESCE(po.paid_by_user_id, r.user_id)
        FROM recruiters r
        WHERE po.recruiter_id = r.id
          AND po.company_id IS NULL;
        CREATE INDEX IF NOT EXISTS idx_payment_orders_company_id ON payment_orders(company_id);
    END IF;

    IF to_regclass('public.recruiter_subscriptions') IS NOT NULL THEN
        ALTER TABLE recruiter_subscriptions
            ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
        UPDATE recruiter_subscriptions rs
        SET company_id = r.company_id
        FROM recruiters r
        WHERE rs.recruiter_id = r.id
          AND rs.company_id IS NULL;
        CREATE INDEX IF NOT EXISTS idx_recruiter_subscriptions_company_id ON recruiter_subscriptions(company_id);
    END IF;

    IF to_regclass('public.recruiter_single_posts') IS NOT NULL THEN
        ALTER TABLE recruiter_single_posts
            ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
        UPDATE recruiter_single_posts rsp
        SET company_id = r.company_id
        FROM recruiters r
        WHERE rsp.recruiter_id = r.id
          AND rsp.company_id IS NULL;
        CREATE INDEX IF NOT EXISTS idx_recruiter_single_posts_company_id ON recruiter_single_posts(company_id);
    END IF;

    IF to_regclass('public.job_post_boosts') IS NOT NULL THEN
        ALTER TABLE job_post_boosts
            ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
        UPDATE job_post_boosts jpb
        SET company_id = r.company_id
        FROM recruiters r
        WHERE jpb.recruiter_id = r.id
          AND jpb.company_id IS NULL;
        CREATE INDEX IF NOT EXISTS idx_job_post_boosts_company_id ON job_post_boosts(company_id);
    END IF;

    IF to_regclass('public.subscription_plans') IS NOT NULL THEN
        ALTER TABLE subscription_plans
            ADD COLUMN IF NOT EXISTS max_seats INT NOT NULL DEFAULT 3;
        UPDATE subscription_plans SET max_seats = 1 WHERE lower(name) = 'free';
        UPDATE subscription_plans SET max_seats = 3 WHERE lower(name) = 'starter';
        UPDATE subscription_plans SET max_seats = 10 WHERE lower(name) = 'pro';
        UPDATE subscription_plans SET max_seats = 50 WHERE lower(name) = 'business';
    END IF;
END $$;

-- ----------------------------
-- 8. Employer verification → company_id (skip if table absent)
-- ----------------------------
DO $$
BEGIN
    IF to_regclass('public.employer_verification_applications') IS NOT NULL THEN
        ALTER TABLE employer_verification_applications
            ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
        UPDATE employer_verification_applications eva
        SET company_id = r.company_id
        FROM recruiters r
        WHERE eva.recruiter_id = r.id
          AND eva.company_id IS NULL;
        CREATE INDEX IF NOT EXISTS idx_eva_company_created
            ON employer_verification_applications(company_id, created_at DESC);
    END IF;
END $$;

COMMENT ON TABLE companies IS 'Employer organization; VIP/verification/billing scoped here';
COMMENT ON TABLE company_members IS 'Users belonging to a company with owner|admin|recruiter role';
COMMENT ON TABLE company_invitations IS 'Pending/accepted invites; token stored as hash';
