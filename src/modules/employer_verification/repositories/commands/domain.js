const { v4: uuidv4 } = require("uuid");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const {
  NotFoundError,
  BadRequestError,
  ConflictError,
  InternalServerError,
} = require("../../../../helpers/errors");
const {
  REQUIRED_DOC_TYPES,
  OPTIONAL_DOC_TYPES,
  ALL_DOC_TYPES,
  DOC_TYPE_LABELS,
  SUSPENSION_REASON_VERIFICATION,
  VERIFICATION_STATUSES,
  APPLICATION_STATUSES,
} = require("../../../../helpers/fraud/employer_verification_docs");
const {
  readEmployerVerificationSettings,
} = require("../../../../helpers/fraud/employer_verification_settings");

class EmployerVerificationCommand {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  _missingRequired(documents) {
    const have = new Set((documents || []).map((d) => d.doc_type));
    return REQUIRED_DOC_TYPES.filter((t) => !have.has(t));
  }

  async _requireRecruiter(userId) {
    const recruiter = await this.query.findRecruiterByUserId(userId);
    if (!recruiter) {
      return { err: wrapper.error(new NotFoundError("Recruiter profile not found")) };
    }
    return { recruiter };
  }

  async upsertDraft(payload) {
    const { user_id, company_legal_name, npwp_number, nib_number, applicant_notes } =
      payload;
    const loaded = await this._requireRecruiter(user_id);
    if (loaded.err) return loaded.err;
    const { recruiter } = loaded;

    if (recruiter.is_verified) {
      return wrapper.error(
        new BadRequestError("Company is already verified")
      );
    }

    let application = await this.query.findLatestApplication(recruiter.id);

    if (
      application &&
      [APPLICATION_STATUSES.SUBMITTED, APPLICATION_STATUSES.UNDER_REVIEW].includes(
        application.status
      )
    ) {
      return wrapper.error(
        new ConflictError(
          "Application is already under review. Wait for admin decision before editing."
        )
      );
    }

    if (
      application &&
      application.status === APPLICATION_STATUSES.APPROVED
    ) {
      return wrapper.error(new BadRequestError("Application already approved"));
    }

    if (!application || application.status === APPLICATION_STATUSES.REJECTED) {
      application = await this.command.createApplication({
        id: uuidv4(),
        recruiter_id: recruiter.id,
        company_id: recruiter.company_id || null,
        status: APPLICATION_STATUSES.DRAFT,
        company_legal_name,
        npwp_number,
        nib_number,
        applicant_notes,
      });
      if (!application) {
        return wrapper.error(new InternalServerError("Failed to create application"));
      }
    } else {
      application = await this.command.updateApplicationDraft({
        id: application.id,
        company_legal_name,
        npwp_number,
        nib_number,
        applicant_notes,
      });
      if (!application) {
        return wrapper.error(new InternalServerError("Failed to update application"));
      }
    }

    const documents = await this.query.findDocuments(application.id);
    return wrapper.data({
      application,
      documents,
      missing_required: this._missingRequired(documents),
    });
  }

  async uploadDocument(payload) {
    const { user_id, doc_type, file_url, file_name, mime_type } = payload;

    if (!ALL_DOC_TYPES.includes(doc_type)) {
      return wrapper.error(new BadRequestError("Invalid document type"));
    }

    const loaded = await this._requireRecruiter(user_id);
    if (loaded.err) return loaded.err;
    const { recruiter } = loaded;

    if (recruiter.is_verified) {
      return wrapper.error(new BadRequestError("Company is already verified"));
    }

    let application = await this.query.findLatestApplication(recruiter.id);
    if (
      application &&
      [APPLICATION_STATUSES.SUBMITTED, APPLICATION_STATUSES.UNDER_REVIEW].includes(
        application.status
      )
    ) {
      return wrapper.error(
        new ConflictError("Cannot upload documents while application is under review")
      );
    }

    if (!application || application.status === APPLICATION_STATUSES.REJECTED) {
      application = await this.command.createApplication({
        id: uuidv4(),
        recruiter_id: recruiter.id,
        status: APPLICATION_STATUSES.DRAFT,
      });
    }

    if (!application || application.status !== APPLICATION_STATUSES.DRAFT) {
      return wrapper.error(new BadRequestError("No editable draft application"));
    }

    const doc = await this.command.upsertDocument({
      id: uuidv4(),
      application_id: application.id,
      doc_type,
      file_url,
      file_name,
      mime_type,
    });
    if (!doc) {
      return wrapper.error(new InternalServerError("Failed to save document"));
    }

    const documents = await this.query.findDocuments(application.id);
    return wrapper.data({
      document: doc,
      documents,
      missing_required: this._missingRequired(documents),
    });
  }

