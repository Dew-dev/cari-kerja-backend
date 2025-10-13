const joi = require("joi");

const addWorkerParamType = joi.object({
  user_id: joi.string().required(),
  name: joi.string().optional(),
  avatar_url: joi.string().optional(),
  telephone: joi.string().optional(),
  date_of_birth: joi.string().optional(),
  gender_id: joi.number().optional(),
  nationality_id: joi.number().optional(),
  religion_id: joi.number().optional(),
  marriage_status_id: joi.number().optional(),
  address: joi.string().optional(),
  profile_summary: joi.string().optional(),
  current_salary: joi.number().optional(),
  expected_salary: joi.number().optional(),
});

const updateWorkerParamType = joi.object({
  id: joi.string().required(),
  user_id: joi.string().required(),
  worker_id: joi.string().required(),
  name: joi.string().optional(),
  avatar_url: joi.string().optional(),
  telephone: joi.string().optional(),
  date_of_birth: joi.string().optional(),
  gender_id: joi.number().optional(),
  nationality_id: joi.number().optional(),
  religion_id: joi.number().optional(),
  marriage_status_id: joi.number().optional(),
  address: joi.string().optional(),
  profile_summary: joi.string().required(),
  current_salary: joi.number().optional(),
  expected_salary: joi.number().optional(),
});

module.exports = {
  addWorkerParamType,
  updateWorkerParamType,
};
