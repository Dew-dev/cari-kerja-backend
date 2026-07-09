const joi = require("joi");

const getStatsParamType = joi.object({});

const getUsersParamType = joi.object({
  page: joi.number().min(1).default(1),
  limit: joi.number().min(1).max(100).default(10),
  search: joi.string().allow("").optional()
});

const getEmployersParamType = joi.object({
  page: joi.number().min(1).default(1),
  limit: joi.number().min(1).max(100).default(10),
  search: joi.string().allow("").optional()
});

const getJobsParamType = joi.object({
  page: joi.number().min(1).default(1),
  limit: joi.number().min(1).max(100).default(10),
  search: joi.string().allow("").optional()
});

const getApplicationsParamType = joi.object({
  page: joi.number().min(1).default(1),
  limit: joi.number().min(1).max(100).default(10),
  search: joi.string().allow("").optional()
});

module.exports = {
  getStatsParamType,
  getUsersParamType,
  getEmployersParamType,
  getJobsParamType,
  getApplicationsParamType
};