  async deleteDocument(payload) {
    const { user_id, doc_type } = payload;
    const loaded = await this._requireRecruiter(user_id);
    if (loaded.err) return loaded.err;
    const { recruiter } = loaded;

    const application = await this.query.findLatestApplication(recruiter.id);
    if (!application || application.status !== APPLICATION_STATUSES.DRAFT) {
      return wrapper.error(
        new BadRequestError("Documents can only be removed from a draft application")
      );
    }

    const removed = await this.command.deleteDocument(application.id, doc_type);
    if (!removed) {
      return wrapper.error(new NotFoundError("Document not found"));
    }

    const documents = await this.query.findDocuments(application.id);
    return wrapper.data({
      documents,
      missing_required: this._missingRequired(documents),
      deleted_file_url: removed.file_url || null,
    });
  }

  async submitApplication(payload) {
    const { user_id } = payload;
    const loaded = await this._requireRecruiter(user_id);
    if (loaded.err) return loaded.err;
    const { recruiter } = loaded;

    if (recruiter.is_verified) {
      return wrapper.error(new BadRequestError("Company is already verified"));
    }

    const application = await this.query.findLatestApplication(recruiter.id);
    if (!application || application.status !== APPLICATION_STATUSES.DRAFT) {
      return wrapper.error(
        new BadRequestError("No draft application to submit. Save a draft first.")
      );
    }

    if (!application.company_legal_name || !application.npwp_number || !application.nib_number) {
      return wrapper.error(
        new BadRequestError(
          "company_legal_name, npwp_number, and nib_number are required before submit"
        )
      );
    }

    const documents = await this.query.findDocuments(application.id);
    const missing = this._missingRequired(documents);
    if (missing.length) {
      return wrapper.error(
        new BadRequestError(
          `Missing required documents: ${missing.map((t) => DOC_TYPE_LABELS[t] || t).join(", ")}`
        )
      );
    }

    const submitted = await this.command.submitApplication(application.id);
    if (!submitted) {
      return wrapper.error(new InternalServerError("Failed to submit application"));
    }

    await this.command.setRecruiterVerificationStatus(
      recruiter.id,
      VERIFICATION_STATUSES.PENDING_REVIEW,
      null
    );

    let reactivation = null;
    if (
      recruiter.is_suspended &&
      recruiter.suspension_reason === SUSPENSION_REASON_VERIFICATION
    ) {
      const existing = await this.query.findOpenReactivation(recruiter.id);
      if (existing) {
        reactivation = existing;
      } else {
        reactivation = await this.command.createReactivationRequest({
          id: uuidv4(),
          user_id,
          recruiter_id: recruiter.id,
          application_id: submitted.id,
          reason:
            "Resubmitted company verification documents after verification deadline block",
        });
      }
    }

    return wrapper.data({
      application: submitted,
      documents,
      reactivation_request: reactivation,
      message:
        "Application submitted. Admin will review before is_verified is granted.",
    });
  }

