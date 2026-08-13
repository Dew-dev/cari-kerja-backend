const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Communication-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findTemplatesByRecruiter(recruiter_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT id, name, subject, body, channel, created_at, updated_at
         FROM communication_templates
         WHERE recruiter_id = $1 AND deleted_at IS NULL
         ORDER BY updated_at DESC`,
        [recruiter_id],
      );
      return wrapper.data(res?.rows || []);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findTemplatesByRecruiter", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findTemplateById({ id, recruiter_id }) {
    try {
      const res = await this.db.executeQuery(
        `SELECT id, name, subject, body, channel, created_at, updated_at
         FROM communication_templates
         WHERE id = $1 AND recruiter_id = $2 AND deleted_at IS NULL
         LIMIT 1`,
        [id, recruiter_id],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findTemplateById", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findApplicationsForBulkSend({ application_ids, recruiter_id }) {
    try {
      const res = await this.db.executeQuery(
        `SELECT
            ja.id AS application_id,
            ja.job_post_id,
            ja.application_status_id,
            jp.recruiter_id,
            jp.title AS job_title,
            r.company_name,
            w.id AS worker_id,
            w.name AS worker_name,
            w.email_opt_out,
            w.unsubscribe_token,
            u.id AS user_id,
            u.email,
            u.login_provider,
            u.telegram_chat_id,
            ast.name AS stage_name,
            ast.stage_type
         FROM job_applications ja
         JOIN job_posts jp ON jp.id = ja.job_post_id
         JOIN recruiters r ON r.id = jp.recruiter_id
         JOIN workers w ON w.id = ja.worker_id
         JOIN users u ON u.id = w.user_id
         LEFT JOIN application_statuses ast ON ast.id = ja.application_status_id
         WHERE ja.id = ANY($1::uuid[])
           AND jp.recruiter_id = $2
           AND w.deleted_at IS NULL`,
        [application_ids, recruiter_id],
      );
      return wrapper.data(res?.rows || []);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findApplicationsForBulkSend", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findJobPostOwner(job_post_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT id, recruiter_id FROM job_posts WHERE id = $1 LIMIT 1`,
        [job_post_id],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findJobPostOwner", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async countCampaigns({ recruiter_id, job_post_id }) {
    try {
      const conditions = [`recruiter_id = $1`];
      const values = [recruiter_id];
      let idx = 2;

      if (job_post_id) {
        conditions.push(`job_post_id = $${idx}`);
        values.push(job_post_id);
        idx += 1;
      }

      const res = await this.db.executeQuery(
        `SELECT COUNT(*) AS total FROM communication_campaigns WHERE ${conditions.join(" AND ")}`,
        values,
      );
      return wrapper.data(parseInt(res?.rows?.[0]?.total ?? 0, 10));
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "countCampaigns", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findCampaigns({ recruiter_id, job_post_id, limit, offset }) {
    try {
      const conditions = [`recruiter_id = $1`];
      const values = [recruiter_id];
      let idx = 2;

      if (job_post_id) {
        conditions.push(`job_post_id = $${idx}`);
        values.push(job_post_id);
        idx += 1;
      }

      const res = await this.db.executeQuery(
        `SELECT id, subject, channel, status, total, sent, failed, skipped,
                created_at, job_post_id
         FROM communication_campaigns
         WHERE ${conditions.join(" AND ")}
         ORDER BY created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset],
      );
      return wrapper.data(res?.rows || []);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findCampaigns", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findCampaignById({ id, recruiter_id }) {
    try {
      const res = await this.db.executeQuery(
        `SELECT id, subject, body, channel, status, total, sent, failed, skipped,
                created_at, updated_at, job_post_id, template_id
         FROM communication_campaigns
         WHERE id = $1 AND recruiter_id = $2
         LIMIT 1`,
        [id, recruiter_id],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findCampaignById", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findRecipientsByCampaign(campaign_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT application_id, worker_name, email, status, sent_at, error, skip_reason
         FROM communication_recipients
         WHERE campaign_id = $1
         ORDER BY created_at ASC`,
        [campaign_id],
      );
      return wrapper.data(res?.rows || []);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findRecipientsByCampaign", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findWorkerPreferences(worker_id) {
    try {
      const res = await this.db.executeQuery(
        `SELECT email_opt_out FROM workers WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
        [worker_id],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findWorkerPreferences", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findWorkerByUnsubscribeToken(token) {
    try {
      const res = await this.db.executeQuery(
        `SELECT id FROM workers WHERE unsubscribe_token = $1 AND deleted_at IS NULL LIMIT 1`,
        [token],
      );
      return wrapper.data(res?.rows?.[0]);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findWorkerByUnsubscribeToken", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
