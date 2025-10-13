const joi = require("joi");

const addRecruiterParamType = joi.object({
    user_id: joi.string().required(),
    company_name: joi.string().required(),
    avatar_url: joi.string().optional(),
    company_website: joi.string().optional(),
    contact_name: joi.string().required(),
    contact_phone: joi.string().required(),
    address: joi.string().optional(),
    industry_id: joi.string().optional(),
    description: joi.string().optional(),
});

const updateRecruiterParamType = joi.object({
    id: joi.string().required(),
    user_id: joi.string().required(),
    company_name: joi.string().optional(),
    avatar_url: joi.string().optional(),
    company_website: joi.string().optional(),
    contact_name: joi.string().optional(),
    contact_phone: joi.string().optional(),
    address: joi.string().optional(),
    industry_id: joi.number().optional(),
    description: joi.string().optional(),
});

module.exports = {
    addRecruiterParamType,
    updateRecruiterParamType,
};