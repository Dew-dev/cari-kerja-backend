const joi = require("joi");

const getWorkerByUserIdParamType = joi.object({
  user_id: joi.string().required(),
});

const getWorkerByIdParamType = joi.object({
  id: joi.string().uuid().required(),
});

const getWorkersParamType = joi.object({
  search: joi.string().optional(),
  skills: joi.alternatives().try(
    joi.string(),
    joi.array().items(joi.string())
  ).optional(),
  gender: joi.string().optional(),
  nationality: joi.string().optional(),
  min_salary: joi.number().optional(),
  max_salary: joi.number().optional(),
  experience_years: joi.number().optional(),
  education_level: joi.string().optional(),
  sort_by: joi.string().optional(),
  sort_order: joi.string().optional(),
  page: joi.number().optional(),
  limit: joi.number().optional(),
});

module.exports = {
  getWorkerByUserIdParamType,
  getWorkerByIdParamType,
  getWorkersParamType,
};
