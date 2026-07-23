const joi = require("joi");

const listPublicNewsParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(10),
  search: joi.string().allow("").optional(),
  category_slug: joi.string().allow("").optional(),
  featured: joi.alternatives().try(joi.boolean(), joi.string().valid("true", "false")).optional(),
});

const getPublicNewsParamType = joi.object({
  slug: joi.string().required(),
});

const listAdminNewsParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(10),
  search: joi.string().allow("").optional(),
  status: joi.string().valid("draft", "published", "archived").optional(),
});

const getAdminNewsParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  listPublicNewsParamType,
  getPublicNewsParamType,
  listAdminNewsParamType,
  getAdminNewsParamType,
};
