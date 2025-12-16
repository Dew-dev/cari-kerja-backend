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
    conditionsString,
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
                j.updated_at,
                COUNT(ja.id) AS applications
            FROM job_posts j
            JOIN recruiters r ON r.id = j.recruiter_id
            JOIN employment_types et ON et.id = j.employment_type_id
            JOIN experience_levels el ON el.id = j.experience_level_id
            JOIN salary_types st ON st.id = j.salary_type_id
            JOIN currencies c ON c.id = j.currency_id
            JOIN job_post_statuses jps ON jps.id = j.status_id
            LEFT JOIN job_applications ja ON ja.job_post_id = j.id
            WHERE ${conditionsString}
            GROUP BY 
    j.id,
    r.id,
    et.id,
    el.id,
    st.id,
    c.id,
    jps.id
            ORDER BY ${orderColumn} ${orderDirection}
            LIMIT $${idx}
            OFFSET $${idx + 1};
            `;
      console.log(jobpostsQuery);
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

  async findOneByJobpostsId(id, user_id = null) {
    try {
      // console.log("id", id);
      // ("");
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
          SELECT 1 FROM job_applications ja
          WHERE ja.worker_id = '${user_id}' AND ja.job_post_id = j.id
        )
      ) AS applied`
                    : `false AS applied`
                } 
            FROM job_posts j
            JOIN recruiters r ON r.id = j.recruiter_id
            JOIN employment_types et ON et.id = j.employment_type_id
            JOIN experience_levels el ON el.id = j.experience_level_id
            JOIN salary_types st ON st.id = j.salary_type_id
            JOIN currencies c ON c.id = j.currency_id
            JOIN job_post_statuses jps ON jps.id = j.status_id
            LEFT JOIN job_applications ja ON ja.job_post_id = j.id
            WHERE j.id = $1;
            `;
      //console.log("query find one", jobpostQuery);
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
      console.log("ini user id ", user_id);
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
                c.code AS currency,
                j.status_id,
                jps.name AS status,
                j.created_at,
                j.updated_at,
                j.deadline,
                COUNT(ja.id) AS applications,
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
              ) AS tags
     
              FROM job_posts j
              JOIN recruiters r ON r.id = j.recruiter_id
              JOIN employment_types et ON et.id = j.employment_type_id
              JOIN experience_levels el ON el.id = j.experience_level_id
              JOIN salary_types st ON st.id = j.salary_type_id
              JOIN currencies c ON c.id = j.currency_id
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
    jps.id
              ORDER BY ${orderColumn} ${orderDirection}
              LIMIT $${idx}
              OFFSET $${idx + 1};
            `;

      values.push(parseInt(limit, 10));
      values.push((parseInt(page, 10) - 1) * parseInt(limit, 10));
      console.log(jobpostsQuery);
      const jobpostsResult = await this.db.executeQuery(jobpostsQuery, values);

      // if (!jobpostsResult || jobpostsResult.rows.length === 0) {
      //   return wrapper.error("Job posts Not Found");
      // }

      const result = jobpostsResult.rows.map((row) => ({
        ...row,
        tags: row.tags || [], // Pastikan tags selalu berupa array
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
              JOIN job_post_statuses jps ON jps.id = j.status_id
              LEFT JOIN job_applications ja ON ja.job_post_id = j.id
              LEFT JOIN job_post_tags jpt ON jpt.job_post_id = j.id
              LEFT JOIN job_tags t ON t.id = jpt.tag_id
              LEFT JOIN saved_jobs sj ON j.id = sj.job_post_id
              WHERE 1=1${conditionsString}
             GROUP BY
    j.id,
    r.id,
    et.id,
    el.id,
    st.id,
    c.id,
    jps.id
      `;
      const countResult = await this.db.executeQuery(countQuery, values);
      console.log("query", countQuery);
      console.log("Console Result", countResult);

      return wrapper.data(countResult);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "countAllJobPosts", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
