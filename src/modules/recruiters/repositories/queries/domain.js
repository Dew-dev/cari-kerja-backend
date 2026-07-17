const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Recruiter-Query-Domain";

const isEmptyResult = (err) =>
  typeof err === "string" && /data not found/i.test(err);

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

    return wrapper.data(recruiter.data);
  }

  async getAllRecruitersByIndustry() {
    const recruiters = await this.query.findAllRecruitersWithIndustry();

    if (recruiters.err) {
      if (isEmptyResult(recruiters.err)) {
        return wrapper.data([]);
      }
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

    return wrapper.data(grouped);
  }

  async getAllCompanies(payload) {
    const { search, page = 1, limit = 10 } = payload;

    const companies = await this.query.findAllCompanies({ search, page, limit });
    if (companies.err) {
      if (isEmptyResult(companies.err)) {
        return wrapper.paginationData([], {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          totalPage: 0,
        });
      }
      logger.error(ctx, "getAllCompanies", "Cannot find companies", companies.err);
      return wrapper.error(new NotFoundError("Cannot find companies"));
    }

    const total = await this.query.countAll({ search });
    if (total.err) {
      logger.error(ctx, "getAllCompanies", "Cannot count companies", total.err);
      return wrapper.error(new NotFoundError("Cannot count companies"));
    }

    const totalData = Number(total.data || 0);
    const totalPage = Math.ceil(totalData / Number(limit || 10));
    const pagination = {
      page: Number(page),
      limit: Number(limit),
      total: totalData,
      totalPage,
    };

    return wrapper.paginationData(companies.data, pagination);
  }
}

module.exports = Recruiter;
