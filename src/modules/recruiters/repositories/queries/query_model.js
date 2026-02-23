const joi = require("joi");

const getRecruiterByUserIdParamType = joi.object({
    user_id: joi.string().required(),
});

const getAllRecruitersByIndustryParamType = joi.object({});

module.exports = {
    getRecruiterByUserIdParamType,
    getAllRecruitersByIndustryParamType,
}