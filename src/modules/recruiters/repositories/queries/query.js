const collection = "recruiters"; // ini table nya
const errorEmptyMessage = "Data Not Found Please Try Another Input"; // ini message
const errorQueryMessage = "Error querying PostgreSQL"; // ini error query message
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Recruiter-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findOne(parameter, projection) {
    return this.db.findOne(parameter, projection, collection);
  }

  async findOneByRecruiterUserId(user_id) {
    try {
      const recruiterQuery = `
            SELECT  recruiters.id,
                    recruiters.user_id,
                    recruiters.company_name,
                    recruiters.avatar_url,
                    recruiters.company_website,
                    recruiters.contact_name,
                    recruiters.contact_phone,
                    recruiters.address,
                    industries.name AS industry,
                    recruiters.industry_id,
                    recruiters.description,
                        recruiters.is_vip,
                        recruiters.vip_start_at,
                        recruiters.vip_end_at,
                    recruiters.created_at,
                    recruiters.updated_at FROM recruiters 
                    LEFT JOIN industries ON industries.id = recruiters.industry_id
                    WHERE recruiters.user_id=$1 OR recruiters.id=$1;
            `;
      const jobpostsQuery = `
            SELECT  job_posts.id, 
                    job_posts.recruiter_id, 
                    job_posts.title, 
                    job_posts.description, 
                    job_posts.location, 
            job_posts.archived_at,
                    employment_types.name AS employment_type, 
                    job_posts.salary_min, 
                    job_posts.salary_max, 
                    currencies.name AS currency, 
                    job_posts.published_at, 
                    job_posts.deadline, 
                    job_post_statuses.name AS status,
                    job_posts.created_at,
                    job_posts.updated_at FROM job_posts
                    LEFT JOIN employment_types ON employment_types.id = job_posts.employment_type_id
                    LEFT JOIN currencies ON currencies.id = job_posts.currency_id
                    LEFT JOIN job_post_statuses ON job_post_statuses.id = job_posts.status_id
                    WHERE job_posts.recruiter_id = $1;
            `;

      const recruiterResult = await this.db.executeQuery(recruiterQuery, [
        user_id,
      ]);
      ////console.log("recruiter res \n", recruiterResult);
      if (!recruiterResult || recruiterResult.rows.length === 0) {
        return wrapper.error("Recruiter Not Found");
      }
      const recruiter = recruiterResult.rows[0];
      const id = recruiter.id;

      const jobpostsResult = await this.db.executeQuery(jobpostsQuery, [id]);

      const result = {
        ...recruiter,
        job_posts: jobpostsResult.rows,
        job_count: jobpostsResult.rows.filter(
          (job) =>
            job.archived_at === null &&
            String(job.status || "").toLowerCase() !== "draft",
        ).length,
        total_job_posts: jobpostsResult.rows.filter(
          (job) =>
            job.archived_at === null &&
            String(job.status || "").toLowerCase() !== "draft",
        ).length,
      };

      return wrapper.data(result);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findOneByRecruiterUserId", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findAllRecruitersWithIndustry() {
    try {
      const query = `
        SELECT
          r.id,
          r.user_id,
          r.company_name,
          r.avatar_url,
          r.company_website,
          r.contact_name,
          r.contact_phone,
          r.address,
          r.industry_id,
          i.name AS industry_name,
          r.description,
          r.is_vip,
          r.vip_start_at,
          r.vip_end_at,
          COUNT(
            CASE
              WHEN jp.archived_at IS NULL
                AND LOWER(COALESCE(jps_count.name, '')) <> 'draft'
              THEN 1
              ELSE NULL
            END
          )::int AS job_count,
          r.created_at,
          r.updated_at
        FROM recruiters r
        LEFT JOIN industries i ON i.id = r.industry_id
        LEFT JOIN job_posts jp ON jp.recruiter_id = r.id
        LEFT JOIN job_post_statuses jps_count ON jps_count.id = jp.status_id
        GROUP BY
          r.id,
          r.user_id,
          r.company_name,
          r.avatar_url,
          r.company_website,
          r.contact_name,
          r.contact_phone,
          r.address,
          r.industry_id,
          i.name,
          r.description,
          r.is_vip,
          r.vip_start_at,
          r.vip_end_at,
          r.created_at,
          r.updated_at
        ORDER BY i.name ASC NULLS LAST, r.company_name ASC;
      `;

      const result = await this.db.executeQuery(query, []);

      if (!result) {
        return wrapper.error(errorQueryMessage);
      }

      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "findAllRecruitersWithIndustry", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
