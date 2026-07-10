const joi = require("joi");

const updateUserStatusParamType = joi.object({
  id: joi.string().uuid().required(),
  is_suspended: joi.boolean().required()
});

const verifyEmployerParamType = joi.object({
  id: joi.string().uuid().required(),
  is_verified: joi.boolean().required()
});

const updateJobStatusParamType = joi.object({
  id: joi.string().uuid().required(),
  status: joi.string().valid("OPEN", "CLOSED", "DRAFT", "PENDING", "REJECTED", "ARCHIVED").required()
});

const updateSystemSettingsParamType = joi.object({
  platform_name: joi.string().optional(),
  support_email: joi.string().email().optional(),
  maintenance_mode: joi.boolean().optional(),
  max_upload_size_mb: joi.number().optional(),
  allow_employer_registration: joi.boolean().optional()
});

const insertLookupTableParamType = joi.object({
  table: joi.string().required(),
  name: joi.string().required()
});



const updateLookupTableParamType = joi.object({
  table: joi.string().required(),
  id: joi.number().required(),
  name: joi.string().required()
});

const deleteLookupTableParamType = joi.object({
  table: joi.string().required(),
  id: joi.number().required()
});

const insertUserParamType = joi.object({
  username: joi.string().required(),
  email: joi.string().email().required(),
  password: joi.string().required(),
  role_id: joi.number().valid(1,2,3,4).required()
});

const updateUserParamType = joi.object({
  id: joi.string().guid().required(),
  username: joi.string().optional(),
  email: joi.string().email().optional(),
  role_id: joi.number().valid(1,2,3,4).optional(),
  is_suspended: joi.boolean().optional(),
  password: joi.string().optional()
});

const deleteUserParamType = joi.object({
  id: joi.string().guid().required(),
  hard_delete: joi.boolean().default(false)
});

const updateWorkerParamType = joi.object({
  id: joi.string().guid().required(),
  name: joi.string().optional(),
  telephone: joi.string().optional(),
  address: joi.string().allow("").optional(),
  profile_summary: joi.string().allow("").optional(),
  current_salary: joi.number().optional(),
  expected_salary: joi.number().optional(),
  gender_id: joi.number().optional(),
  date_of_birth: joi.date().iso().optional()
});

const deleteWorkerParamType = joi.object({
  id: joi.string().guid().required(),
  hard_delete: joi.boolean().default(false)
});

const updateEmployerParamType = joi.object({
  id: joi.string().guid().required(),
  company_name: joi.string().optional(),
  contact_name: joi.string().optional(),
  contact_phone: joi.string().optional(),
  company_email: joi.string().email().optional(),
  company_website: joi.string().allow("").optional(),
  company_address: joi.string().allow("").optional(),
  company_description: joi.string().allow("").optional(),
  is_vip: joi.boolean().optional(),
  is_verified: joi.boolean().optional(),
  industry_id: joi.number().optional(),
  website: joi.string().allow("").optional(),
  description: joi.string().allow("").optional()
});

const deleteEmployerParamType = joi.object({
  id: joi.string().guid().required(),
  hard_delete: joi.boolean().default(false)
});

const updateJobParamType = joi.object({
  id: joi.string().guid().required(),
  title: joi.string().optional(),
  description: joi.string().allow("").optional(),
  requirements: joi.string().allow("").optional(),
  benefits: joi.string().allow("").optional(),
  location: joi.string().allow("").optional(),
  is_remote: joi.boolean().optional(),
  min_salary: joi.number().optional(),
  max_salary: joi.number().optional(),
  status_name: joi.string().optional(),
  salary: joi.number().optional()
});

const deleteJobParamType = joi.object({
  id: joi.string().guid().required(),
  hard_delete: joi.boolean().default(false)
});

const updateApplicationParamType = joi.object({
  id: joi.string().guid().required(),
  status_name: joi.string().required()
});

const deleteApplicationParamType = joi.object({
  id: joi.string().guid().required(),
  hard_delete: joi.boolean().default(false)
});

module.exports = {
  updateUserStatusParamType,
  verifyEmployerParamType,
  updateJobStatusParamType,
  updateSystemSettingsParamType,
  insertLookupTableParamType,
  updateLookupTableParamType,
  deleteLookupTableParamType,
  insertUserParamType,
  updateUserParamType,
  deleteUserParamType,
  updateWorkerParamType,
  deleteWorkerParamType,
  updateEmployerParamType,
  deleteEmployerParamType,
  updateJobParamType,
  deleteJobParamType,
  updateApplicationParamType,
  deleteApplicationParamType
};
