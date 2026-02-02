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
  async insertApplicationNote({ application_id, recruiter_id, note }) {
    return this.db.executeQuery(
      `
    INSERT INTO application_notes (application_id, recruiter_id, note)
    VALUES ($1, $2, $3)
    `,
      [application_id, recruiter_id, note],
    );
  }
}

module.exports = Command;
