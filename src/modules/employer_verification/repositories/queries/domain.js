const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { NotFoundError, ForbiddenError } = require("../../../../helpers/errors");
const {
  REQUIRED_DOC_TYPES,
  OPTIONAL_DOC_TYPES,
  DOC_TYPE_LABELS,
  SUSPENSION_REASON_VERIFICATION,
} = require("../../../../helpers/fraud/employer_verification_docs");
const {
  readEmployerVerificationSettings,
} = require("../../../../helpers/fraud/employer_verification_settings");

class EmployerVerificationQuery {
  constructor(db) {
    this.query = new Query(db);
  }

  _missingRequired(documents) {
    const have = new Set((documents || []).map((d) => d.doc_type));
    return REQUIRED_DOC_TYPES.filter((t) => !have.has(t));
  }

  async getStatus(payload) {
    const { user_id, role_id } = payload;
    if (Number(role_id) !== 2) {
      return wrapper.error(
        new ForbiddenError("Only recruiters can access employer verification")
      );
    }

    const recruiter = await this.query.findRecruiterByUserId(user_id);
    if (!recruiter) {
      return wrapper.error(new NotFoundError("Recruiter profile not found"));
    }

    const settings = await readEmployerVerificationSettings();
    const application = await this.query.findLatestApplication(recruiter.id);
    const documents = application
      ? await this.query.findDocuments(application.id)
      : [];
    const reactivation = await this.query.findOpenReactivation(recruiter.id);
    const deadlineMs = recruiter.verification_deadline_at
      ? new Date(recruiter.verification_deadline_at).getTime() - Date.now()
      : null;

    return wrapper.data({
      recruiter_id: recruiter.id,
      company_name: recruiter.company_name,
      is_verified: Boolean(recruiter.is_verified),
      verification_status: recruiter.verification_status,
      verification_deadline_at: recruiter.verification_deadline_at,
      grace_days_configured: settings.graceDays,
      auto_block_enabled: settings.autoBlock,
      seconds_remaining:
        deadlineMs == null ? null : Math.max(0, Math.floor(deadlineMs / 1000)),
      is_suspended: Boolean(recruiter.is_suspended),
      suspension_reason: recruiter.suspension_reason || null,
      restricted_verification:
        Boolean(recruiter.is_suspended) &&
        recruiter.suspension_reason === SUSPENSION_REASON_VERIFICATION,
      required_doc_types: REQUIRED_DOC_TYPES.map((t) => ({
        type: t,
        label: DOC_TYPE_LABELS[t],
      })),
      optional_doc_types: OPTIONAL_DOC_TYPES.map((t) => ({
        type: t,
        label: DOC_TYPE_LABELS[t],
      })),
      application: application || null,
      documents,
      missing_required: this._missingRequired(documents),
      reactivation_request: reactivation || null,
    });
  }

  async getDocTypes() {
    return wrapper.data({
      required: REQUIRED_DOC_TYPES.map((t) => ({
        type: t,
        label: DOC_TYPE_LABELS[t],
      })),
      optional: OPTIONAL_DOC_TYPES.map((t) => ({
        type: t,
        label: DOC_TYPE_LABELS[t],
      })),
    });
  }

  async listApplications(payload) {
    const { status, page = 1, limit = 20 } = payload;
    const result = await this.query.listApplications({ status, page, limit });
    return wrapper.data({
      data: result.data,
      meta: {
        page,
        limit,
        total: result.total,
        total_pages: Math.ceil(result.total / limit) || 0,
      },
    });
  }

  async getApplicationById(payload) {
    const application = await this.query.findApplicationById(payload.id);
    if (!application) {
      return wrapper.error(new NotFoundError("Application not found"));
    }
    const documents = await this.query.findDocuments(application.id);
    const reactivation = await this.query.findOpenReactivation(
      application.recruiter_id
    );
    return wrapper.data({
      application,
      documents,
      reactivation_request: reactivation || null,
      missing_required: this._missingRequired(documents),
    });
  }

  async listReactivationRequests(payload) {
    const { status, page = 1, limit = 20 } = payload;
    const result = await this.query.listReactivationRequests({
      status,
      page,
      limit,
    });
    return wrapper.data({
      data: result.data,
      meta: {
        page,
        limit,
        total: result.total,
        total_pages: Math.ceil(result.total / limit) || 0,
      },
    });
  }
}

module.exports = EmployerVerificationQuery;
