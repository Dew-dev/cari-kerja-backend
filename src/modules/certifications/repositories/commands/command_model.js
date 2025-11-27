const joi = require("joi");

const addCertification = joi.object({
  worker_id: joi.string().required(),
  name: joi.string().required(),
  issuer: joi.string().required(),
  link: joi.string().required(),
  issue_date: joi.string().required(),
  expiry_date: joi.string().optional().allow(null),
  credential_id: joi.string().optional().allow(""),
  is_active: joi.boolean().required(),
});

const updateCertification = joi.object({
  id: joi.string().required(),
  worker_id: joi.string().required(),
  name: joi.string().optional(),
  issuer: joi.string().optional(),
  link: joi.string().required(),
  issue_date: joi.string().optional(),
  expiry_date: joi.string().optional().allow(null),
  credential_id: joi.string().optional().allow(""),
  is_active: joi.boolean().optional(),
});

const deleteCertification = joi.object({
  id: joi.string().required(),
});

module.exports = {
  addCertification,
  updateCertification,
  deleteCertification,
};
