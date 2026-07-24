const joi = require("joi");

const localeField = joi.string().trim().max(16).optional();

const listPublicNewsParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(10),
  search: joi.string().allow("").optional(),
  category_slug: joi.string().allow("").optional(),
  featured: joi
    .alternatives()
    .try(joi.boolean(), joi.string().valid("true", "false"))
    .optional(),
  locale: localeField,
});

const getPublicNewsParamType = joi.object({
  slug: joi.string().required(),
  locale: localeField,
});

const listCategoriesParamType = joi.object({
  locale: localeField,
});

const listAdminNewsParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(10),
  search: joi.string().allow("").optional(),
  status: joi.string().valid("draft", "published", "archived").optional(),
  locale: localeField,
});

const getAdminNewsParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  listPublicNewsParamType,
  getPublicNewsParamType,
  listCategoriesParamType,
  listAdminNewsParamType,
  getAdminNewsParamType,
};
