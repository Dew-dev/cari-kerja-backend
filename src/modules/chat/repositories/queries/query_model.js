const joi = require("joi");

const getConversationsParamType = joi.object({
  user_id: joi.string().uuid().required(),
  role_id: joi.number().valid(1, 2).required(),
});

const getConversationByIdParamType = joi.object({
  conversation_id: joi.string().uuid().required(),
  user_id: joi.string().uuid().required(),
});

const getMessagesParamType = joi.object({
  conversation_id: joi.string().uuid().required(),
  user_id: joi.string().uuid().required(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  getConversationsParamType,
  getConversationByIdParamType,
  getMessagesParamType,
};
