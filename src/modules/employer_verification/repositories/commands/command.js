class Command {
  constructor(db) {
    this.db = db;
  }

  async createApplication(row) {
    const result = await this.db.executeQuery(
      `INSERT INTO employer_verification_applications
        (id, recruiter_id, company_id, status, company_legal_name, npwp_number, nib_number, applicant_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        row.id,
        row.recruiter_id,
        row.company_id || null,
        row.status,
        row.company_legal_name || null,
        row.npwp_number || null,
        row.nib_number || null,
        row.applicant_notes || null,
      ]
    );
    return result?.rows?.[0] || null;
  }

  async updateApplicationDraft(row) {
    const result = await this.db.executeQuery(
      `UPDATE employer_verification_applications
       SET company_legal_name = COALESCE($2, company_legal_name),
           npwp_number = COALESCE($3, npwp_number),
           nib_number = COALESCE($4, nib_number),
           applicant_notes = COALESCE($5, applicant_notes),
           updated_at = NOW()
       WHERE id = $1 AND status = 'draft'
       RETURNING *`,
      [
        row.id,
        row.company_legal_name,
        row.npwp_number,
        row.nib_number,
        row.applicant_notes,
      ]
    );
    return result?.rows?.[0] || null;
  }

  async upsertDocument(row) {
    const result = await this.db.executeQuery(
      `INSERT INTO employer_verification_documents
        (id, application_id, doc_type, file_url, file_name, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (application_id, doc_type)
       DO UPDATE SET
         file_url = EXCLUDED.file_url,
         file_name = EXCLUDED.file_name,
         mime_type = EXCLUDED.mime_type,
         uploaded_at = NOW()
       RETURNING *`,
      [
        row.id,
        row.application_id,
        row.doc_type,
        row.file_url,
        row.file_name || null,
        row.mime_type || null,
      ]
    );
    return result?.rows?.[0] || null;
  }

  async deleteDocument(applicationId, docType) {
    const result = await this.db.executeQuery(
      `DELETE FROM employer_verification_documents
       WHERE application_id = $1 AND doc_type = $2
       RETURNING *`,
      [applicationId, docType]
    );
    return result?.rows?.[0] || null;
  }

  async submitApplication(applicationId) {
    const result = await this.db.executeQuery(
      `UPDATE employer_verification_applications
       SET status = 'submitted',
           submitted_at = NOW(),
           updated_at = NOW(),
           rejection_reason = NULL,
           admin_note = NULL
       WHERE id = $1 AND status IN ('draft', 'rejected')
       RETURNING *`,
      [applicationId]
    );
    return result?.rows?.[0] || null;
  }

  async setRecruiterVerificationStatus(recruiterId, status, deadlineAt) {
    const result = await this.db.executeQuery(
      `UPDATE recruiters
       SET verification_status = $2,
           verification_deadline_at = COALESCE($3, verification_deadline_at),
           updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, verification_status, verification_deadline_at, is_verified`,
      [recruiterId, status, deadlineAt]
    );
    await this.db.executeQuery(
      `
      UPDATE companies c
      SET verification_status = $2,
          verification_deadline_at = COALESCE($3, c.verification_deadline_at),
          updated_at = NOW()
      FROM recruiters r
      WHERE r.id = $1 AND c.id = r.company_id
      `,
      [recruiterId, status, deadlineAt]
    );
    return result?.rows?.[0] || null;
  }

  async createReactivationRequest(row) {
    const result = await this.db.executeQuery(
      `INSERT INTO account_reactivation_requests
        (id, user_id, recruiter_id, application_id, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'open')
       RETURNING *`,
      [
        row.id,
        row.user_id,
        row.recruiter_id,
        row.application_id || null,
        row.reason || null,
      ]
    );
    return result?.rows?.[0] || null;
  }

  async reviewApplication({
    id,
    status,
    admin_note,
    rejection_reason,
    reviewed_by,
  }) {
    const result = await this.db.executeQuery(
      `UPDATE employer_verification_applications
       SET status = $2,
           admin_note = $3,
           rejection_reason = $4,
           reviewed_by = $5,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND status IN ('submitted', 'under_review')
       RETURNING *`,
      [id, status, admin_note || null, rejection_reason || null, reviewed_by]
    );
    return result?.rows?.[0] || null;
  }

  async approveRecruiterVerified(recruiterId) {
    const result = await this.db.executeQuery(
      `UPDATE recruiters
       SET is_verified = TRUE,
           verification_status = 'verified',
           verification_deadline_at = NULL,
           updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [recruiterId]
    );
    await this.db.executeQuery(
      `
      UPDATE companies c
      SET is_verified = TRUE,
          verification_status = 'verified',
          verification_deadline_at = NULL,
          updated_at = NOW()
      FROM recruiters r
      WHERE r.id = $1 AND c.id = r.company_id
      `,
      [recruiterId]
    );
    return result?.rows?.[0] || null;
  }

  async rejectRecruiterVerification(recruiterId) {
    const result = await this.db.executeQuery(
      `UPDATE recruiters
       SET is_verified = FALSE,
           verification_status = 'rejected',
           updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [recruiterId]
    );
    await this.db.executeQuery(
      `
      UPDATE companies c
      SET is_verified = FALSE,
          verification_status = 'rejected',
          updated_at = NOW()
      FROM recruiters r
      WHERE r.id = $1 AND c.id = r.company_id
      `,
      [recruiterId]
    );
    return result?.rows?.[0] || null;
  }

  async unsuspendUser(userId) {
    const result = await this.db.executeQuery(
      `UPDATE users
       SET is_suspended = FALSE,
           suspension_reason = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, is_suspended, suspension_reason`,
      [userId]
    );
    return result?.rows?.[0] || null;
  }

  async closeOpenReactivationRequests(recruiterId, status, reviewedBy, adminNote) {
    const result = await this.db.executeQuery(
      `UPDATE account_reactivation_requests
       SET status = $2,
           admin_note = COALESCE($3, admin_note),
           reviewed_by = $4,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE recruiter_id = $1 AND status = 'open'
       RETURNING id`,
      [recruiterId, status, adminNote || null, reviewedBy]
    );
    return result?.rowCount || 0;
  }

  async markUnderReview(applicationId) {
    const result = await this.db.executeQuery(
      `UPDATE employer_verification_applications
       SET status = 'under_review', updated_at = NOW()
       WHERE id = $1 AND status = 'submitted'
       RETURNING *`,
      [applicationId]
    );
    return result?.rows?.[0] || null;
  }

  async autoBlockExpiredRecruiters() {
    const result = await this.db.executeQuery(
      `WITH targets AS (
         SELECT r.id AS recruiter_id, r.user_id
         FROM recruiters r
         JOIN users u ON u.id = r.user_id AND u.deleted_at IS NULL
         WHERE r.deleted_at IS NULL
           AND r.is_verified IS NOT TRUE
           AND r.verification_status IN ('grace', 'rejected', 'blocked_incomplete')
           AND r.verification_deadline_at IS NOT NULL
           AND r.verification_deadline_at < NOW()
           AND NOT EXISTS (
             SELECT 1 FROM employer_verification_applications a
             WHERE a.recruiter_id = r.id
               AND a.status IN ('submitted', 'under_review')
           )
           AND (
             u.is_suspended IS NOT TRUE
             OR COALESCE(u.suspension_reason, '') <> 'verification_incomplete'
           )
       ),
       upd_users AS (
         UPDATE users u
         SET is_suspended = TRUE,
             suspension_reason = 'verification_incomplete',
             updated_at = NOW()
         FROM targets t
         WHERE u.id = t.user_id
         RETURNING u.id
       ),
       upd_recruiters AS (
         UPDATE recruiters r
         SET verification_status = 'blocked_incomplete',
             updated_at = NOW()
         FROM targets t
         WHERE r.id = t.recruiter_id
         RETURNING r.id, r.company_id
       ),
       upd_companies AS (
         UPDATE companies c
         SET verification_status = 'blocked_incomplete',
             updated_at = NOW()
         FROM upd_recruiters ur
         WHERE c.id = ur.company_id
         RETURNING c.id
       )
       SELECT
         (SELECT COUNT(*)::int FROM upd_users) AS users_blocked,
         (SELECT COUNT(*)::int FROM upd_recruiters) AS recruiters_marked`
    );
    return result?.rows?.[0] || { users_blocked: 0, recruiters_marked: 0 };
  }
}

module.exports = Command;
