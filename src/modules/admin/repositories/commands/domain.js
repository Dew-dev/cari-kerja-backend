const wrapper = require("../../../../helpers/utils/wrapper");
const DB = require("../../../../helpers/databases/postgresql/db");
const config = require("../../../../config/global_config");
const { NotFoundError } = require("../../../../helpers/errors");

class AdminCommand {
  constructor() {
    this.db = new DB(config.get("/pgDbUrl"));
  }

  async updateUserStatus(payload) {
    const { id, is_suspended } = payload;
    const user = await this.db.findOne({ id }, { id: 1 }, "users");
    if (user.err) return wrapper.error(new NotFoundError("User not found"));

    const updateQuery = `UPDATE users SET is_suspended = $1 WHERE id = $2 RETURNING *`;
    const result = await this.db.executeQuery(updateQuery, [is_suspended, id]);
    
    return wrapper.data(result.rows[0]);
  }

  async verifyEmployer(payload) {
    const { id, is_verified } = payload;
    const employer = await this.db.findOne({ id }, { id: 1 }, "recruiters");
    if (employer.err) return wrapper.error(new NotFoundError("Employer not found"));

    const updateQuery = `UPDATE recruiters SET is_verified = $1 WHERE id = $2 RETURNING *`;
    const result = await this.db.executeQuery(updateQuery, [is_verified, id]);

    return wrapper.data(result.rows[0]);
  }

  async updateJobStatus(payload) {
    const { id, status } = payload;
    const job = await this.db.findOne({ id }, { id: 1 }, "job_posts");
    if (job.err) return wrapper.error(new NotFoundError("Job not found"));

    const statusRecord = await this.db.findOne({ name: status }, { id: 1 }, "job_post_statuses");
    if (statusRecord.err) return wrapper.error(new NotFoundError("Status not found"));

    const updateQuery = `UPDATE job_posts SET status_id = $1 WHERE id = $2 RETURNING *`;
    const result = await this.db.executeQuery(updateQuery, [statusRecord.data.id, id]);

    return wrapper.data(result.rows[0]);
  }
}

module.exports = AdminCommand;
