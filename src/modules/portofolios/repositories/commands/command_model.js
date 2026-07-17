const joi = require("joi");

const addPortfoliosParamType = joi.object({
  worker_id: joi.string().uuid().required(),
  title: joi.string().max(150).required(),
  description: joi.string().optional().allow(null),
  link: joi.string().uri().max(500).required(),
  is_public: joi.boolean().optional().default(false),
});

const updatePortfoliosParamType = joi.object({
  id: joi.string().uuid().required(),
  worker_id: joi.string().uuid().required(),
  title: joi.string().max(150).required(),
  description: joi.string().optional().allow(null),
  link: joi.string().uri().max(500).required(),
  is_public: joi.boolean().optional().default(false),
});

const deletePortfoliosParamType = joi.object({
  worker_id: joi.string().uuid().required(),
  id: joi.string().uuid().required(),
});

module.exports = {
  addPortfoliosParamType,
  updatePortfoliosParamType,
  deletePortfoliosParamType,
};
