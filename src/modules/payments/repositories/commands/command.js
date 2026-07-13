class Command {
  constructor(db) {
    this.db = db;
  }

  /**
   * Buat payment order baru
   */
  async insertPaymentOrder({
    id,
    recruiter_id,
    order_type,
    plan_id,
    plan_type,
    job_post_id,
    xendit_invoice_id,
    xendit_external_id,
    amount,
    status,
    invoice_expires_at,
    metadata,
  }) {
    const query = `
      INSERT INTO payment_orders (
        id,
        recruiter_id,
        order_type,
        plan_id,
        plan_type,
        job_post_id,
        xendit_invoice_id,
        xendit_external_id,
        amount,
        status,
        invoice_expires_at,
        metadata
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id, xendit_external_id, status, amount;
    `;
    const values = [
      id,
      recruiter_id,
      order_type,
      plan_id,
      plan_type,
      job_post_id || null,
      xendit_invoice_id || null,
      xendit_external_id,
      amount,
      status,
      invoice_expires_at || null,
      metadata ? JSON.stringify(metadata) : null,
    ];
    return this.db.executeQuery(query, values);
  }

  /**
   * Update status payment order
   */
  async updateOrderStatus({ id, status, paid_at, xendit_invoice_id }) {
    const query = `
      UPDATE payment_orders
      SET
        status = $2,
        paid_at = $3,
        xendit_invoice_id = COALESCE($4, xendit_invoice_id),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, status, recruiter_id, order_type, plan_id, plan_type, job_post_id, metadata;
    `;
    return this.db.executeQuery(query, [id, status, paid_at || null, xendit_invoice_id || null]);
  }

  /**
   * Insert log webhook Xendit
   */
  async insertPaymentLog({ id, payment_order_id, xendit_external_id, event_type, payload }) {
    const query = `
      INSERT INTO payment_logs (id, payment_order_id, xendit_external_id, event_type, payload)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id;
    `;
    return this.db.executeQuery(query, [
      id,
      payment_order_id || null,
      xendit_external_id || null,
      event_type,
      payload ? JSON.stringify(payload) : null,
    ]);
  }

  /**
   * Aktifkan subscription recruiter
   */
  async insertRecruiterSubscription({
    id,
    recruiter_id,
    plan_id,
    payment_order_id,
    starts_at,
    expires_at,
  }) {
    const query = `
      INSERT INTO recruiter_subscriptions (
        id, recruiter_id, plan_id, payment_order_id, starts_at, expires_at, is_active
      )
      VALUES ($1,$2,$3,$4,$5,$6,TRUE)
      RETURNING id;
    `;
    return this.db.executeQuery(query, [
      id,
      recruiter_id,
      plan_id,
      payment_order_id,
      starts_at,
      expires_at,
    ]);
  }

  /**
   * Nonaktifkan subscription lama (sebelum aktifkan yang baru)
   */
  async deactivateOldSubscriptions(recruiter_id) {
    const query = `
      UPDATE recruiter_subscriptions
      SET is_active = FALSE, updated_at = NOW()
      WHERE recruiter_id = $1
        AND is_active = TRUE;
    `;
    return this.db.executeQuery(query, [recruiter_id]);
  }

  /**
   * Buat slot satuan job post untuk recruiter
   */
  async insertRecruiterSinglePost({
    id,
    recruiter_id,
    plan_id,
    payment_order_id,
    expires_at,
  }) {
    const query = `
      INSERT INTO recruiter_single_posts (
        id, recruiter_id, plan_id, payment_order_id, expires_at, is_active, is_used
      )
      VALUES ($1,$2,$3,$4,$5,TRUE,FALSE)
      RETURNING id;
    `;
    return this.db.executeQuery(query, [
      id,
      recruiter_id,
      plan_id,
      payment_order_id,
      expires_at,
    ]);
  }

  /**
   * Tandai slot satuan sebagai telah digunakan
   */
  async markSinglePostAsUsed({ id, job_post_id }) {
    const query = `
      UPDATE recruiter_single_posts
      SET is_used = TRUE, job_post_id = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id;
    `;
    return this.db.executeQuery(query, [id, job_post_id]);
  }

  /**
   * Aktifkan boost untuk job post
   */
  async insertJobPostBoost({
    id,
    job_post_id,
    recruiter_id,
    boost_plan_id,
    payment_order_id,
    starts_at,
    expires_at,
  }) {
    const query = `
      INSERT INTO job_post_boosts (
        id, job_post_id, recruiter_id, boost_plan_id, payment_order_id, starts_at, expires_at, is_active
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE)
      RETURNING id;
    `;
    return this.db.executeQuery(query, [
      id,
      job_post_id,
      recruiter_id,
      boost_plan_id,
      payment_order_id,
      starts_at,
      expires_at,
    ]);
  }

  /**
   * Update boost_type & boost_expires_at di tabel job_posts
   */
  async updateJobPostBoostStatus({ job_post_id, boost_type, boost_expires_at }) {
    const query = `
      UPDATE job_posts
      SET boost_type = $2, boost_expires_at = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING id;
    `;
    return this.db.executeQuery(query, [job_post_id, boost_type, boost_expires_at]);
  }

  /**
   * Update is_hot di job_posts (untuk paket satuan hot)
   */
  async updateJobPostHotStatus({ job_post_id, is_hot }) {
    const query = `
      UPDATE job_posts
      SET is_hot = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id;
    `;
    return this.db.executeQuery(query, [job_post_id, is_hot]);
  }
}

module.exports = Command;
