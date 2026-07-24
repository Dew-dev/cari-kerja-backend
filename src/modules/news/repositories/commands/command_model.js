const joi = require("joi");

const translationFields = joi.object({
  title: joi.string().max(255).required(),
  body: joi.string().required(),
  slug: joi.string().max(280).allow("", null).optional(),
  excerpt: joi.string().allow("", null).optional(),
  meta_title: joi.string().max(255).allow("", null).optional(),
  meta_description: joi.string().max(500).allow("", null).optional(),
});

const createNewsParamType = joi
  .object({
    category_id: joi.string().uuid().allow(null, "").optional(),
    is_featured: joi.boolean().optional(),
    cover_url: joi.string().allow("", null).optional(),
    author_user_id: joi.string().uuid().required(),
    translations: joi.object().pattern(joi.string(), translationFields).optional(),
    // Flat shorthand → translations.id
    title: joi.string().max(255).optional(),
    body: joi.string().optional(),
    slug: joi.string().max(280).allow("", null).optional(),
    excerpt: joi.string().allow("", null).optional(),
    meta_title: joi.string().max(255).allow("", null).optional(),
    meta_description: joi.string().max(500).allow("", null).optional(),
  })
  .or("translations", "title");

const updateNewsParamType = joi.object({
  id: joi.string().uuid().required(),
  category_id: joi.string().uuid().allow(null, "").optional(),
  is_featured: joi.boolean().optional(),
  cover_url: joi.string().allow("", null).optional(),
  translations: joi
    .object()
    .pattern(
      joi.string(),
      joi.object({
        title: joi.string().max(255).optional(),
        body: joi.string().optional(),
        slug: joi.string().max(280).allow("", null).optional(),
        excerpt: joi.string().allow("", null).optional(),
        meta_title: joi.string().max(255).allow("", null).optional(),
        meta_description: joi.string().max(500).allow("", null).optional(),
      })
    )
    .optional(),
  title: joi.string().max(255).optional(),
  body: joi.string().optional(),
  slug: joi.string().max(280).allow("", null).optional(),
  excerpt: joi.string().allow("", null).optional(),
  meta_title: joi.string().max(255).allow("", null).optional(),
  meta_description: joi.string().max(500).allow("", null).optional(),
});

const newsIdParamType = joi.object({
  id: joi.string().uuid().required(),
});

const uploadCoverParamType = joi.object({
  id: joi.string().uuid().required(),
  cover_url: joi.string().required(),
});

const categoryTranslationFields = joi.object({
  name: joi.string().max(120).required(),
  slug: joi.string().max(160).allow("", null).optional(),
});

const createCategoryParamType = joi
  .object({
    translations: joi
      .object()
      .pattern(joi.string(), categoryTranslationFields)
      .optional(),
    name: joi.string().max(120).optional(),
    slug: joi.string().max(160).allow("", null).optional(),
  })
  .or("translations", "name");

const updateCategoryParamType = joi.object({
  id: joi.string().uuid().required(),
  translations: joi
    .object()
    .pattern(
      joi.string(),
      joi.object({
        name: joi.string().max(120).optional(),
        slug: joi.string().max(160).allow("", null).optional(),
      })
    )
    .optional(),
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
