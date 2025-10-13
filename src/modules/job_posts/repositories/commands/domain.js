const {v4: uuidv4} = require("uuid");
const Command = require("./command");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {NotFoundError, ConflictError, InternalServerError, BadRequestError} = require("../../../../helpers/errors");
const ctx = "Jobposts-Command-Domain";

class Jobpost {
    constructor(db) {
        this.command = new Command(db);
    }

    async createJobPost(payload) {
        const {
            recruiter_id,
            title,
            description,
            employment_type_id,
            experience_level_id,
            salary_type_id,
            location,
            salary_min,
            salary_max,
            currency_id,
            status_id,
            deadline,
        } = payload;

        const data = {
            id: uuidv4(),
            recruiter_id,
            title,
            description,
            employment_type_id,
            experience_level_id,
            salary_type_id,
            location,
            salary_min,
            salary_max,
            currency_id,
            status_id,
            deadline,
        };

        const result = await this.command.insertOne(data);
        if (result.err) {
            logger.error(ctx, "Create job post", "Job Posts Commands", result.err);
            return wrapper.error(new InternalServerError("Create Job Post Failed"));
        }
        
        return wrapper.data(data);
    }
}

module.exports = Jobpost;