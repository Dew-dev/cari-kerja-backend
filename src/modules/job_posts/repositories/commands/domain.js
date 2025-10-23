const {v4: uuidv4} = require("uuid");
const Command = require("./command");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {NotFoundError, ConflictError, InternalServerError, BadRequestError} = require("../../../../helpers/errors");
const ctx = "Jobposts-Command-Domain";
const joi = require("joi");
const commandModel = require("../../repositories/commands/command_model");
const validator = require("../../../../helpers/utils/validator");
const { sendResponse, paginationResponse } = require("../../../../helpers/utils/response");
const jobPostQuestionParamType = require("./command_model.js");

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

    async createJobPostQuestions(payloadArray,id, ctx) {
        // try {
            if (!Array.isArray(payloadArray)) {
                throw new Error("Payload harus berupa array of questions");
            }

            // Validasi & siapkan data
            const validatedData = payloadArray.map((item, idx) => {

                const validateItem = validator.isValidPayload(
                    item,
                    commandModel.jobPostQuestionParamType
                );

                if (validateItem.err) {
                    throw new Error(`Validation error: ${validateItem.err.message}`);
                }
                const value = validateItem.data;

                return {
                    id: uuidv4(),
                    job_post_id: id,
                    question_text: value.question_text,
                    question_type_id: value.question_type_id,
                    options: value.options || null,
                    is_required: value.is_required,
                    order_index: value.order_index,
                    created_at: value.created_at,
                    updated_at: value.updated_at,
                };
            });
            // Lakukan bulk insert
            const result = await this.command.insertMany(validatedData, 'job_post_questions');
            if (result.err) {
                logger.error(ctx, "Bulk create job post questions", "Job Posts Commands", result.err);
                return wrapper.error(new InternalServerError(result.err));
            }

            return wrapper.data(validatedData);
        // } catch (err) {
        //     logger.error(ctx, "Bulk create job post questions", "Job Posts Commands", err);
        //     return wrapper.error(new InternalServerError(err.message));
        // }
    }
}

module.exports = Jobpost;