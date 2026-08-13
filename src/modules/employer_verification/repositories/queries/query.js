class Query {
  constructor(db) {
    this.db = db;
  }

  async findRecruiterByUserId(userId) {
    const result = await this.db.executeQuery(
      `SELECT r.id, r.user_id, r.company_id,
              COALESCE(c.company_name, r.company_name) AS company_name,
              COALESCE(c.is_verified, r.is_verified) AS is_verified,
              COALESCE(c.verification_status, r.verification_status) AS verification_status,
              COALESCE(c.verification_deadline_at, r.verification_deadline_at) AS verification_deadline_at,
              u.is_suspended, u.suspension_reason, u.email
       FROM recruiters r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN companies c ON c.id = r.company_id AND c.deleted_at IS NULL
       WHERE r.user_id = $1 AND r.deleted_at IS NULL AND u.deleted_at IS NULL
       LIMIT 1`,
      [userId]
    );
    return result?.rows?.[0] || null;
  }

  async findRecruiterById(recruiterId) {
    const result = await this.db.executeQuery(
      `SELECT r.id, r.user_id, r.company_name, r.is_verified,
              r.verification_status, r.verification_deadline_at,
              u.is_suspended, u.suspension_reason, u.email
       FROM recruiters r
       JOIN users u ON u.id = r.user_id
       WHERE r.id = $1 AND r.deleted_at IS NULL AND u.deleted_at IS NULL
       LIMIT 1`,
      [recruiterId]
    );
    return result?.rows?.[0] || null;
  }

  async findLatestApplication(recruiterId) {
    const result = await this.db.executeQuery(
      `SELECT *
       FROM employer_verification_applications
       WHERE recruiter_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [recruiterId]
    );
    return result?.rows?.[0] || null;
  }

  async findApplicationById(id) {
    const result = await this.db.executeQuery(
      `SELECT a.*,
              r.company_name, r.user_id, r.is_verified, r.verification_status,
              r.verification_deadline_at,
              u.email, u.username, u.is_suspended, u.suspension_reason
       FROM employer_verification_applications a
       JOIN recruiters r ON r.id = a.recruiter_id
       JOIN users u ON u.id = r.user_id
       WHERE a.id = $1
       LIMIT 1`,
      [id]
    );
    return result?.rows?.[0] || null;
  }

  async findDocuments(applicationId) {
    const result = await this.db.executeQuery(
      `SELECT id, application_id, doc_type, file_url, file_name, mime_type, uploaded_at
       FROM employer_verification_documents
       WHERE application_id = $1
       ORDER BY uploaded_at ASC`,
      [applicationId]
    );
    return result?.rows || [];
  }

  async findOpenReactivation(recruiterId) {
    const result = await this.db.executeQuery(
      `SELECT *
       FROM account_reactivation_requests
       WHERE recruiter_id = $1 AND status = 'open'
       ORDER BY created_at DESC
       LIMIT 1`,
      [recruiterId]
    );
    return result?.rows?.[0] || null;
  }

  async listApplications({ status, page, limit }) {
    const offset = (page - 1) * limit;
    const params = [];
    let where = "WHERE 1=1";
    if (status) {
      params.push(status);
      where += ` AND a.status = $${params.length}`;
    }
    params.push(limit, offset);

    const countResult = await this.db.executeQuery(
      `SELECT COUNT(*)::int AS total
       FROM employer_verification_applications a
       ${where}`,
      status ? [status] : []
    );

    const listResult = await this.db.executeQuery(
      `SELECT a.id, a.recruiter_id, a.status, a.company_legal_name, a.npwp_number,
              a.nib_number, a.submitted_at, a.reviewed_at, a.created_at,
              r.company_name, r.verification_status, r.is_verified,
              u.email, u.is_suspended, u.suspension_reason
       FROM employer_verification_applications a
       JOIN recruiters r ON r.id = a.recruiter_id
       JOIN users u ON u.id = r.user_id
       ${where}
       ORDER BY COALESCE(a.submitted_at, a.created_at) DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      data: listResult?.rows || [],
      total: countResult?.rows?.[0]?.total || 0,
    };
  }

  async listReactivationRequests({ status, page, limit }) {
    const offset = (page - 1) * limit;
    const params = [];
    let where = "WHERE 1=1";
    if (status) {
      params.push(status);
      where += ` AND arr.status = $${params.length}`;
    }
    params.push(limit, offset);

    const countResult = await this.db.executeQuery(
      `SELECT COUNT(*)::int AS total
       FROM account_reactivation_requests arr
       ${where}`,
      status ? [status] : []
    );

    const listResult = await this.db.executeQuery(
      `SELECT arr.*,
              r.company_name, r.verification_status, r.is_verified,
              u.email, u.is_suspended, u.suspension_reason,
              a.status AS application_status, a.submitted_at
       FROM account_reactivation_requests arr
       JOIN recruiters r ON r.id = arr.recruiter_id
       JOIN users u ON u.id = arr.user_id
       LEFT JOIN employer_verification_applications a ON a.id = arr.application_id
       ${where}
       ORDER BY arr.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      data: listResult?.rows || [],
      total: countResult?.rows?.[0]?.total || 0,
    };
  }
}

module.exports = Query;
