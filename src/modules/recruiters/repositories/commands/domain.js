const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  NotFoundError,
  InternalServerError,
} = require("../../../../helpers/errors");
const ctx = "Recruiter-Command-Domain";

class Recruiter {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async updateOneRecruiter(payload) {
    const { id } = payload;
    const recruiter = await this.query.findOne({ id }, { id: 1 });

    if (recruiter.err) {
      return wrapper.error(new NotFoundError("Recruiter Not Found!"));
    }

    const updatableFields = [
      "company_name",
      "avatar_url",
      "company_website",
      "contact_name",
      "contact_phone",
      "address",
      "industry_id",
      "description",
      "employee_count",
      "instagram_url",
      "tiktok_url",
    ];
    let updateData = {};
    for (const field of updatableFields) {
      if (payload[field] !== undefined && payload[field] !== null) {
        updateData[field] = payload[field];
      }
    }
    // ////console.log("update data", updateData);
    const updateResult = await this.command.updateOneNew({ id }, updateData);
    if (updateResult.err) {
      ////console.log("update err", updateResult.err);
      logger.error(
        ctx,
        "Failed to update",
        "Domain recruiter",
        updateResult.err
      );
      return wrapper.error(new InternalServerError("Update Recruiter Failed"));
    }
    logger.info(
      ctx,
      "Update Succeed",
      "Domain Recruiter",
      wrapper.data({ id })
    );
    return wrapper.data({ id });
  }

  async updateRecruiterVip(payload) {
    const { id, user_id, is_vip, vip_start_at, vip_end_at } = payload;

    const recruiter = await this.query.findOne({ id, user_id }, { id: 1 });

    if (recruiter.err || !recruiter.data) {
      return wrapper.error(new NotFoundError("Recruiter Not Found!"));
    }

    const now = new Date();
    const updateData = {
      is_vip,
      vip_start_at: is_vip ? (vip_start_at ?? now) : null,
      vip_end_at: is_vip ? (vip_end_at ?? null) : null,
    };

    const updateResult = await this.command.updateOneNew({ id }, updateData);

    if (updateResult.err) {
      logger.error(ctx, "Failed to update recruiter VIP", "Domain recruiter", updateResult.err);
      return wrapper.error(new InternalServerError("Update Recruiter VIP Failed"));
    }

    logger.info(ctx, "Update recruiter VIP succeed", "Domain Recruiter", wrapper.data({ id }));
    return wrapper.data({
      id,
      ...updateData,
    });
  }
}

module.exports = Recruiter;
