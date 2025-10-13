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
    status_id: joi.number().required(),
    deadline: joi.string().required(),
});

module.exports = {
    createJobPostParamType
}