const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const { NotFoundError, InternalServerError } = require("../../../../helpers/errors");

class CommunicationQuery {
  constructor(db) {
    this.query = new Query(db);
  }

  async listTemplates(payload) {
    const result = await this.query.findTemplatesByRecruiter(payload.recruiter_id);
    if (result.err) {
      return wrapper.error(new InternalServerError("Failed to fetch templates"));
    }
    return wrapper.data(result.data);
  }

  async listCampaigns(payload) {
    const { recruiter_id, job_post_id, page, limit } = payload;
    const offset = (page - 1) * limit;

    const countResult = await this.query.countCampaigns({ recruiter_id, job_post_id });
    if (countResult.err) {
      return wrapper.error(new InternalServerError("Failed to count campaigns"));
    }

    const listResult = await this.query.findCampaigns({
      recruiter_id,
      job_post_id,
      limit,
      offset,
    });

    if (listResult.err) {
      return wrapper.error(new InternalServerError("Failed to fetch campaigns"));
    }

    return wrapper.paginationData(listResult.data, {
      total: countResult.data,
      page,
      limit,
    });
  }

  async getCampaign(payload) {
    const campaign = await this.query.findCampaignById(payload);
    if (campaign.err || !campaign.data) {
      return wrapper.error(new NotFoundError("Campaign not found"));
    }

    const recipients = await this.query.findRecipientsByCampaign(payload.id);
    if (recipients.err) {
      return wrapper.error(new InternalServerError("Failed to fetch campaign recipients"));
    }

    const { body, template_id, updated_at, ...summary } = campaign.data;

    return wrapper.data({
      ...summary,
      recipients: recipients.data,
    });
  }

  async getWorkerPreferences(payload) {
    const result = await this.query.findWorkerPreferences(payload.worker_id);
    if (result.err || !result.data) {
      return wrapper.error(new NotFoundError("Worker not found"));
    }

    return wrapper.data({ email_opt_out: result.data.email_opt_out });
  }
}

module.exports = CommunicationQuery;
