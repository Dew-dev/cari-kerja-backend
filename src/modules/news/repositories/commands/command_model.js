const joi = require("joi");

const createNewsParamType = joi.object({
  title: joi.string().max(255).required(),
  body: joi.string().required(),
  slug: joi.string().max(280).allow("", null).optional(),
  excerpt: joi.string().allow("", null).optional(),
  category_id: joi.string().uuid().allow(null, "").optional(),
  is_featured: joi.boolean().optional(),
  meta_title: joi.string().max(255).allow("", null).optional(),
  meta_description: joi.string().max(500).allow("", null).optional(),
  cover_url: joi.string().allow("", null).optional(),
  author_user_id: joi.string().uuid().required(),
});

const updateNewsParamType = joi.object({
  id: joi.string().uuid().required(),
  title: joi.string().max(255).optional(),
  body: joi.string().optional(),
  slug: joi.string().max(280).allow("", null).optional(),
  excerpt: joi.string().allow("", null).optional(),
  category_id: joi.string().uuid().allow(null, "").optional(),
  is_featured: joi.boolean().optional(),
  meta_title: joi.string().max(255).allow("", null).optional(),
  meta_description: joi.string().max(500).allow("", null).optional(),
  cover_url: joi.string().allow("", null).optional(),
});

const newsIdParamType = joi.object({
  id: joi.string().uuid().required(),
});

const uploadCoverParamType = joi.object({
  id: joi.string().uuid().required(),
  cover_url: joi.string().required(),
});

const createCategoryParamType = joi.object({
  name: joi.string().max(120).required(),
  slug: joi.string().max(160).allow("", null).optional(),
});

const updateCategoryParamType = joi.object({
  id: joi.string().uuid().required(),
  name: joi.string().max(120).optional(),
  slug: joi.string().max(160).allow("", null).optional(),
});

const categoryIdParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  createNewsParamType,
  updateNewsParamType,
  newsIdParamType,
  uploadCoverParamType,
  createCategoryParamType,
  updateCategoryParamType,
  categoryIdParamType,
};
