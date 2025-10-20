const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Certification-Query-Domain";

class Certification {
  constructor(db) {
    this.query = new Query(db);
  }

  async getOneCertification(payload) {
    const { id, worker_id } = payload;
    const certification = await this.query.findOne(
      { id, worker_id },
      {
        id: 1,
        worker_id: 1,
        name: 1,
        issuer: 1,
        issue_date: 1,
        expiry_date: 1,
        credential_id: 1,
        is_active: 1,
        updated_at: 1,
      }
    );

    if (certification.err) {
      logger.error(ctx, "getCertification", "Can not find certification", certification.err);
      return wrapper.error(new NotFoundError("Can not find certification"));
    }

    return wrapper.data(certification.data);
  }

  async getAllCertifications(payload) {
    const { worker_id, page, limit } = payload;

    const certifications = await this.query.findAll(worker_id, page, limit);
    const count = await this.query.countAll(worker_id);
    if (certifications.err) {
      logger.error(ctx, "getCertifications", "Can not find certifications", certifications.err);
      return wrapper.error(new NotFoundError("Can not find certifications"));
    }

    const totalData = count.data;
    const totalPages = Math.ceil(totalData / limit);
    const meta = {
      page: page,
      per_page: limit,
      total_data: Math.max(totalData, 0),
      total_pages: totalPages,
    };

    return wrapper.paginationData(certifications.data, meta);
  }
}

module.exports = Certification;
