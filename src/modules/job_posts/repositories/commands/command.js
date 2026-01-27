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

  async updateJobPost({
    id,
    title,
    description,
    employment_type_id,
    experience_level_id,
    salary_type_id,
    salary_min,
    salary_max,
    currency_id,
    location,
    deadline,
  }) {
    const query = `
      UPDATE job_posts
      SET
        title = $2,
        description = $3,
        employment_type_id = $4,
        experience_level_id = $5,
        salary_type_id = $6,
        salary_min = $7,
        salary_max = $8,
        currency_id = $9,
        location = $10,
        deadline = $11,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id;
    `;

    const values = [
      id,
      title,
      description,
      employment_type_id,
      experience_level_id,
      salary_type_id,
      salary_min,
      salary_max,
      currency_id,
      location,
      deadline,
    ];

    const result = await this.db.executeQuery(query, values);
    return result;
  }

  async deleteJobPostTags({ job_post_id }) {
    return this.db.executeQuery(
      "DELETE FROM job_post_tags WHERE job_post_id = $1",
      [job_post_id],
    );
  }

  async insertJobPostTag({ job_post_id, tag_id }) {
    return this.db.executeQuery(
      `
    INSERT INTO job_post_tags (job_post_id, tag_id)
    VALUES ($1, $2)
    `,
      [job_post_id, tag_id],
    );
  }
  async insertJobPost({
    recruiter_id,
    title,
    description,
    employment_type_id,
    experience_level_id,
    salary_type_id,
    salary_min,
    salary_max,
    currency_id,
    location,
    deadline,
    status_id,
    category_id,
  }) {
    const query = `
      INSERT INTO job_posts (
        recruiter_id,
        title,
        description,
        employment_type_id,
        experience_level_id,
        salary_type_id,
        salary_min,
        salary_max,
        currency_id,
        location,
        deadline,
        status_id,
        category_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
      )
      RETURNING id;
    `;

    const values = [
      recruiter_id,
      title,
      description,
      employment_type_id,
      experience_level_id,
      salary_type_id,
      salary_min,
      salary_max,
      currency_id,
      location,
      deadline,
      status_id,
      category_id,
    ];

    const result = await this.db.executeQuery(query, values);
    return result.rows[0];
  }
  
  async archiveJobPost(id) {
    return this.db.executeQuery(
      `UPDATE job_posts SET archived_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  async restoreJobPost(id) {
    return this.db.executeQuery(
      `UPDATE job_posts SET archived_at = NULL WHERE id = $1`,
      [id],
    );
  }
}

module.exports = Command;
