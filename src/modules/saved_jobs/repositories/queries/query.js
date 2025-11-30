const collection = "saved_jobs";
const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Saved_Jobs-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findOne(parameter, projection, collection = collection) {
    return this.db.findOne(parameter, projection, collection);
  }

  async findAllByWorkerId({
    conditions,
    orderColumn,
    orderDirection,
    idx,
    values,
    limit,
    page,
  }) {
    try {
      const savedJobsQuery = `
            SELECT 
                sj.id,
                sj.job_post_id,
                sj.worker_id,
                sj.created_at,
                j.recruiter_id,
                j.title,
                j.description,
                j.location,
                et.name AS employment_type,
                j.salary_min,
                j.salary_max,
                c.code AS currency,
                j.published_at,
                j.deadline,
                jps.name AS status,
                j.created_at,
                j.updated_at,
                el.name AS experience_level,
                st.name AS salary_type
            FROM ${collection} sj
            JOIN job_posts j ON j.id = sj.job_post_id
            JOIN employment_types et ON et.id = j.employment_type_id
            JOIN currencies c ON c.id = j.currency_id
            JOIN job_post_statuses jps ON jps.id = j.status_id
            JOIN experience_levels el ON el.id = j.experience_level_id
            JOIN salary_types st ON st.id = j.salary_type_id
            WHERE ${conditions.join(" AND ")}
            ORDER BY ${orderColumn} ${orderDirection}
            LIMIT $${idx}
            OFFSET $${idx + 1};
            `;

      // Add pagination params to values
      values.push(parseInt(limit, 10));
      values.push((parseInt(page, 10) - 1) * parseInt(limit, 10));

      const savedJobsResult = await this.db.executeQuery(savedJobsQuery, values);
      if (!savedJobsResult || savedJobsResult.rows.length === 0) {
        return wrapper.error("Saved Jobs Not Found");
      }
      const result = savedJobsResult.rows;
      const pagination = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: savedJobsResult.rows.length,
      };
      return wrapper.paginationData(result, pagination);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAllByWorkerId", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findOneBySavedJobsId(id) {
    try {
      const savedJobsQuery = `
            SELECT 
                sj.id,
                sj.job_post_id,
                sj.worker_id,
                sj.created_at,
                j.recruiter_id,
                j.title,
                j.description,
                j.location,
                et.name AS employment_type,
                j.salary_min,
                j.salary_max,
                c.code AS currency,
                j.published_at,
                j.deadline,
                jps.name AS status,
                j.created_at AS job_post_created_at,
                j.updated_at AS job_post_updated_at,
                el.name AS experience_level,
                st.name AS salary_type,
                w.user_id AS worker_user_id,
                w.name AS worker_name,
                w.avatar_url AS worker_avatar_url,
                w.telephone AS worker_telephone,
                w.date_of_birth AS worker_date_of_birth,
                g.gender_name AS gender,
                n.country_name AS country,
                r.religion_name AS religion,
                ms.status_name AS marriage_status,
                w.address,
                w.profile_summary,
                w.current_salary,
                w.expected_salary,
                w.created_at AS worker_created_at,
                w.updated_at AS worker_updated_at
            FROM ${collection} sj
            JOIN job_posts j ON j.id = sj.job_post_id
            JOIN employment_types et ON et.id = j.employment_type_id
            JOIN currencies c ON c.id = j.currency_id
            JOIN job_post_statuses jps ON jps.id = j.status_id
            JOIN experience_levels el ON el.id = j.experience_level_id
            JOIN salary_types st ON st.id = j.salary_type_id
            JOIN workers w ON w.id = sj.worker_id
            JOIN genders g ON g.id = w.gender_id
            JOIN nationalities n ON n.id = w.nationality_id
            JOIN religions r ON r.id = w.religion_id
            JOIN marriage_statuses ms ON ms.id = w.marriage_status_id
            WHERE sj.id = $1;
            `;

      const savedJobsResult = await this.db.executeQuery(savedJobsQuery, [id]);
      if (!savedJobsResult || savedJobsResult.rows.length === 0) {
        return wrapper.error("Saved Job Not Found");
      }
      const result = savedJobsResult.rows[0];

      return wrapper.data(result);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findOneBySavedJobsId", error);
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
      const savedJobsQuery = `
              SELECT 
                sj.id,
                sj.job_post_id,
                sj.worker_id,
                sj.created_at,
                j.recruiter_id,
                j.title,
                j.description,
                j.location,
                et.name AS employment_type,
                j.salary_min,
                j.salary_max,
                c.code AS currency,
                j.published_at,
                j.deadline,
                jps.name AS status,
                j.created_at AS job_post_created_at,
                j.updated_at AS job_post_updated_at,
                el.name AS experience_level,
                st.name AS salary_type,
                w.user_id AS worker_user_id,
                w.name AS worker_name,
                w.avatar_url AS worker_avatar_url,
                w.telephone AS worker_telephone,
                w.date_of_birth AS worker_date_of_birth,
                g.gender_name AS gender,
                n.country_name AS country,
                r.religion_name AS religion,
                ms.status_name AS marriage_status,
                w.address,
                w.profile_summary,
                w.current_salary,
                w.expected_salary,
                w.created_at AS worker_created_at,
                w.updated_at AS worker_updated_at
              FROM ${collection} sj
              JOIN job_posts j ON j.id = sj.job_post_id
              JOIN employment_types et ON et.id = j.employment_type_id
              JOIN currencies c ON c.id = j.currency_id
              JOIN job_post_statuses jps ON jps.id = j.status_id
              JOIN experience_levels el ON el.id = j.experience_level_id
              JOIN salary_types st ON st.id = j.salary_type_id
              JOIN workers w ON w.id = sj.worker_id
              JOIN genders g ON g.id = w.gender_id
              JOIN nationalities n ON n.id = w.nationality_id
              JOIN religions r ON r.id = w.religion_id
              JOIN marriage_statuses ms ON ms.id = w.marriage_status_id
              WHERE 1=1 ${conditions}
              ORDER BY ${orderColumn} ${orderDirection}
              LIMIT $${idx}
              OFFSET $${idx + 1};
            `;

      values.push(parseInt(limit, 10));
      values.push((parseInt(page, 10) - 1) * parseInt(limit, 10));

      const savedJobsResult = await this.db.executeQuery(savedJobsQuery, values);
      if (!savedJobsResult || savedJobsResult.rows.length === 0) {
        return wrapper.error("All Saved Jobs Not Found");
      }
      const result = savedJobsResult.rows;
      const pagination = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: savedJobsResult.rows.length,
        totalPage: savedJobsResult.rows.length / parseInt(limit, 10),
      };
      return wrapper.paginationData(result, pagination);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "FindAll Saved Jobs", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
