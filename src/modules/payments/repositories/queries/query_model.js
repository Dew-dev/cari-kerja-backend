const joi = require("joi");

const getPlansParamType = joi.object({
  type: joi.string().valid("subscription", "single_post", "boost").optional(),
});

const getPaymentOrdersParamType = joi.object({
  company_id: joi.string().uuid().required(),
  status: joi.string().valid("pending", "paid", "expired", "failed").optional(),
  order_type: joi.string().valid("subscription", "single_post", "boost").optional(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(50).default(10),
});

const getOrderDetailParamType = joi.object({
  id: joi.string().uuid().required(),
  company_id: joi.string().uuid().required(),
});

const getActivePlanParamType = joi.object({
  company_id: joi.string().uuid().required(),
});

module.exports = {
  getPlansParamType,
  getPaymentOrdersParamType,
  getOrderDetailParamType,
  getActivePlanParamType,
};
