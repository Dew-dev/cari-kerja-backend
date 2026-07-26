const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");

class JobAlertsQuery {
  constructor(db) {
    this.query = new Query(db);
  }

  async getPreferences(payload) {
    const result = await this.query.findWorkerJobAlertsPreference(payload.worker_id);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to fetch job alerts preference"));
    }
    if (!result.data) {
      return wrapper.error(new NotFoundError("Worker not found"));
    }

    const hasEmail = Boolean(result.data.email && String(result.data.email).trim());
    const telegramAvailable =
      result.data.login_provider === "telegram" &&
      Boolean(result.data.telegram_chat_id);
    const enabled = Boolean(result.data.job_alerts_enabled);

    return wrapper.data({
      enabled,
      has_email: hasEmail,
      telegram_available: telegramAvailable,
      // Active if toggle on and at least one delivery channel is available
      active: enabled && (hasEmail || telegramAvailable),
      last_sent_at: result.data.job_alerts_last_sent_at ?? null,
    });
  }
}

module.exports = JobAlertsQuery;
