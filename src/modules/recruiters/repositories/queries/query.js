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
                    recruiters.description,
                    recruiters.created_at,
                    recruiters.updated_at FROM recruiters 
                    JOIN industries ON industries.id = recruiters.industry_id
                    WHERE recruiters.user_id=$1;
            `;

            const jobpostsQuery = `
            SELECT  job_posts.id, 
                    job_posts.recruiter_id, 
                    job_posts.title, 
                    job_posts.description, 
                    job_posts.location, 
                    employment_types.name AS employment_type, 
                    job_posts.salary_min, 
                    job_posts.salary_max, 
                    currencies.name AS currency, 
                    job_posts.published_at, 
                    job_posts.deadline, 
                    job_post_statuses.name AS status,
                    job_posts.created_at,
                    job_posts.updated_at FROM job_posts
                    JOIN employment_types ON employment_types.id = job_posts.employment_type_id
                    JOIN currencies ON currencies.id = job_posts.currency_id
                    JOIN job_post_statuses ON job_post_statuses.id = job_posts.status_id
                    WHERE job_posts.recruiter_id = $1;
            `;

            const recruiterResult = await this.db.executeQuery(recruiterQuery, [user_id]);
            if(!recruiterResult || recruiterResult.rows.length === 0) {
                return wrapper.error("Recruiter Not Found");
            }
            const recruiter = recruiterResult.rows[0];
            const id = recruiter.id;
            
            
            const jobpostsResult = await this.db.executeQuery(jobpostsQuery, [id]);

            const result = {
                ...recruiter,
                job_posts: jobpostsResult.rows,
            };

            return wrapper.data(result);
        } catch (error) {
            logger.error(ctx, errorQueryMessage, "findOneByRecruiterUserId", error);
            return wrapper.error(errorQueryMessage);
        }
    } 
}

module.exports = Query;