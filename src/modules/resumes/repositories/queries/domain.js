const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Resume-Query-Domain";

const EMPTY_RESULT_MESSAGE = "Data Not Found Please Try Another Input";

class Resume {
  constructor(db) {
    this.query = new Query(db);
  }

  async getResume(payload) {
    const { id, worker_id } = payload;
    const resume = await this.query.findOne(
      { id, worker_id },
      { id: 1, worker_id: 1, resume_url: 1, title: 1, updated_at: 1 }
    );

    if (resume.err) {
      logger.error(ctx, "getResume", "Can not find resume", resume.err);
      return wrapper.error(new NotFoundError("Can not find resume"));
    }

    return wrapper.data(resume.data);
  }

  async getAllResumes(payload) {
    const { worker_id, page = 1, limit = 10 } = payload;
    const resumes = await this.query.findAll(worker_id, page, limit);
    const count = await this.query.countAll(worker_id);

    if (resumes.err) {
      if (resumes.err === EMPTY_RESULT_MESSAGE) {
        return wrapper.paginationData(
          [],
          wrapper.buildPaginationMeta(page, limit, 0)
        );
      }
      logger.error(ctx, "getResumes", "Can not find resumes", resumes.err);
      return wrapper.error(new NotFoundError("Can not find resumes"));
    }

    const totalData = Math.max(Number(count?.data) || 0, 0);
    const meta = wrapper.buildPaginationMeta(page, limit, totalData);

    return wrapper.paginationData(resumes.data, meta);
  }
}

module.exports = Resume;
