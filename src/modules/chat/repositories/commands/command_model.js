const joi = require("joi");

const startConversationParamType = joi.object({
  worker_id: joi.string().uuid().required(),
  recruiter_id: joi.string().uuid().required(),
  job_id: joi.string().uuid().optional().allow(null, ""),
  role_id: joi.number().valid(1, 2).required(),
});

const sendMessageParamType = joi.object({
  conversation_id: joi.string().uuid().required(),
  sender_id: joi.string().uuid().required(),
  role_id: joi.number().valid(1, 2).required(),
  message: joi.string().min(1).max(5000).required(),
  type: joi.string().max(20).optional().default("text"),
});

const markAsReadParamType = joi.object({
  conversation_id: joi.string().uuid().required(),
  user_id: joi.string().uuid().required(),
  role_id: joi.number().valid(1, 2).required(),
});

module.exports = {
  startConversationParamType,
  sendMessageParamType,
  markAsReadParamType,
};
