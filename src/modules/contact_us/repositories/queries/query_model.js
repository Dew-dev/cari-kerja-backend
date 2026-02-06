const joi = require("joi");

// Schema untuk get semua Contact Messages dengan pagination
const getContactMessagesParamType = joi.object({
  page: joi.number().integer().min(1).optional().default(1),
  limit: joi.number().integer().min(1).optional().default(10),
  search: joi.string().optional().allow(null),
});

// Schema untuk get Contact Message by ID
const getContactMessageByIdParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  getContactMessagesParamType,
  getContactMessageByIdParamType,
};
