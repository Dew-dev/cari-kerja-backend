const joi = require("joi");

const dateString = joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).messages({
  "string.pattern.base": "Date must be in YYYY-MM-DD format",
});

const addCertification = joi.object({
  worker_id: joi.string().required(),
  name: joi.string().required(),
  issuer: joi.string().required(),
  link: joi.string().required(),
  issue_date: dateString.required(),
  expiry_date: dateString.optional().allow(null),
  credential_id: joi.string().optional().allow(""),
  is_active: joi.boolean().required(),
});

const updateCertification = joi.object({
  id: joi.string().required(),
  worker_id: joi.string().required(),
  name: joi.string().optional(),
  issuer: joi.string().optional(),
  link: joi.string().required(),
  issue_date: dateString.optional(),
  expiry_date: dateString.optional().allow(null),
  credential_id: joi.string().optional().allow(""),
  is_active: joi.boolean().optional(),
});

const deleteCertification = joi.object({
  id: joi.string().required(),
  worker_id: joi.string().required(),
});

module.exports = {
  addCertification,
  updateCertification,
  deleteCertification,
};
