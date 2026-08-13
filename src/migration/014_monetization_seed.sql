-- ============================================================
-- MONETIZATION SEED DATA
-- Harga dalam Rupiah (bisa diubah sesuai kebutuhan bisnis)
-- ============================================================

-- ----------------------------
-- Subscription Plans
-- ----------------------------
INSERT INTO subscription_plans (name, display_name, max_active_posts, price_idr, duration_days, is_active)
VALUES
    ('free',     'Paket Free',       1,  0,         30, TRUE),
    ('starter',  'Paket Starter',    5,  199000,    30, TRUE),
    ('pro',      'Paket Pro',        15, 449000,    30, TRUE),
    ('business', 'Paket Business',   25, 799000,    30, TRUE)
ON CONFLICT (name) DO UPDATE SET
    display_name     = EXCLUDED.display_name,
    max_active_posts = EXCLUDED.max_active_posts,
    price_idr        = EXCLUDED.price_idr,
    duration_days    = EXCLUDED.duration_days,
    is_active        = EXCLUDED.is_active;

-- ----------------------------
-- Single Post Plans
-- ----------------------------
INSERT INTO single_post_plans (name, display_name, price_idr, duration_days, is_hot, is_active)
VALUES
    ('regular', 'Iklan Regular',  99000,  30, FALSE, TRUE),
    ('hot',     'Iklan Hot',      199000, 30, TRUE,  TRUE)
ON CONFLICT (name) DO UPDATE SET
    display_name  = EXCLUDED.display_name,
    price_idr     = EXCLUDED.price_idr,
    duration_days = EXCLUDED.duration_days,
    is_hot        = EXCLUDED.is_hot,
    is_active     = EXCLUDED.is_active;

-- ----------------------------
-- Boost Plans
-- boost_priority: 1 = HOT (paling atas), 10 = TOP10 (10 teratas)
-- ----------------------------
INSERT INTO boost_plans (name, display_name, price_idr, duration_days, boost_priority, is_active)
VALUES
    ('top10_1day',  'Boost Top-10 (1 Hari)',   49000,  1, 10, TRUE),
    ('top10_7day',  'Boost Top-10 (7 Hari)',   299000, 7, 10, TRUE),
    ('hot_1day',    'Boost Hot (1 Hari)',       99000,  1,  1, TRUE),
    ('hot_7day',    'Boost Hot (7 Hari)',       599000, 7,  1, TRUE)
ON CONFLICT (name) DO UPDATE SET
    display_name    = EXCLUDED.display_name,
    price_idr       = EXCLUDED.price_idr,
    duration_days   = EXCLUDED.duration_days,
    boost_priority  = EXCLUDED.boost_priority,
    is_active       = EXCLUDED.is_active;
