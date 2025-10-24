const joi = require("joi");

const createJobPostParamType = joi.object({
    recruiter_id: joi.string().required(),
    title: joi.string().required(),
    description: joi.string().required(),
    employment_type_id: joi.number().required(),
    experience_level_id: joi.number().required(),
    salary_type_id: joi.number().required(),
    location: joi.string().required(),
    salary_min: joi.number().required(),
    salary_max: joi.number().required(),
    currency_id: joi.number().required(),
    status_id: joi.number().default(3),
    deadline: joi.string().required(),
});

const jobPostQuestionParamType = joi.object({
    job_post_id: joi.string().uuid().required(),
    question_text: joi.string().required(),
    question_type_id: joi.number().integer().required(),
    options: joi.object().allow(null).default(null),
    is_required: joi.boolean().default(true),
    order_index: joi.number().integer().min(0).default(0),
    created_at: joi.date().default(() => new Date().toISOString()), // sama dengan now()
    updated_at: joi.date().default(() => new Date().toISOString()), // sama dengan now()
});

const jobPostQuestionUpdateParamType = joi.object({
  id: joi.string().uuid().required(),
  job_post_id: joi.string().uuid().optional(), // tidak wajib saat update
  question_text: joi.string().required(),
  question_type_id: joi.number().integer().required(),
  options: joi.object().allow(null).default(null),
  is_required: joi.boolean().default(true),
  order_index: joi.number().integer().min(0).default(0),
  updated_at: joi.date().default(() => new Date().toISOString()), // created_at tidak perlu di-update
});

module.exports = {
    createJobPostParamType,
    jobPostQuestionParamType,
    jobPostQuestionUpdateParamType
}