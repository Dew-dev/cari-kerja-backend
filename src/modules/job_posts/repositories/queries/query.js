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

  async findAllByRecruiterId({
    conditions,
    orderColumn,
    orderDirection,
    idx,
    values,
    limit,
    page,
  }) {
    try {
      const jobpostsQuery = `
            SELECT 
                j.id,
                j.recruiter_id,
                r.company_name,
                r.avatar_url,
                j.title,
                j.description,
                j.location,
                et.name AS employment_type,
                el.name AS experience_level,
                st.name AS salary_type,
                j.salary_min,
                j.salary_max,
                c.name AS currency,
                j.status_id,
                jps.name AS status,
                j.created_at,
                j.updated_at
            FROM job_posts j
            JOIN recruiters r ON r.id = j.recruiter_id
            JOIN employment_types et ON et.id = j.employment_type_id
            JOIN experience_levels el ON el.id = j.experience_level_id
            JOIN salary_types st ON st.id = j.salary_type_id
            JOIN currencies c ON c.id = j.currency_id
            JOIN job_post_statuses jps ON jps.id = j.status_id
            WHERE ${conditions.join(" AND ")}
            ORDER BY ${orderColumn} ${orderDirection}
            LIMIT $${idx}
            OFFSET $${idx + 1};
            `;

      // Add pagination params to values
      values.push(parseInt(limit, 10));
      values.push((parseInt(page, 10) - 1) * parseInt(limit, 10));

      const jobpostsResult = await this.db.executeQuery(jobpostsQuery, values);
      if (!jobpostsResult || jobpostsResult.rows.length === 0) {
        return wrapper.error("Job posts Not Found");
      }
      const result = jobpostsResult.rows;
      const pagination = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: jobpostsResult.rows.length,
      };
      return wrapper.paginationData(result, pagination);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAllByRecruiterId", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findOneByJobpostsId(id) {
    try {
      const jobpostQuery = `
            SELECT 
                j.id,
                j.recruiter_id,
                r.company_name,
                r.avatar_url,
                j.title,
                j.description,
                j.location,
                et.name AS employment_type,
                el.name AS experience_level,
                st.name AS salary_type,
                j.salary_min,
                j.salary_max,
                c.name AS currency,
                j.status_id,
                jps.name AS status,
                j.published_at,
                j.deadline,
                j.created_at,
                j.updated_at
            FROM job_posts j
            JOIN recruiters r ON r.id = j.recruiter_id
            JOIN employment_types et ON et.id = j.employment_type_id
            JOIN experience_levels el ON el.id = j.experience_level_id
            JOIN salary_types st ON st.id = j.salary_type_id
            JOIN currencies c ON c.id = j.currency_id
            JOIN job_post_statuses jps ON jps.id = j.status_id
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
                et.name AS employment_type,
                el.name AS experience_level,
                st.name AS salary_type,
                j.salary_min,
                j.salary_max,
                c.name AS currency,
                j.status_id,
                jps.name AS status,
                j.created_at,
                j.updated_at
              FROM job_posts j
              JOIN recruiters r ON r.id = j.recruiter_id
              JOIN employment_types et ON et.id = j.employment_type_id
              JOIN experience_levels el ON el.id = j.experience_level_id
              JOIN salary_types st ON st.id = j.salary_type_id
              JOIN currencies c ON c.id = j.currency_id
              JOIN job_post_statuses jps ON jps.id = j.status_id
              WHERE 1=1 ${conditions}
              ORDER BY ${orderColumn} ${orderDirection}
              LIMIT $${idx}
              OFFSET $${idx + 1};
            `;

      values.push(parseInt(limit, 10));
      values.push((parseInt(page, 10) - 1) * parseInt(limit, 10));

      const jobpostsResult = await this.db.executeQuery(jobpostsQuery, values);
      if (!jobpostsResult || jobpostsResult.rows.length === 0) {
        return wrapper.error("Job posts Not Found");
      }
      const result = jobpostsResult.rows;
      const pagination = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: jobpostsResult.rows.length,
      };
      return wrapper.paginationData(result, pagination);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "FindAll", error);
      return wrapper.error(errorQueryMessage);
    }
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
      "OR"
    );
  }
}

module.exports = Query;
