const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "JobAlerts-Command";

class Command {
  constructor(db) {
    this.db = db;
  }

  async updateJobAlertsEnabled({ worker_id, enabled }) {
    try {
      const res = await this.db.executeQuery(
        `UPDATE workers
         SET job_alerts_enabled = $2, updated_at = NOW()
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING id, job_alerts_enabled`,
        [worker_id, enabled],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, "updateJobAlertsEnabled failed", "command", error);
      return wrapper.error(error);
    }
  }

  async markJobAlertsSent(worker_id) {
    try {
      const res = await this.db.executeQuery(
        `UPDATE workers
         SET job_alerts_last_sent_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING id`,
        [worker_id],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, "markJobAlertsSent failed", "command", error);
      return wrapper.error(error);
    }
  }
}

module.exports = Command;
