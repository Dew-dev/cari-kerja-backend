const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Recruiter-Query-Domain";

class Recruiter {
  constructor(db) {
    this.query = new Query(db);
  }

  async getRecruiterByUserId(payload) {
    const { user_id } = payload;
    const recruiter = await this.query.findOneByRecruiterUserId(user_id);
    if (recruiter.err) {
      logger.error(
        ctx,
        "getRecruiter",
        "Can not find recruiter",
        recruiter.err
      );
      return wrapper.error(new NotFoundError("Can not find recruiter"));
    }

    logger.info(ctx, "getRecruiter", "Get detail recruiter", payload);
    return wrapper.data(recruiter.data);
  }

  async getAllRecruitersByIndustry() {
    const recruiters = await this.query.findAllRecruitersWithIndustry();

    if (recruiters.err) {
      logger.error(ctx, "getAllRecruitersByIndustry", "Cannot find recruiters", recruiters.err);
      return wrapper.error(new NotFoundError("Cannot find recruiters"));
    }

    const groupedMap = new Map();

    for (const recruiter of recruiters.data || []) {
      const industryId = recruiter.industry_id ?? null;
      const industryName = recruiter.industry_name ?? "Unassigned";
      const key = `${industryId ?? "null"}::${industryName}`;
      const normalizedRecruiter = {
        ...recruiter,
        job_count: Number(recruiter.job_count || 0),
        total_job_posts: Number(recruiter.job_count || 0),
      };

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          industry_id: industryId,
          industry_name: industryName,
          recruiters: [],
        });
      }

      groupedMap.get(key).recruiters.push(normalizedRecruiter);
    }

    const grouped = Array.from(groupedMap.values()).map((item) => ({
      ...item,
      total_recruiters: item.recruiters.length,
      total_jobs: item.recruiters.reduce(
        (sum, recruiter) => sum + Number(recruiter.job_count || 0),
        0,
      ),
    }));

    logger.info(ctx, "getAllRecruitersByIndustry", "Get recruiters grouped by industry");
    return wrapper.data(grouped);
  }
}

module.exports = Recruiter;
