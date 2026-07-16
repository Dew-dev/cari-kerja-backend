const joi = require("joi");

const getStatsParamType = joi.object({});

const getDashboardGrowthParamType = joi.object({});
const getDashboardJobDistributionParamType = joi.object({});
const getDashboardActivitiesParamType = joi.object({});



const getAuditLogsParamType = joi.object({
  page: joi.number().min(1).default(1),
  limit: joi.number().min(1).max(100).default(10),
  search: joi.string().allow("").optional()
});

const getUsersParamType = joi.object({
  page: joi.number().min(1).default(1),
  limit: joi.number().min(1).max(100).default(10),
  search: joi.string().allow("").optional()
});

const getUserByIdParamType = joi.object({
  id: joi.string().guid().required()
});

const getWorkersParamType = joi.object({
  page: joi.number().min(1).default(1),
  limit: joi.number().min(1).max(100).default(10),
  search: joi.string().allow("").optional()
});

const getWorkerByIdParamType = joi.object({
  id: joi.string().guid().required()
});

const getEmployersParamType = joi.object({
  page: joi.number().min(1).default(1),
  limit: joi.number().min(1).max(100).default(10),
  search: joi.string().allow("").optional()
});

const getEmployerByIdParamType = joi.object({
  id: joi.string().guid().required()
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

const getJobByIdParamType = joi.object({
  id: joi.string().guid().required()
});

const getLookupTableParamType = joi.object({
  table: joi.string().required()
});

const getWorkerSubResourceParamType = joi.object({
  worker_id: joi.string().guid().required()
});

const getEmployerSubResourceParamType = joi.object({
  employer_id: joi.string().guid().required()
});

const getConversationMessagesParamType = joi.object({
  id: joi.string().guid().required()
});

const getPaymentOrdersParamType = joi.object({
  page: joi.number().min(1).default(1),
  limit: joi.number().min(1).max(100).default(10),
  search: joi.string().allow("").optional(),
  status: joi.string().valid("pending", "paid", "expired", "failed").optional(),
  order_type: joi.string().valid("subscription", "single_post", "boost").optional()
});

const getPaymentOrderByIdParamType = joi.object({
  id: joi.string().guid().required()
});

const getPlansByTypeParamType = joi.object({
  type: joi.string().valid("subscription", "single_post", "boost").required()
});

const getAllPlansParamType = joi.object({});

module.exports = {
  getStatsParamType,
  getUsersParamType,
  getEmployersParamType,
  getJobsParamType,
  getApplicationsParamType,
  getDashboardGrowthParamType,
  getDashboardJobDistributionParamType,
  getDashboardActivitiesParamType,
  getAuditLogsParamType,
  getUserByIdParamType,
  getWorkersParamType,
  getWorkerByIdParamType,
  getEmployerByIdParamType,
  getJobByIdParamType,
  getLookupTableParamType,
  getPlansByTypeParamType,
  getAllPlansParamType,
  getPaymentOrdersParamType,
  getPaymentOrderByIdParamType,
  getWorkerSubResourceParamType,
  getEmployerSubResourceParamType,
  getConversationMessagesParamType
};
