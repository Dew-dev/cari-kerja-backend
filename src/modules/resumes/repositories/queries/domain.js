const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Resume-Query-Domain";

class Resume {
  constructor(db) {
    this.query = new Query(db);
  }

  async getResume(payload) {
    const { id } = payload;
    const resume = await this.query.findOne({ id }, { id: 1, worker_id: 1, resume_url: 1, title: 1, updated_at: 1 });

    if (resume.err) {
      logger.error(ctx, "getResume", "Can not find resume", resume.err);
      return wrapper.error(new NotFoundError("Can not find resume"));
    }

    return wrapper.data(resume.data);
  }

  async getAllResumes(payload) {
    const { worker_id, page, limit } = payload;
    const resumes = await this.query.findAll(worker_id, page, limit);
    const count = await this.query.countAll();

    if (resumes.err) {
      logger.error(ctx, "getResumes", "Can not find resumes", resumes.err);
      return wrapper.error(new NotFoundError("Can not find resumes"));
    }

    const totalData = count.data;
    const totalPages = Math.ceil(totalData / limit);
    const meta = {
      page: page,
      per_page: limit,
      total_data: Math.max(totalData, 0),
      total_pages: totalPages,
    };

    return wrapper.paginationData(resumes.data, meta);
  }
}

module.exports = Resume;
