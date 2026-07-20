const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Communication-Command";

class Command {
  constructor(db) {
    this.db = db;
  }

  async insertTemplate(data) {
    try {
      const res = await this.db.executeQuery(
        `INSERT INTO communication_templates
           (id, recruiter_id, name, subject, body, channel, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING id, name, subject, body, channel, created_at, updated_at`,
        [data.id, data.recruiter_id, data.name, data.subject, data.body, data.channel],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, "insertTemplate failed", "command", error);
      return wrapper.error(error);
    }
  }

  async updateTemplate({ id, recruiter_id, name, subject, body, channel }) {
    try {
      const res = await this.db.executeQuery(
        `UPDATE communication_templates
         SET name = COALESCE($3, name),
             subject = COALESCE($4, subject),
             body = COALESCE($5, body),
             channel = COALESCE($6, channel),
             updated_at = NOW()
         WHERE id = $1 AND recruiter_id = $2 AND deleted_at IS NULL
         RETURNING id, name, subject, body, channel, created_at, updated_at`,
        [id, recruiter_id, name, subject, body, channel],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, "updateTemplate failed", "command", error);
      return wrapper.error(error);
    }
  }

  async softDeleteTemplate({ id, recruiter_id }) {
    try {
      const res = await this.db.executeQuery(
        `UPDATE communication_templates
         SET deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND recruiter_id = $2 AND deleted_at IS NULL
         RETURNING id`,
        [id, recruiter_id],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, "softDeleteTemplate failed", "command", error);
      return wrapper.error(error);
    }
  }

  async insertCampaign(data) {
    try {
      const res = await this.db.executeQuery(
        `INSERT INTO communication_campaigns
           (id, recruiter_id, job_post_id, template_id, subject, body, channel,
            status, total, sent, failed, skipped, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())
         RETURNING id, subject, channel, status, total, sent, failed, skipped, created_at, job_post_id`,
        [
          data.id,
          data.recruiter_id,
          data.job_post_id ?? null,
          data.template_id ?? null,
          data.subject,
          data.body,
          data.channel,
          data.status,
          data.total,
          data.sent,
          data.failed,
          data.skipped,
        ],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, "insertCampaign failed", "command", error);
      return wrapper.error(error);
    }
  }

  async insertRecipient(data) {
    try {
      const res = await this.db.executeQuery(
        `INSERT INTO communication_recipients
           (id, campaign_id, application_id, worker_id, email, worker_name,
            status, skip_reason, error, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
         RETURNING id, status`,
        [
          data.id,
          data.campaign_id,
          data.application_id,
          data.worker_id,
          data.email,
          data.worker_name,
          data.status,
          data.skip_reason ?? null,
          data.error ?? null,
        ],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, "insertRecipient failed", "command", error);
      return wrapper.error(error);
    }
  }

  async updateRecipientStatus({ id, status, error, skip_reason }) {
    try {
      const res = await this.db.executeQuery(
        `UPDATE communication_recipients
         SET status = $2,
             error = COALESCE($3, error),
             skip_reason = COALESCE($4, skip_reason)
         WHERE id = $1
         RETURNING id, status`,
        [id, status, error ?? null, skip_reason ?? null],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, "updateRecipientStatus failed", "command", error);
      return wrapper.error(error);
    }
  }

  async updateCampaignSkippedCount(campaign_id, count) {
    try {
      await this.db.executeQuery(
        `UPDATE communication_campaigns
         SET skipped = skipped + $2, updated_at = NOW()
         WHERE id = $1`,
        [campaign_id, count],
      );
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "updateCampaignSkippedCount failed", "command", error);
      return wrapper.error(error);
    }
  }

  async incrementCampaignFailed(campaign_id) {
    try {
      await this.db.executeQuery(
        `UPDATE communication_campaigns
         SET failed = failed + 1,
             status = CASE
               WHEN sent + failed + skipped + 1 >= total THEN
                 CASE WHEN sent > 0 THEN 'partial' ELSE 'failed' END
               ELSE status
             END,
             updated_at = NOW()
         WHERE id = $1`,
        [campaign_id],
      );
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "incrementCampaignFailed failed", "command", error);
      return wrapper.error(error);
    }
  }
  async updateWorkerEmailOptOut({ worker_id, email_opt_out }) {
    try {
      const res = await this.db.executeQuery(
        `UPDATE workers
         SET email_opt_out = $2, updated_at = NOW()
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING email_opt_out`,
        [worker_id, email_opt_out],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, "updateWorkerEmailOptOut failed", "command", error);
      return wrapper.error(error);
    }
  }

  async optOutByUnsubscribeToken(token) {
    try {
      const res = await this.db.executeQuery(
        `UPDATE workers
         SET email_opt_out = TRUE, updated_at = NOW()
         WHERE unsubscribe_token = $1 AND deleted_at IS NULL
         RETURNING id`,
        [token],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, "optOutByUnsubscribeToken failed", "command", error);
      return wrapper.error(error);
    }
  }
}

module.exports = Command;
