const joi = require("joi");

// ----------------------------
// Create Invoice (buat pembayaran)
// ----------------------------
const createInvoiceParamType = joi.object({
  recruiter_id: joi.string().uuid().required(),
  user_email: joi.string().email().required(),
  user_id: joi.string().uuid().optional().allow(null, ""),
  order_type: joi.string().valid("subscription", "single_post", "boost").required(),
  plan_id: joi.number().integer().positive().required(),
  job_post_id: joi.string().uuid().optional().allow(null, ""),
  ip_address: joi.string().optional().allow("", null),
  user_agent: joi.string().optional().allow("", null),
  // wajib jika order_type = 'boost'
});

// ----------------------------
// Handle Xendit Webhook
// ----------------------------
const xenditWebhookParamType = joi.object({
  id: joi.string().required(),
  external_id: joi.string().required(),
  status: joi.string().required(),
  paid_amount: joi.number().optional(),
  paid_at: joi.string().optional().allow(null, ""),
  payment_method: joi.string().optional().allow(null, ""),
}).unknown(true); // allow extra fields dari Xendit

// ----------------------------
// Apply Single Post Slot ke Job Post
// ----------------------------
const applySinglePostParamType = joi.object({
  recruiter_id: joi.string().uuid().required(),
  single_post_slot_id: joi.string().uuid().required(),
  job_post_id: joi.string().uuid().required(),
});

module.exports = {
  createInvoiceParamType,
  xenditWebhookParamType,
  applySinglePostParamType,
};
