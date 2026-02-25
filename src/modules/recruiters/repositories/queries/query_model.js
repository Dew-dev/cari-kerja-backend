const joi = require("joi");

const getRecruiterByUserIdParamType = joi.object({
    user_id: joi.string().required(),
});

const getAllRecruitersByIndustryParamType = joi.object({});

const getAllCompaniesParamType = joi.object({
    search: joi.string().optional(),
    page: joi.number().default(1).optional(),
    limit: joi.number().default(10).optional(),
});

module.exports = {
    getRecruiterByUserIdParamType,
    getAllRecruitersByIndustryParamType,
    getAllCompaniesParamType,
}