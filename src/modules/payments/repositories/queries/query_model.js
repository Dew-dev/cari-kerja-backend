const joi = require("joi");

// ----------------------------
// Get All Plans (subscription, single post, boost)
// ----------------------------
const getPlansParamType = joi.object({
  type: joi.string().valid("subscription", "single_post", "boost").optional(),
});

// ----------------------------
// Get Payment Orders (riwayat transaksi)
// ----------------------------
const getPaymentOrdersParamType = joi.object({
  recruiter_id: joi.string().uuid().required(),
  status: joi.string().valid("pending", "paid", "expired", "failed").optional(),
  order_type: joi.string().valid("subscription", "single_post", "boost").optional(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(50).default(10),
});

// ----------------------------
// Get Single Order Detail
// ----------------------------
const getOrderDetailParamType = joi.object({
  id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
});

// ----------------------------
// Get Active Plan per Recruiter
// ----------------------------
const getActivePlanParamType = joi.object({
  recruiter_id: joi.string().uuid().required(),
});

module.exports = {
  getPlansParamType,
  getPaymentOrdersParamType,
  getOrderDetailParamType,
  getActivePlanParamType,
};
