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
  current_salary_currency_id: joi.number().optional(),
  expected_salary: joi.number().optional(),
  expected_salary_currency_id: joi.number().optional(),
}).with('current_salary', 'current_salary_currency_id')
  .with('current_salary_currency_id', 'current_salary')
  .with('expected_salary', 'expected_salary_currency_id')
  .with('expected_salary_currency_id', 'expected_salary');

const updateWorkerParamType = joi.object({
  id: joi.string().required(),
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
  profile_summary: joi.string().required(),
  current_salary: joi.number().optional(),
  current_salary_currency_id: joi.number().optional(),
  expected_salary: joi.number().optional(),
  expected_salary_currency_id: joi.number().optional(),
}).with('current_salary', 'current_salary_currency_id')
  .with('current_salary_currency_id', 'current_salary')
  .with('expected_salary', 'expected_salary_currency_id')
  .with('expected_salary_currency_id', 'expected_salary');

module.exports = {
  addWorkerParamType,
  updateWorkerParamType,
};
