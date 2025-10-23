const joi = require("joi");

const getTagsPerJobPostParamType = joi.object({
    job_post_id: joi.string().required(),
});

const getOneTagByNameParamType = joi.object({
    name: joi.string().required(),
});

const getOneJobPostTagByTagIdAndJobPostIdParamType = joi.object({
    tag_id: joi.string().required(),
    job_post_id: joi.string().required(),
});

module.exports = {
    getTagsPerJobPostParamType,
    getOneTagByNameParamType,
    getOneJobPostTagByTagIdAndJobPostIdParamType,
}