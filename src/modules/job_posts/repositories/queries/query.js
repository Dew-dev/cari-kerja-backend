const collection = "job_posts";
const currencies_collection = "currencies";
const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Job_Posts-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findOne(parameter, projection, collection = collection) {
    return this.db.findOne(parameter, projection, collection);
  }

  async findOneByJobpostsId(id, user_id = null) {
    try {
      const jobpostQuery = `
            SELECT 
                j.id,
                j.recruiter_id,
                r.company_name,
                r.avatar_url,
                i.name AS industry,
                r.company_website,
                u.email,
                r.description AS company_description,
                j.title,
                j.description,
                j.location,
                j.province,
                j.city,
                j.is_vip,
                j.vip_start_at,
                j.vip_end_at,
                j.is_remote,
                et.name AS employment_type,
                el.name AS experience_level,
                st.name AS salary_type,
                j.category_id,
                cat.name AS category_name,
                j.experience_level_id,
                j.employment_type_id,
                j.salary_min,
                j.salary_max,
                c.code AS currency_code,
                c.name AS currency,
                c.id AS currency_id,
                j.status_id,
                jps.name AS status,
                j.published_at,
                j.deadline,
                j.created_at,
                j.updated_at,
                (
                    SELECT COUNT(*)
                    FROM job_applications ja
                    WHERE ja.job_post_id = j.id
                ) AS applications,
                 ${
                   user_id
                     ? `(
        SELECT EXISTS (
          SELECT id FROM saved_jobs sj
          WHERE sj.worker_id = '${user_id}' AND sj.job_post_id = j.id
        )
      ) AS saved_id,`
                     : `false AS saved_id,`
                 }
                ${
                  user_id
                    ? `(
        SELECT EXISTS (
          SELECT 1 FROM job_applications ja
          WHERE ja.worker_id = '${user_id}' AND ja.job_post_id = j.id
        )
      ) AS applied`
                    : `false AS applied`
                },
                (SELECT json_agg(json_build_object('id', s.id, 'skill_name', s.skill_name))
                FROM job_post_skills jps_sk
                JOIN skills s ON s.id = jps_sk.skill_id
                WHERE jps_sk.job_post_id = j.id
              ) AS skills
            FROM job_posts j
            JOIN recruiters r ON r.id = j.recruiter_id
            JOIN users u ON u.id = r.user_id
            JOIN employment_types et ON et.id = j.employment_type_id
            JOIN experience_levels el ON el.id = j.experience_level_id
            JOIN salary_types st ON st.id = j.salary_type_id
            JOIN currencies c ON c.id = j.currency_id
            JOIN categories cat ON cat.id = j.category_id
            JOIN job_post_statuses jps ON jps.id = j.status_id
            LEFT JOIN industries i ON i.id = r.industry_id
            WHERE j.id = $1;
            `;
      const jobpostResult = await this.db.executeQuery(jobpostQuery, [id]);

      if (!jobpostResult || jobpostResult.rows.length === 0) {
        return wrapper.error("Job Post Not Found");
      }
      const result = jobpostResult.rows[0];

      return wrapper.data(result);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findOneByJobpostsId", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findAll({
    conditions,
    orderColumn,
    orderDirection,
    idx,
    values,
    limit,
    page,
    totalData,
    user_id = null,
  }) {
    try {
      // Build dynamic query using WHERE 1=1
      const jobpostsQuery = `
              SELECT 
                j.id,
                j.recruiter_id,
                r.company_name,
                r.avatar_url,
                j.title,
                j.description,
                j.location,
                j.province,
                j.city,
                j.is_vip,
                j.vip_start_at,
                j.vip_end_at,
                j.is_remote,
                et.name AS employment_type,
                el.name AS experience_level,
                st.name AS salary_type,
                cat.name AS category,
                j.salary_min,
                j.salary_max,
                c.code AS currency,
                j.status_id,
                jps.name AS status,
                j.created_at,
                j.updated_at,
                j.deadline,
                COUNT(DISTINCT ja.id) AS applications,
                ${
                  user_id
                    ? `(
        SELECT EXISTS (
          SELECT 1 FROM saved_jobs sj
          WHERE sj.worker_id = '${user_id}' AND sj.job_post_id = j.id
        )
      ) AS saved,`
                    : `false AS saved,`
                }
                ${
                  user_id
                    ? `(
        SELECT EXISTS (
          SELECT id FROM saved_jobs sj
          WHERE sj.worker_id = '${user_id}' AND sj.job_post_id = j.id
        )
      ) AS saved_id,`
                    : `false AS saved_id,`
                }
                ${
                  user_id
                    ? `(
        SELECT EXISTS (
          SELECT 1 FROM job_applications ja
          WHERE ja.worker_id = '${user_id}' AND ja.job_post_id = j.id
        )
      ) AS applied,`
                    : `false AS applied,`
                }
                (SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
                FROM job_post_tags jpt
                JOIN job_tags t ON t.id = jpt.tag_id
                WHERE jpt.job_post_id = j.id
              ) AS tags,
                (SELECT json_agg(json_build_object('id', s.id, 'skill_name', s.skill_name))
                FROM job_post_skills jps_sk
                JOIN skills s ON s.id = jps_sk.skill_id
                WHERE jps_sk.job_post_id = j.id
              ) AS skills,
              ${
                user_id
                  ? `COALESCE(
                (SELECT COUNT(*)
                FROM job_post_skills jps_match
                JOIN worker_skills ws ON ws.skill_id = jps_match.skill_id
                WHERE jps_match.job_post_id = j.id AND ws.worker_id = '${user_id}'),
                0
              ) AS skill_match_count`
                  : `0 AS skill_match_count`
              }
     
              FROM job_posts j
              JOIN recruiters r ON r.id = j.recruiter_id
              JOIN employment_types et ON et.id = j.employment_type_id
              JOIN experience_levels el ON el.id = j.experience_level_id
              JOIN salary_types st ON st.id = j.salary_type_id
              JOIN currencies c ON c.id = j.currency_id
              JOIN categories cat ON cat.id = j.category_id
              JOIN job_post_statuses jps ON jps.id = j.status_id
              LEFT JOIN job_applications ja ON ja.job_post_id = j.id
              LEFT JOIN job_post_tags jpt ON jpt.job_post_id = j.id
              LEFT JOIN job_tags t ON t.id = jpt.tag_id
              WHERE 1=1${conditions}
             GROUP BY
    j.id,
    r.id,
    et.id,
    el.id,
    st.id,
    c.id,
    cat.id,
    jps.id
              ORDER BY ${user_id ? 'skill_match_count DESC,' : ''} ${orderColumn} ${orderDirection}
              LIMIT $${idx}
              OFFSET $${idx + 1};
            `;

      values.push(parseInt(limit, 10));
      values.push((parseInt(page, 10) - 1) * parseInt(limit, 10));
      // //console.log("ini query", jobpostsQuery);
      const jobpostsResult = await this.db.executeQuery(jobpostsQuery, values);

      // if (!jobpostsResult || jobpostsResult.rows.length === 0) {
      //   return wrapper.error("Job posts Not Found");
      // }

      const result = jobpostsResult.rows.map((row) => ({
        ...row,
        tags: row.tags || [], // Pastikan tags selalu berupa array
        skills: row.skills || [], // Pastikan skills selalu berupa array
      }));
      const pagination = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: totalData,
        totalPage: Math.ceil(totalData / parseInt(limit, 10)),
        // meta: queryMetaRes,
      };
      return wrapper.paginationData(result, pagination);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "FindAll", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findAppliedJobs({
    conditions,
    orderColumn,
    orderDirection,
    idx,
    values,
    limit,
    page,
    totalData,
    user_id = null,
  }) {
    try {
      // Build dynamic query using WHERE 1=1
      const jobpostsQuery = `
              SELECT
  j.id,
  j.recruiter_id,

  r.company_name,
  r.avatar_url,

  j.title,
  j.description,
  j.location,
  j.province,
  j.city,
  j.is_vip,
  j.vip_start_at,
  j.vip_end_at,
  j.is_remote,

  et.name AS employment_type,
  el.name AS experience_level,
  st.name AS salary_type,

  j.salary_min,
  j.salary_max,
  c.code AS currency,

  j.status_id,
  jps.name AS status,

  j.created_at,
  j.updated_at,
  j.deadline,

  -- Applied data
  ja.applied_at,
  ja.cover_letter,
  a.name AS application_status,

  -- Resume
  re.resume_url,
  re.title AS resume_title,

  -- Tags
  (
    SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
    FROM job_post_tags jpt
    JOIN job_tags t ON t.id = jpt.tag_id
    WHERE jpt.job_post_id = j.id
  ) AS tags,
  
  -- Skills
  (
    SELECT json_agg(json_build_object('id', s.id, 'skill_name', s.skill_name))
    FROM job_post_skills jps_sk
    JOIN skills s ON s.id = jps_sk.skill_id
    WHERE jps_sk.job_post_id = j.id
  ) AS skills,
      r.avatar_url
FROM job_applications ja
JOIN job_posts j ON j.id = ja.job_post_id

JOIN recruiters r ON r.id = j.recruiter_id
JOIN employment_types et ON et.id = j.employment_type_id
JOIN experience_levels el ON el.id = j.experience_level_id
JOIN salary_types st ON st.id = j.salary_type_id
JOIN currencies c ON c.id = j.currency_id
JOIN job_post_statuses jps ON jps.id = j.status_id

LEFT JOIN application_statuses a ON a.id = ja.application_status_id
LEFT JOIN resumes re ON re.id = ja.resume_id

              WHERE 1=1${conditions}
              ORDER BY ${orderColumn} ${orderDirection}
              LIMIT $${idx}
              OFFSET $${idx + 1};
            `;

      values.push(parseInt(limit, 10));
      values.push((parseInt(page, 10) - 1) * parseInt(limit, 10));
      //console.log("ini query", jobpostsQuery);
      const jobpostsResult = await this.db.executeQuery(jobpostsQuery, values);

      // if (!jobpostsResult || jobpostsResult.rows.length === 0) {
      //   return wrapper.error("Job posts Not Found");
      // }

      const result = jobpostsResult.rows.map((row) => ({
        ...row,
        tags: row.tags || [], // Pastikan tags selalu berupa array
        skills: row.skills || [], // Pastikan skills selalu berupa array
      }));
      const pagination = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: totalData,
        totalPage: Math.ceil(totalData / parseInt(limit, 10)),
        // meta: queryMetaRes,
      };
      return wrapper.paginationData(result, pagination);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "FindAll", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findJobApplicants({ job_post_id }) {
    try {
      const query = `
      SELECT
        ja.id AS application_id,
        ja.applied_at,
        ja.cover_letter,

        w.id,
        w.user_id,
        w.name,
        u.email,

        ast.name AS status,

        re.resume_url,
        re.title AS resume_title

      FROM job_applications ja
      JOIN workers w ON w.id = ja.worker_id
      JOIN users u ON u.id = w.user_id

      LEFT JOIN application_statuses ast ON ast.id = ja.application_status_id
      LEFT JOIN resumes re ON re.id = ja.resume_id

      WHERE ja.job_post_id = $1
      ORDER BY ja.applied_at DESC;
    `;
      // console.log("Executing query to find job applicants:", query, [
      //   job_post_id,
      // ]);
      const result = await this.db.executeQuery(query, [job_post_id]);

      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, "findJobApplicants", "Query failed", error);
      return wrapper.error("Failed to fetch applicants");
    }
  }

  async findOneJobApplication({ id }) {
    try {
      const query = `
      SELECT
        ja.id,
        j.recruiter_id
      FROM job_applications ja
      JOIN job_posts j ON j.id = ja.job_post_id
      WHERE ja.id = $1
      LIMIT 1;
    `;

      const result = await this.db.executeQuery(query, [id]);

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findOneJobApplication", "Query failed", error);
      return wrapper.error("Failed to fetch job application");
    }
  }

  async findCategories(parameter, projection) {
    return this.db.findManyLike(
      { name: parameter.name },
      projection,
      { name: "ASC" },
      1,
      10,
      "categories",
      "OR",
    );
  }
  async findAllByJobPostId({
    job_post_id,
    conditions = "",
    orderColumn,
    orderDirection,
    idx,
    values,
    limit,
    page,
  }) {
    try {
      const query = `
            SELECT 
                q.id,
                q.job_post_id,
                q.question_text,
                qt.name AS question_type,
                q.question_type_id,
                q.options,
                q.is_required,
                q.order_index,
                q.created_at,
                q.updated_at
            FROM job_post_questions q
            JOIN question_types qt ON qt.id = q.question_type_id
            WHERE q.job_post_id = $1
            ${conditions}
            ORDER BY ${orderColumn} ${orderDirection}
            LIMIT $${idx}
            OFFSET $${idx + 1};
            `;

      values.push(parseInt(limit, 10));
      values.push((parseInt(page, 10) - 1) * parseInt(limit, 10));

      const result = await this.db.executeQuery(query, values);

      if (!result || result.rows.length === 0) {
        return wrapper.error("No questions found for this job_post_id");
      }

      const pagination = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: result.rows.length,
      };

      return wrapper.paginationData(result.rows, pagination);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAllByJobPostId", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findAllCurrencies(projection, limit = 10) {
    return this.db.findAll(projection, { name: "ASC" }, 1, limit, "currencies");
  }

  async findCurrency(parameter, projection) {
    return this.db.findManyLike(
      { code: parameter.code, name: parameter.code },
      projection,
      { name: "ASC", priorityValue: "Uzbekistani Soʻm" },
      1,
      10,
      currencies_collection,
      "OR",
    );
  }

  async countAllJobPosts(conditionsString, values) {
    try {
      const countQuery = `
              SELECT 
                COUNT(*) AS total
              FROM job_posts j
              JOIN recruiters r ON r.id = j.recruiter_id
              JOIN employment_types et ON et.id = j.employment_type_id
              JOIN experience_levels el ON el.id = j.experience_level_id
              JOIN salary_types st ON st.id = j.salary_type_id
              JOIN currencies c ON c.id = j.currency_id
              JOIN categories cat ON cat.id = j.category_id
              JOIN job_post_statuses jps ON jps.id = j.status_id
              LEFT JOIN job_applications ja ON ja.job_post_id = j.id
              LEFT JOIN job_post_tags jpt ON jpt.job_post_id = j.id
              LEFT JOIN job_tags t ON t.id = jpt.tag_id
              LEFT JOIN saved_jobs sj ON j.id = sj.job_post_id
              WHERE 1=1 ${conditionsString}
             GROUP BY
    j.id,
    r.id,
    et.id,
    el.id,
    st.id,
    c.id,
    cat.id,
    jps.id
      `;
      const countResult = await this.db.executeQuery(countQuery, values);
      return wrapper.data(countResult);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "countAllJobPosts", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findWorkerByApplicationId({ id }) {
    try {
      const query = `
      SELECT
        w.id,
        w.name,
        u.email,
        w.telephone,
        w.avatar_url,

        ja.cover_letter,
        ja.applied_at,
        ja.application_status_id,
        ast.name AS status,
        ast.id AS status_id,

        re.resume_url,
        re.title AS resume_title

      FROM job_applications ja
      JOIN workers w ON w.id = ja.worker_id
      JOIN users u ON u.id = w.user_id
      LEFT JOIN application_statuses ast ON ast.id = ja.application_status_id
      LEFT JOIN resumes re ON re.id = ja.resume_id

      WHERE ja.id = $1
      LIMIT 1;
    `;
      // console.log("Executing query to find worker by application ID:", query, [
      //   id,
      // ]);
      const result = await this.db.executeQuery(query, [id]);

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findWorkerByApplicationId", "Query failed", error);
      return wrapper.error("Failed to fetch worker");
    }
  }

  async findOneJobPost({ id, recruiter_id }) {
    try {
      const query = `
      SELECT id, location, province, city, is_vip, vip_start_at, vip_end_at, is_remote
      FROM job_posts
      WHERE id = $1
        AND recruiter_id = $2
      LIMIT 1;
    `;

      const result = await this.db.executeQuery(query, [id, recruiter_id]);

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findOneJobPost", "Query failed", error);
      return wrapper.error("Failed to find job post");
    }
  }
  async findJobWithTags({ id, recruiter_id }) {
    try {
      const query = `
      SELECT
        j.*,
        (
          SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
          FROM job_post_tags jpt
          JOIN job_tags t ON t.id = jpt.tag_id
          WHERE jpt.job_post_id = j.id
        ) AS tags
      FROM job_posts j
      WHERE j.id = $1 AND j.recruiter_id = $2
      LIMIT 1;
    `;

      const result = await this.db.executeQuery(query, [id, recruiter_id]);
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findJobWithTags", "Query failed", error);
      return wrapper.error("Failed to fetch job");
    }
  }

  async findApplicationWithUser(application_id) {
    const res = await this.db.executeQuery(
      `
    SELECT
      ja.id,
      ja.application_status_id,
      u.email,
      w.name AS user_name,
      j.title AS job_title,
      a.name AS status_name
    FROM job_applications ja
    JOIN workers w ON w.id = ja.worker_id
    JOIN users u ON u.id = w.user_id
    JOIN job_posts j ON j.id = ja.job_post_id
    JOIN application_statuses a ON a.id = ja.application_status_id
    WHERE ja.id = $1
    LIMIT 1
    `,
      [application_id],
    );

    return wrapper.data(res.rows[0]);
  }

  async findAnswersByApplicationId({ id }) {
    try {
      const query = `
      SELECT
        jpa.id,
        jpa.question_id,
        jpa.answer,
        jpa.submitted_at,
        jpq.question_text,
        qt.name AS question_type,
        jpq.options,
        jpq.is_required,
        jpq.order_index
      FROM job_post_answers jpa
      JOIN job_post_questions jpq ON jpq.id = jpa.question_id
      JOIN question_types qt ON qt.id = jpq.question_type_id
      WHERE jpa.job_application_id = $1
      ORDER BY jpq.order_index ASC;
    `;

      const result = await this.db.executeQuery(query, [id]);
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, "findAnswersByApplicationId", "Query failed", error);
      return wrapper.error("Failed to fetch answers");
    }
  }

  async getJobPostRequirements(job_post_id) {
    try {
      const query = `
      SELECT id, requirement, order_index
      FROM job_post_requirements
      WHERE job_post_id = $1
      ORDER BY order_index ASC;
    `;
      const result = await this.db.executeQuery(query, [job_post_id]);
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, "getJobPostRequirements", "Query failed", error);
      return wrapper.error("Failed to fetch requirements");
    }
  }

  async getJobPostBenefits(job_post_id) {
    try {
      const query = `
      SELECT id, benefit, order_index
      FROM job_post_benefits
      WHERE job_post_id = $1
      ORDER BY order_index ASC;
    `;
      const result = await this.db.executeQuery(query, [job_post_id]);
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, "getJobPostBenefits", "Query failed", error);
      return wrapper.error("Failed to fetch benefits");
    }
  }

  async getJobPostResponsibilities(job_post_id) {
    try {
      const query = `
      SELECT id, responsibility, order_index
      FROM job_post_responsibilities
      WHERE job_post_id = $1
      ORDER BY order_index ASC;
    `;
      const result = await this.db.executeQuery(query, [job_post_id]);
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, "getJobPostResponsibilities", "Query failed", error);
      return wrapper.error("Failed to fetch responsibilities");
    }
  }
}

module.exports = Query;
