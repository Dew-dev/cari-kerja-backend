-- ============================================================
-- MONETIZATION MIGRATION
-- Fitur: Subscription Plan, Paket Satuan, Boost Job Post, Payment Orders
-- ============================================================

-- ----------------------------
-- 1. SUBSCRIPTION PLANS
-- Paket langganan: Free, Starter, Pro, Business
-- ----------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    max_active_posts INT NOT NULL DEFAULT 1,
    price_idr BIGINT NOT NULL DEFAULT 0,
    duration_days INT NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ----------------------------
-- 2. SINGLE POST PLANS
-- Paket satuan: Regular, Hot
-- ----------------------------
CREATE TABLE IF NOT EXISTS single_post_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    price_idr BIGINT NOT NULL DEFAULT 0,
    duration_days INT NOT NULL DEFAULT 30,
    is_hot BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ----------------------------
-- 3. BOOST PLANS
-- Paket boost: Top10 (10 teratas/hari), Hot (paling atas)
-- ----------------------------
CREATE TABLE IF NOT EXISTS boost_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    price_idr BIGINT NOT NULL DEFAULT 0,
    duration_days INT NOT NULL DEFAULT 1,
    boost_priority INT NOT NULL DEFAULT 10,
    -- 1 = HOT (paling atas), 10 = TOP10 (10 teratas)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ----------------------------
-- 4. PAYMENT ORDERS
-- Semua transaksi pembayaran (subscription, satuan, boost)
-- ----------------------------
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
    order_type VARCHAR(50) NOT NULL,
    -- 'subscription' | 'single_post' | 'boost'
    plan_id INT NOT NULL,
    -- referensi ke plan terkait (polymorphic by order_type)
    plan_type VARCHAR(50) NOT NULL,
    -- 'subscription_plans' | 'single_post_plans' | 'boost_plans'
    job_post_id UUID REFERENCES job_posts(id) ON DELETE SET NULL,
    -- hanya untuk order_type = 'boost'
    xendit_invoice_id VARCHAR(255),
    xendit_external_id VARCHAR(255) UNIQUE,
    amount BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending | paid | expired | failed
    paid_at TIMESTAMP WITH TIME ZONE,
    invoice_expires_at TIMESTAMP WITH TIME ZONE,
    -- expire invoice Xendit
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ----------------------------
-- 5. RECRUITER SUBSCRIPTIONS
-- Langganan aktif per recruiter
-- ----------------------------
CREATE TABLE IF NOT EXISTS recruiter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
    plan_id INT NOT NULL REFERENCES subscription_plans(id),
    payment_order_id UUID REFERENCES payment_orders(id) ON DELETE SET NULL,
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ----------------------------
-- 6. RECRUITER SINGLE POSTS
-- Slot job post satuan yang dibeli recruiter
-- ----------------------------
CREATE TABLE IF NOT EXISTS recruiter_single_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
    plan_id INT NOT NULL REFERENCES single_post_plans(id),
    payment_order_id UUID REFERENCES payment_orders(id) ON DELETE SET NULL,
    job_post_id UUID REFERENCES job_posts(id) ON DELETE SET NULL,
    -- diisi saat slot digunakan
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    -- berlaku 30 hari sejak diaktifkan
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ----------------------------
-- 7. JOB POST BOOSTS
-- Boost aktif per job post
-- ----------------------------
CREATE TABLE IF NOT EXISTS job_post_boosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_post_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
    boost_plan_id INT NOT NULL REFERENCES boost_plans(id),
    payment_order_id UUID REFERENCES payment_orders(id) ON DELETE SET NULL,
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ----------------------------
-- 8. PAYMENT LOGS
-- Log event webhook dari Xendit
-- ----------------------------
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_order_id UUID REFERENCES payment_orders(id) ON DELETE SET NULL,
    xendit_external_id VARCHAR(255),
    event_type VARCHAR(100),
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ----------------------------
-- 9. ALTER JOB_POSTS
-- Tambah kolom boost_type dan boost_expires_at
-- ----------------------------
ALTER TABLE job_posts
    ADD COLUMN IF NOT EXISTS boost_type VARCHAR(20) DEFAULT NULL,
    -- null | 'top10' | 'hot'
    ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS is_hot BOOLEAN NOT NULL DEFAULT FALSE;
    -- untuk paket satuan hot

-- ----------------------------
-- 10. INDEXES
-- ----------------------------
CREATE INDEX IF NOT EXISTS idx_payment_orders_recruiter_id ON payment_orders(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_xendit_external_id ON payment_orders(xendit_external_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_subscriptions_recruiter_id ON recruiter_subscriptions(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_subscriptions_is_active ON recruiter_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_recruiter_single_posts_recruiter_id ON recruiter_single_posts(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_job_post_boosts_job_post_id ON job_post_boosts(job_post_id);
CREATE INDEX IF NOT EXISTS idx_job_post_boosts_is_active ON job_post_boosts(is_active);
CREATE INDEX IF NOT EXISTS idx_job_posts_boost_type ON job_posts(boost_type);