  /**
   * Best practice: reactivation = resubmit complete KYC package (not a free-form plea).
   * Creates/returns open reactivation request only when suspended for verification_incomplete
   * and a submitted/under_review application exists.
   */
  async requestReactivation(payload) {
    const { user_id, reason } = payload;
    const loaded = await this._requireRecruiter(user_id);
    if (loaded.err) return loaded.err;
    const { recruiter } = loaded;

    if (!recruiter.is_suspended || recruiter.suspension_reason !== SUSPENSION_REASON_VERIFICATION) {
      return wrapper.error(
        new BadRequestError(
          "Reactivation is only available when the account is blocked for incomplete verification"
        )
      );
    }

    const application = await this.query.findLatestApplication(recruiter.id);
    if (
      !application ||
      ![APPLICATION_STATUSES.SUBMITTED, APPLICATION_STATUSES.UNDER_REVIEW].includes(
        application.status
      )
    ) {
      return wrapper.error(
        new BadRequestError(
          "Submit a complete verification application before requesting reactivation"
        )
      );
    }

    const existing = await this.query.findOpenReactivation(recruiter.id);
    if (existing) {
      return wrapper.data({
        reactivation_request: existing,
        application,
        message: "Reactivation request already open; waiting for admin review",
      });
    }

    const created = await this.command.createReactivationRequest({
      id: uuidv4(),
      user_id,
      recruiter_id: recruiter.id,
      application_id: application.id,
      reason:
        reason ||
        "Request account reactivation after submitting company verification documents",
    });

    if (!created) {
      return wrapper.error(new InternalServerError("Failed to create reactivation request"));
    }

    return wrapper.data({
      reactivation_request: created,
      application,
      message: "Reactivation request created. Admin will review your documents.",
    });
  }

  async reviewApplication(payload) {
    const { id, action, admin_note, rejection_reason, reviewed_by } = payload;
    const application = await this.query.findApplicationById(id);
    if (!application) {
      return wrapper.error(new NotFoundError("Application not found"));
    }

    if (
      ![APPLICATION_STATUSES.SUBMITTED, APPLICATION_STATUSES.UNDER_REVIEW].includes(
        application.status
      )
    ) {
      return wrapper.error(
        new BadRequestError("Only submitted/under_review applications can be reviewed")
      );
    }

    if (action === "approve") {
      const reviewed = await this.command.reviewApplication({
        id,
        status: APPLICATION_STATUSES.APPROVED,
        admin_note,
        rejection_reason: null,
        reviewed_by,
      });
      if (!reviewed) {
        return wrapper.error(new InternalServerError("Failed to approve application"));
      }

      await this.command.approveRecruiterVerified(application.recruiter_id);
      await this.command.unsuspendUser(application.user_id);
      await this.command.closeOpenReactivationRequests(
        application.recruiter_id,
        "approved",
        reviewed_by,
        admin_note
      );

      return wrapper.data({
        application: reviewed,
        message: "Employer verified and account restored",
      });
    }

    if (action === "reject") {
      if (!rejection_reason || !String(rejection_reason).trim()) {
        return wrapper.error(new BadRequestError("rejection_reason is required"));
      }

      const reviewed = await this.command.reviewApplication({
        id,
        status: APPLICATION_STATUSES.REJECTED,
        admin_note,
        rejection_reason: String(rejection_reason).trim(),
        reviewed_by,
      });
      if (!reviewed) {
        return wrapper.error(new InternalServerError("Failed to reject application"));
      }

      await this.command.rejectRecruiterVerification(application.recruiter_id);
      await this.command.closeOpenReactivationRequests(
        application.recruiter_id,
        "rejected",
        reviewed_by,
        admin_note || rejection_reason
      );

      return wrapper.data({
        application: reviewed,
        message: "Application rejected. Employer may fix documents and resubmit.",
      });
    }

    return wrapper.error(new BadRequestError("action must be approve or reject"));
  }

  async markUnderReview(payload) {
    const { id, reviewed_by } = payload;
    const application = await this.query.findApplicationById(id);
    if (!application) {
      return wrapper.error(new NotFoundError("Application not found"));
    }
    const updated = await this.command.markUnderReview(id);
    if (!updated) {
      return wrapper.error(
        new BadRequestError("Only submitted applications can move to under_review")
      );
    }
    return wrapper.data({ application: updated, reviewed_by });
  }

  async runAutoBlockExpired() {
    const { autoBlock } = await readEmployerVerificationSettings();
    if (!autoBlock) {
      return wrapper.data({ skipped: true, reason: "employer_verification_auto_block is false" });
    }
    const stats = await this.command.autoBlockExpiredRecruiters();
    return wrapper.data({
      skipped: false,
      users_blocked: Number(stats.users_blocked) || 0,
      recruiters_marked: Number(stats.recruiters_marked) || 0,
    });
  }
}

module.exports = EmployerVerificationCommand;
