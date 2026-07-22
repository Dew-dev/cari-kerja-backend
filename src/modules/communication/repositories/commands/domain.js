const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { v4: uuidv4 } = require("uuid");
const {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  InternalServerError,
} = require("../../../../helpers/errors");
const { addEmailJob } = require("../../../../helpers/queues/email.queue");
const { renderMergeFields } = require("../../../../helpers/utils/renderMergeFields");
const communicationEmailTemplate = require("../../../../helpers/utils/communicationEmailTemplate");
const { buildUnsubscribeUrl } = communicationEmailTemplate;

const ctx = "Communication-Command-Domain";

class CommunicationCommand {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async createTemplate(payload) {
    const result = await this.command.insertTemplate({
      id: uuidv4(),
      recruiter_id: payload.recruiter_id,
      name: payload.name,
      subject: payload.subject,
      body: payload.body,
      channel: payload.channel || "email",
    });

    if (result.err || !result.data) {
      logger.error(ctx, "createTemplate", "insert failed", result.err);
      return wrapper.error(new InternalServerError("Failed to create template"));
    }

    return wrapper.data(result.data);
  }

  async updateTemplate(payload) {
    const existing = await this.query.findTemplateById({
      id: payload.id,
      recruiter_id: payload.recruiter_id,
    });

    if (existing.err || !existing.data) {
      return wrapper.error(new NotFoundError("Template not found"));
    }

    const result = await this.command.updateTemplate(payload);
    if (result.err || !result.data) {
      return wrapper.error(new InternalServerError("Failed to update template"));
    }

    return wrapper.data(result.data);
  }

  async deleteTemplate(payload) {
    const result = await this.command.softDeleteTemplate(payload);
    if (result.err || !result.data) {
      return wrapper.error(new NotFoundError("Template not found"));
    }

    return wrapper.data({ message: "Template deleted successfully" });
  }

  async bulkSend(payload) {
    const {
      recruiter_id,
      channel,
      template_id,
      subject,
      body,
      application_ids,
      job_post_id,
    } = payload;

    if (job_post_id) {
      const owner = await this.query.findJobPostOwner(job_post_id);
      if (owner.err || !owner.data) {
        return wrapper.error(new NotFoundError("Job post not found"));
      }
      if (owner.data.recruiter_id !== recruiter_id) {
        return wrapper.error(new ForbiddenError("You are not allowed to access this job post"));
      }
    }

    if (template_id) {
      const tpl = await this.query.findTemplateById({ id: template_id, recruiter_id });
      if (tpl.err || !tpl.data) {
        return wrapper.error(new NotFoundError("Template not found"));
      }
    }

    const appsResult = await this.query.findApplicationsForBulkSend({
      application_ids,
      recruiter_id,
    });

    if (appsResult.err) {
      return wrapper.error(new InternalServerError("Failed to validate applications"));
    }

    const apps = appsResult.data || [];
    if (apps.length !== application_ids.length) {
      return wrapper.error(
        new BadRequestError(
          "One or more applications were not found or do not belong to your jobs",
        ),
      );
    }

    if (job_post_id) {
      const invalidJob = apps.some((a) => a.job_post_id !== job_post_id);
      if (invalidJob) {
        return wrapper.error(
          new BadRequestError("All applications must belong to the specified job post"),
        );
      }
    }

    const skipped = [];
    const toQueue = [];

    for (const app of apps) {
      if (app.email_opt_out) {
        skipped.push({ application_id: app.application_id, reason: "opt_out" });
      } else if (app.login_provider === "telegram") {
        skipped.push({
          application_id: app.application_id,
          reason: "telegram_channel_only",
        });
      } else if (!app.email) {
        skipped.push({ application_id: app.application_id, reason: "no_email" });
      } else {
        toQueue.push(app);
      }
    }

    const campaignId = uuidv4();
    const campaignResult = await this.command.insertCampaign({
      id: campaignId,
      recruiter_id,
      job_post_id: job_post_id ?? apps[0]?.job_post_id ?? null,
      template_id: template_id ?? null,
      subject,
      body,
      channel: channel || "email",
      status: toQueue.length > 0 ? "processing" : "completed",
      total: apps.length,
      sent: 0,
      failed: 0,
      skipped: skipped.length,
    });

    if (campaignResult.err || !campaignResult.data) {
      return wrapper.error(new InternalServerError("Failed to create campaign"));
    }

    for (const skip of skipped) {
      const app = apps.find((a) => a.application_id === skip.application_id);
      await this.command.insertRecipient({
        id: uuidv4(),
        campaign_id: campaignId,
        application_id: skip.application_id,
        worker_id: app.worker_id,
        email: app.email || "",
        worker_name: app.worker_name,
        status: "skipped",
        skip_reason: skip.reason,
      });
    }

    let queued = 0;

    for (const app of toQueue) {
      const recipientId = uuidv4();
      const recipientResult = await this.command.insertRecipient({
        id: recipientId,
        campaign_id: campaignId,
        application_id: app.application_id,
        worker_id: app.worker_id,
        email: app.email,
        worker_name: app.worker_name,
        status: "queued",
      });

      if (recipientResult.err) continue;

      const mergeFields = {
        candidate_name: app.worker_name,
        name: app.worker_name,
        job_title: app.job_title,
        company_name: app.company_name,
        stage_name: app.stage_name,
      };

      const renderedSubject = renderMergeFields(subject, mergeFields);
      const renderedBody = renderMergeFields(body, mergeFields);
      const unsubscribeUrl = buildUnsubscribeUrl(app.unsubscribe_token);
      const html = communicationEmailTemplate({
        bodyHtml: renderedBody.replace(/\n/g, "<br>"),
        unsubscribeUrl,
      });

      try {
        await addEmailJob({
          to: app.email,
          subject: renderedSubject,
          html,
          recipient_id: recipientId,
        });
        queued += 1;
      } catch (err) {
        logger.error(ctx, "bulkSend", "Failed to enqueue email", err);
        await this.command.updateRecipientStatus({
          id: recipientId,
          status: "failed",
          error: err.message,
        });
        await this.command.incrementCampaignFailed(campaignId);
      }
    }

    if (toQueue.length === 0) {
      return wrapper.data({
        campaign_id: campaignId,
        queued: 0,
        skipped,
      });
    }

    return wrapper.data({
      campaign_id: campaignId,
      queued,
      skipped,
    });
  }

  async updateWorkerPreferences(payload) {
    const result = await this.command.updateWorkerEmailOptOut(payload);
    if (result.err || !result.data) {
      return wrapper.error(new NotFoundError("Worker not found"));
    }

    return wrapper.data({ email_opt_out: result.data.email_opt_out });
  }

  async unsubscribeByToken(payload) {
    const result = await this.command.optOutByUnsubscribeToken(payload.token);
    if (result.err || !result.data) {
      return wrapper.error(new NotFoundError("Invalid or expired unsubscribe link"));
    }

    return wrapper.data({ message: "You have been unsubscribed from recruitment emails" });
  }
}

module.exports = CommunicationCommand;
