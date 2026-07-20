const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { NotFoundError } = require("../../../../helpers/errors");

class JobAlertsQuery {
  constructor(db) {
    this.query = new Query(db);
  }

  async getPreferences(payload) {
    const result = await this.query.findWorkerJobAlertsPreference(payload.worker_id);
    if (result.err || !result.data) {
      return wrapper.error(new NotFoundError("Worker not found"));
    }

    const hasEmail = Boolean(result.data.email && String(result.data.email).trim());
    const enabled = Boolean(result.data.job_alerts_enabled);

    return wrapper.data({
      enabled,
      has_email: hasEmail,
      // Fitur hanya aktif jika ada email DAN toggle on
      active: hasEmail && enabled,
      last_sent_at: result.data.job_alerts_last_sent_at ?? null,
    });
  }
}

module.exports = JobAlertsQuery;
