// Mapping :type pada /admin/plans/:type ke tabel plan + kolom spesifik per tipe.
const PLAN_CONFIG = {
  subscription: {
    table: "subscription_plans",
    extraColumn: "max_active_posts",
    select: "id, name, display_name, max_active_posts, price_idr, duration_days, is_active, created_at",
  },
  single_post: {
    table: "single_post_plans",
    extraColumn: "is_hot",
    select: "id, name, display_name, price_idr, duration_days, is_hot, is_active, created_at",
  },
  boost: {
    table: "boost_plans",
    extraColumn: "boost_priority",
    select: "id, name, display_name, price_idr, duration_days, boost_priority, is_active, created_at",
  },
};

module.exports = { PLAN_CONFIG };
