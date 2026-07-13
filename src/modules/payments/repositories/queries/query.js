class Query {
  constructor(db) {
    this.db = db;
  }

  /**
   * Ambil semua subscription plans
   */
  async getAllSubscriptionPlans() {
    const query = `
      SELECT
        id,
        name,
        display_name,
        max_active_posts,
        price_idr,
        duration_days,
        is_active
      FROM subscription_plans
      WHERE is_active = TRUE
      ORDER BY price_idr ASC;
    `;
    return this.db.executeQuery(query, []);
  }

  /**
   * Ambil semua single post plans
   */
  async getAllSinglePostPlans() {
    const query = `
      SELECT
        id,
        name,
        display_name,
        price_idr,
        duration_days,
        is_hot,
        is_active
      FROM single_post_plans
      WHERE is_active = TRUE
      ORDER BY price_idr ASC;
    `;
    return this.db.executeQuery(query, []);
  }

  /**
   * Ambil semua boost plans
   */
  async getAllBoostPlans() {
    const query = `
      SELECT
        id,
        name,
        display_name,
        price_idr,
        duration_days,
        boost_priority,
        is_active
      FROM boost_plans
      WHERE is_active = TRUE
      ORDER BY boost_priority ASC, duration_days ASC;
    `;
    return this.db.executeQuery(query, []);
  }

  /**
   * Ambil subscription plan by ID
   */
  async getSubscriptionPlanById(id) {
    const query = `
      SELECT id, name, display_name, max_active_posts, price_idr, duration_days, is_active
      FROM subscription_plans
      WHERE id = $1 AND is_active = TRUE
      LIMIT 1;
    `;
    return this.db.executeQuery(query, [id]);
  }

  /**
   * Ambil single post plan by ID
   */
  async getSinglePostPlanById(id) {
    const query = `
      SELECT id, name, display_name, price_idr, duration_days, is_hot, is_active
      FROM single_post_plans
      WHERE id = $1 AND is_active = TRUE
      LIMIT 1;
    `;
    return this.db.executeQuery(query, [id]);
  }

  /**
   * Ambil boost plan by ID
   */
  async getBoostPlanById(id) {
    const query = `
      SELECT id, name, display_name, price_idr, duration_days, boost_priority, is_active
      FROM boost_plans
      WHERE id = $1 AND is_active = TRUE
      LIMIT 1;
    `;
    return this.db.executeQuery(query, [id]);
  }

  /**
   * Ambil payment orders recruiter dengan pagination
   */
  async getPaymentOrders({ recruiter_id, status, order_type, limit, offset }) {
    const conditions = [`po.recruiter_id = $1`];
    const values = [recruiter_id];
    let idx = 2;

    if (status) {
      conditions.push(`po.status = $${idx}`);
      values.push(status);
      idx++;
    }
    if (order_type) {
      conditions.push(`po.order_type = $${idx}`);
      values.push(order_type);
      idx++;
    }

    const whereClause = conditions.join(" AND ");

    const query = `
      SELECT
        po.id,
        po.order_type,
        po.plan_id,
        po.plan_type,
        po.job_post_id,
        po.xendit_invoice_id,
        po.xendit_external_id,
        po.amount,
        po.status,
        po.paid_at,
        po.invoice_expires_at,
        po.metadata,
        po.created_at,
        po.updated_at
      FROM payment_orders po
      WHERE ${whereClause}
      ORDER BY po.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1};
    `;
    values.push(limit, offset);

    return this.db.executeQuery(query, values);
  }

  /**
   * Hitung total payment orders untuk pagination
   */
  async countPaymentOrders({ recruiter_id, status, order_type }) {
    const conditions = [`po.recruiter_id = $1`];
    const values = [recruiter_id];
    let idx = 2;

    if (status) {
      conditions.push(`po.status = $${idx}`);
      values.push(status);
      idx++;
    }
    if (order_type) {
      conditions.push(`po.order_type = $${idx}`);
      values.push(order_type);
      idx++;
    }

    const whereClause = conditions.join(" AND ");
    const query = `SELECT COUNT(*) FROM payment_orders po WHERE ${whereClause};`;

    return this.db.executeQuery(query, values);
  }

  /**
   * Ambil detail satu order
   */
  async getOrderDetail({ id, recruiter_id }) {
    const query = `
      SELECT
        po.id,
        po.order_type,
        po.plan_id,
        po.plan_type,
        po.job_post_id,
        po.xendit_invoice_id,
        po.xendit_external_id,
        po.amount,
        po.status,
        po.paid_at,
        po.invoice_expires_at,
        po.metadata,
        po.created_at,
        po.updated_at
      FROM payment_orders po
      WHERE po.id = $1
        AND po.recruiter_id = $2
      LIMIT 1;
    `;
    return this.db.executeQuery(query, [id, recruiter_id]);
  }

  /**
   * Ambil order berdasarkan xendit_external_id (untuk webhook)
   */
  async getOrderByExternalId(xendit_external_id) {
    const query = `
      SELECT
        id,
        recruiter_id,
        order_type,
        plan_id,
        plan_type,
        job_post_id,
        xendit_invoice_id,
        amount,
        status,
        metadata
      FROM payment_orders
      WHERE xendit_external_id = $1
      LIMIT 1;
    `;
    return this.db.executeQuery(query, [xendit_external_id]);
  }

  /**
   * Ambil paket subscription aktif recruiter
   */
  async getActiveSubscription(recruiter_id) {
    const query = `
      SELECT
        rs.id,
        rs.recruiter_id,
        rs.plan_id,
        rs.starts_at,
        rs.expires_at,
        rs.is_active,
        sp.name AS plan_name,
        sp.display_name AS plan_display_name,
        sp.max_active_posts,
        sp.price_idr,
        sp.duration_days
      FROM recruiter_subscriptions rs
      JOIN subscription_plans sp ON sp.id = rs.plan_id
      WHERE rs.recruiter_id = $1
        AND rs.is_active = TRUE
        AND rs.expires_at > NOW()
      ORDER BY rs.expires_at DESC
      LIMIT 1;
    `;
    return this.db.executeQuery(query, [recruiter_id]);
  }

  /**
   * Ambil slot satuan yang belum digunakan milik recruiter
   */
  async getAvailableSinglePosts(recruiter_id) {
    const query = `
      SELECT
        rsp.id,
        rsp.plan_id,
        rsp.is_used,
        rsp.expires_at,
        spp.name AS plan_name,
        spp.display_name AS plan_display_name,
        spp.is_hot,
        spp.price_idr
      FROM recruiter_single_posts rsp
      JOIN single_post_plans spp ON spp.id = rsp.plan_id
      WHERE rsp.recruiter_id = $1
        AND rsp.is_active = TRUE
        AND rsp.is_used = FALSE
        AND rsp.expires_at > NOW()
      ORDER BY rsp.expires_at ASC;
    `;
    return this.db.executeQuery(query, [recruiter_id]);
  }

  /**
   * Hitung jumlah job post aktif recruiter
   */
  async countActiveJobPosts(recruiter_id) {
    const query = `
      SELECT COUNT(*) AS count
      FROM job_posts jp
      WHERE jp.recruiter_id = $1
        AND jp.archived_at IS NULL
        AND jp.status_id IN (
          SELECT id FROM job_post_statuses WHERE name IN ('active', 'published')
        );
    `;
    return this.db.executeQuery(query, [recruiter_id]);
  }

  /**
   * Hitung job post aktif menggunakan fallback status (untuk project ini)
   */
  async countActiveJobPostsFallback(recruiter_id) {
    const query = `
      SELECT COUNT(*) AS count
      FROM job_posts
      WHERE recruiter_id = $1
        AND archived_at IS NULL
        AND deleted_at IS NULL;
    `;
    return this.db.executeQuery(query, [recruiter_id]);
  }

  /**
   * Ambil boost aktif sebuah job post
   */
  async getActiveBoostByJobPost(job_post_id) {
    const query = `
      SELECT
        jb.id,
        jb.job_post_id,
        jb.boost_plan_id,
        jb.starts_at,
        jb.expires_at,
        jb.is_active,
        bp.name AS boost_name,
        bp.boost_priority
      FROM job_post_boosts jb
      JOIN boost_plans bp ON bp.id = jb.boost_plan_id
      WHERE jb.job_post_id = $1
        AND jb.is_active = TRUE
        AND jb.expires_at > NOW()
      ORDER BY bp.boost_priority ASC
      LIMIT 1;
    `;
    return this.db.executeQuery(query, [job_post_id]);
  }

  /**
   * Cek apakah job post milik recruiter
   */
  async getJobPostOwner(job_post_id) {
    const query = `
      SELECT id, recruiter_id
      FROM job_posts
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1;
    `;
    return this.db.executeQuery(query, [job_post_id]);
  }
}

module.exports = Query;
