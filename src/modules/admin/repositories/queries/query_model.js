const joi = require("joi");

// Kontrak list seragam: page/limit/search + sort_by whitelist per endpoint + sort_order.
// Param di luar whitelist tetap ditolak oleh Joi (unknown keys forbidden by default).
const listBaseKeys = (sortKeys) => ({
  page: joi.number().min(1).default(1),
  limit: joi.number().min(1).max(100).default(10),
  search: joi.string().allow("").optional(),
  sort_by: joi.string().valid(...sortKeys).optional(),
  sort_order: joi.string().lowercase().valid("asc", "desc").default("desc")
});

const deletedStateType = joi.string().valid("active", "deleted", "all").default("all");

const getStatsParamType = joi.object({});

const getDashboardGrowthParamType = joi.object({});
const getDashboardJobDistributionParamType = joi.object({});
const getDashboardActivitiesParamType = joi.object({});



const getAuditLogsParamType = joi.object({
  ...listBaseKeys(["created_at", "action"]),
  action: joi.string().max(100).optional(),
  date_from: joi.date().iso().optional(),
  date_to: joi.date().iso().optional()
});

const getFraudEventsParamType = joi.object({
  ...listBaseKeys(["created_at", "risk_score", "status", "updated_at"]),
  status: joi
    .string()
    .valid("open", "reviewing", "resolved_clean", "resolved_actioned")
    .optional(),
  entity_type: joi
    .string()
    .valid("job_post", "user", "chat_message", "payment_order")
    .optional(),
  source: joi.string().max(64).optional(),
  date_from: joi.date().iso().optional(),
  date_to: joi.date().iso().optional(),
});

const getFraudEventByIdParamType = joi.object({
  id: joi.string().guid().required(),
});

const getUsersParamType = joi.object({
  ...listBaseKeys(["created_at", "updated_at", "role_id", "is_suspended"]),
  role_id: joi.number().optional(),
  is_suspended: joi.boolean().optional(),
  deleted_state: deletedStateType
});

const getUserByIdParamType = joi.object({
  id: joi.string().guid().required()
});

const getWorkersParamType = joi.object({
  ...listBaseKeys(["created_at", "updated_at", "gender_id"]),
  gender_id: joi.number().optional(),
  deleted_state: deletedStateType
});

const getWorkerByIdParamType = joi.object({
  id: joi.string().guid().required()
});

const getEmployersParamType = joi.object({
  ...listBaseKeys(["created_at", "updated_at", "is_verified", "is_vip"]),
  is_verified: joi.boolean().optional(),
  industry_id: joi.number().integer().optional(),
  deleted_state: deletedStateType
});

const getEmployerByIdParamType = joi.object({
  id: joi.string().guid().required()
});

const getJobsParamType = joi.object({
  ...listBaseKeys(["created_at", "updated_at", "title", "needs_review"]),
  status: joi.string().optional(),
  recruiter_id: joi.string().guid().optional(),
  needs_review: joi.boolean().optional(),
});

const getApplicationsParamType = joi.object({
  ...listBaseKeys(["applied_at", "updated_at", "job_title"]),
  application_status_id: joi.number().integer().optional()
});

const getJobByIdParamType = joi.object({
  id: joi.string().guid().required()
});

const getLookupTableParamType = joi.object({
  table: joi.string().required(),
  search: joi.string().allow("").optional()
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
  ...listBaseKeys(["created_at", "updated_at", "amount", "paid_at", "status"]),
  status: joi.string().valid("pending", "paid", "expired", "failed").optional(),
  order_type: joi.string().valid("subscription", "single_post", "boost").optional()
});

const getPaymentOrderByIdParamType = joi.object({
  id: joi.string().guid().required()
});

const getPlansByTypeParamType = joi.object({
  type: joi.string().valid("subscription", "single_post", "boost").required(),
  search: joi.string().allow("").optional()
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
  getFraudEventsParamType,
  getFraudEventByIdParamType,
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
