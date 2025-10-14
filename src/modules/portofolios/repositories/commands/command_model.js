const joi = require("joi");

// Schema untuk menambahkan Portfolios
const addPortfoliosParamType = joi.object({
  worker_id: joi.string().required(),
  title: joi.string().max(150).required(),
  description: joi.string().optional().allow(null),
  link: joi.string().max(500).required(),
  is_public: joi.boolean().optional().default(false),
});

// Schema untuk mengupdate Portfolios
const updatePortfoliosParamType = joi.object({
  id: joi.string().required(), // Portfolios id
  worker_id: joi.string().required(),
  title: joi.string().max(150).required(),
  description: joi.string().optional().allow(null),
  link: joi.string().max(500).required(),
  is_public: joi.boolean().optional().default(false),
});

// Schema untuk menghapus Portfolios
const deletePortfoliosParamType = joi.object({
  worker_id: joi.string().required(),
  id: joi.string().required(),
});

module.exports = {
  addPortfoliosParamType,
  updatePortfoliosParamType,
  deletePortfoliosParamType
};
