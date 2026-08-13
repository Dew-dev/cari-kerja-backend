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

  async deleteMany(parameter, table = collection) {
    // Build WHERE clause from parameter object
    const conditions = Object.keys(parameter)
      .map((key, idx) => `${key} = $${idx + 1}`)
      .join(' AND ');
    
    const values = Object.values(parameter);
    const query = `DELETE FROM ${table} WHERE ${conditions} RETURNING id;`;
    
    return this.db.executeQuery(query, values);
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

  async insertApplicationStageHistory({
    application_id,
    from_stage_id,
    to_stage_id,
    changed_by_recruiter_id,
    note,
  }) {
    const query = `
      INSERT INTO application_stage_history (application_id, from_stage_id, to_stage_id, changed_by_recruiter_id, note)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `;

    return this.db.executeQuery(query, [
      application_id,
      from_stage_id ?? null,
      to_stage_id,
      changed_by_recruiter_id ?? null,
      note ?? null,
    ]);
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
    province,
    city,
    is_remote,
    job_title_id,
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
        province = $12,
        city = $13,
        is_remote = $14,
        job_title_id = $15,
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
      province,
      city,
      is_remote,
      job_title_id ?? null,
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

  async deleteJobPostQuestions({ job_post_id }) {
    return this.db.executeQuery(
      "DELETE FROM job_post_questions WHERE job_post_id = $1",
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
    company_id,
    created_by_recruiter_id,
    created_by_user_id,
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
    province,
    city,
    is_remote,
    job_title_id,
  }) {
    const query = `
      INSERT INTO job_posts (
        recruiter_id,
        company_id,
        created_by_recruiter_id,
        created_by_user_id,
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
        province,
        city,
        is_remote,
        job_title_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
      )
      RETURNING id;
    `;

    const values = [
      recruiter_id,
      company_id || null,
      created_by_recruiter_id || recruiter_id || null,
      created_by_user_id || null,
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
      province ?? null,
      city ?? null,
      is_remote ?? false,
      job_title_id ?? null,
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

  async deleteJobPost(id) {
    return this.db.executeQuery(
      `DELETE FROM job_posts WHERE id = $1`,
      [id],
    );
  }
}

module.exports = Command;
