class Query {
  constructor(db) {
    this.db = db;
  }

  async findCompanyById(id) {
    return this.db.executeQuery(
      `
      SELECT
        c.*,
        i.name AS industry_name
      FROM companies c
      LEFT JOIN industries i ON i.id = c.industry_id
      WHERE c.id = $1 AND c.deleted_at IS NULL
      LIMIT 1
      `,
      [id]
    );
  }

  async listCompanies({ search, industry_id, page, limit }) {
    const offset = (page - 1) * limit;
    const conditions = [`c.deleted_at IS NULL`];
    const values = [];
    let idx = 1;

    if (search) {
      conditions.push(`c.company_name ILIKE $${idx}`);
      values.push(`%${search}%`);
      idx += 1;
    }
    if (industry_id) {
      conditions.push(`c.industry_id = $${idx}`);
      values.push(industry_id);
      idx += 1;
    }

    const where = conditions.join(" AND ");
    const listValues = [...values, limit, offset];
    const list = await this.db.executeQuery(
      `
      SELECT
        c.id,
        c.company_name,
        c.avatar_url,
        c.company_website,
        c.address,
        c.industry_id,
        i.name AS industry_name,
        c.description,
        c.employee_count,
        c.is_vip,
        c.is_verified,
        c.verification_status,
        c.created_at
      FROM companies c
      LEFT JOIN industries i ON i.id = c.industry_id
      WHERE ${where}
      ORDER BY c.company_name ASC
      LIMIT $${idx} OFFSET $${idx + 1}
      `,
      listValues
    );

    const count = await this.db.executeQuery(
      `SELECT COUNT(*)::int AS total FROM companies c WHERE ${where}`,
      values
    );

    return { list, count };
  }

  async listMembers(companyId) {
    return this.db.executeQuery(
      `
      SELECT
        cm.id,
        cm.company_id,
        cm.user_id,
        cm.role,
        cm.status,
        cm.joined_at,
        u.email,
        u.username,
        r.id AS recruiter_id,
        r.contact_name,
        r.avatar_url,
        r.contact_phone
      FROM company_members cm
      INNER JOIN users u ON u.id = cm.user_id
      LEFT JOIN recruiters r ON r.user_id = cm.user_id AND r.company_id = cm.company_id
      WHERE cm.company_id = $1
      ORDER BY
        CASE cm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END,
        cm.joined_at ASC
      `,
      [companyId]
    );
  }

  async findMember({ companyId, userId }) {
    return this.db.executeQuery(
      `
      SELECT * FROM company_members
      WHERE company_id = $1 AND user_id = $2
      LIMIT 1
      `,
      [companyId, userId]
    );
  }

  async countActiveMembers(companyId) {
    return this.db.executeQuery(
      `
      SELECT COUNT(*)::int AS total
      FROM company_members
      WHERE company_id = $1 AND status = 'active'
      `,
      [companyId]
    );
  }

  async listInvitations(companyId) {
    return this.db.executeQuery(
      `
      SELECT
        ci.id,
        ci.company_id,
        ci.email,
        ci.role,
        ci.status,
        ci.expires_at,
        ci.created_at,
        ci.invited_by,
        u.email AS invited_by_email,
        r.contact_name AS invited_by_name
      FROM company_invitations ci
      LEFT JOIN users u ON u.id = ci.invited_by
      LEFT JOIN recruiters r ON r.user_id = ci.invited_by AND r.company_id = ci.company_id
      WHERE ci.company_id = $1
      ORDER BY ci.created_at DESC
      `,
      [companyId]
    );
  }

  async findPendingInviteByTokenHash(tokenHash) {
    return this.db.executeQuery(
      `
      SELECT
        ci.*,
        c.company_name,
        c.avatar_url AS company_avatar_url
      FROM company_invitations ci
      INNER JOIN companies c ON c.id = ci.company_id AND c.deleted_at IS NULL
      WHERE ci.token_hash = $1
        AND ci.status = 'pending'
      LIMIT 1
      `,
      [tokenHash]
    );
  }

  async findPendingInviteByEmail(companyId, email) {
    const { encrypt } = require("../../../../helpers/utils/crypto_helper");
    const encryptedEmail = encrypt(String(email).trim().toLowerCase());
    return this.db.executeQuery(
      `
      SELECT * FROM company_invitations
      WHERE company_id = $1
        AND lower(email) = lower($2)
        AND status = 'pending'
      LIMIT 1
      `,
      [companyId, encryptedEmail]
    );
  }

  async getActivePlanMaxSeats(companyId) {
    return this.db.executeQuery(
      `
      SELECT sp.max_seats, sp.name, sp.display_name
      FROM recruiter_subscriptions rs
      INNER JOIN subscription_plans sp ON sp.id = rs.plan_id
      WHERE rs.company_id = $1
        AND rs.is_active = TRUE
        AND (rs.expires_at IS NULL OR rs.expires_at > NOW())
      ORDER BY rs.created_at DESC
      LIMIT 1
      `,
      [companyId]
    );
  }

  async findUserByEmail(email) {
    const { encrypt } = require("../../../../helpers/utils/crypto_helper");
    const normalized = String(email).trim().toLowerCase();
    const encryptedEmail = encrypt(normalized);
    // Match users module: email/username stored as encrypted deterministic ciphertext.
    return this.db.executeQuery(
      `
      SELECT id, email, role_id, username
      FROM users
      WHERE email = $1 OR username = $1
      LIMIT 1
      `,
      [encryptedEmail]
    );
  }
}

module.exports = Query;
