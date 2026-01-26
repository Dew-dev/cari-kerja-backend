const collection = "job_posts";
const collections = "job_posts_questions";

class Command {
  constructor(db) {
    this.db = db;
  }

  async insertOne(document, table = collection) {
    return this.db.insertOne(document, table);
  }

  async insertMany(document, table = collection) {
    return this.db.insertMany(document, table);
  }

  async updateOneNew(parameter, document, table = collection) {
    return this.db.updateOneNew(parameter, document, table);
  }

  async deleteOne(parameter, table = collection) {
    return this.db.deleteOne(parameter, table);
  }

  async deleteAppliedJobpost({ job_post_id, worker_id }) {
    const query = `
    DELETE FROM job_applications
    WHERE job_post_id = $1
      AND worker_id = $2
    RETURNING id;
  `;

    const values = [job_post_id, worker_id];

    return this.db.executeQuery(query, values);
  }

  async updateJobApplicationStatus({ id, application_status_id }) {

      const query = `
      UPDATE job_applications
      SET
        application_status_id = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id;
    `;

      const result = await this.db.executeQuery(query, [
        id,
        application_status_id,
      ]);

      return result;
    
  }
}

module.exports = Command;
