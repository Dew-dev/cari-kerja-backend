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
  status: joi.string().valid("OPEN", "CLOSED", "DRAFT", "PENDING", "REJECTED", "ARCHIVED").required(),
  reject_reason: joi.string().max(2000).allow("", null).optional(),
});

const resolveFraudEventParamType = joi.object({
  id: joi.string().uuid().required(),
  action: joi
    .string()
    .valid("mark_clean", "approve_job", "reject_job", "suspend_user")
    .required(),
  note: joi.string().max(1000).allow("", null).optional(),
  admin_user_id: joi.string().uuid().required(),
  ip_address: joi.string().allow("", null).optional(),
  user_agent: joi.string().allow("", null).optional(),
});

const updateSystemSettingsParamType = joi.object({
  platform_name: joi.string().optional(),
  support_email: joi.string().email().optional(),
  maintenance_mode: joi.boolean().optional(),
  max_upload_size_mb: joi.number().optional(),
  allow_employer_registration: joi.boolean().optional(),
  employer_verification_grace_days: joi.number().integer().min(1).max(90).optional(),
  employer_verification_auto_block: joi.boolean().optional(),
});

// Lookup ids: serial (number) untuk tabel master biasa, UUID untuk skills & job_tags
const lookupIdType = joi.alternatives().try(joi.number(), joi.string().guid());

const insertLookupTableParamType = joi.object({
  table: joi.string().required(),
  name: joi.string().required(),
  iso_alpha2: joi.string().length(2).uppercase().optional().allow(""),
  iso_alpha3: joi.string().length(3).uppercase().optional().allow("")
});

const updateLookupTableParamType = joi.object({
  table: joi.string().required(),
  id: lookupIdType.required(),
  name: joi.string().required()
});

const deleteLookupTableParamType = joi.object({
  table: joi.string().required(),
  id: lookupIdType.required()
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
  date_of_birth: joi.date().iso().optional(),
  nationality_id: joi.number().optional(),
  religion_id: joi.number().optional(),
  marriage_status_id: joi.number().optional()
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
  company_website: joi.string().allow("").optional(),
  address: joi.string().allow("").optional(),
  description: joi.string().allow("").optional(),
  employee_count: joi.string().max(50).allow("").optional(),
  instagram_url: joi.string().allow("").optional(),
  tiktok_url: joi.string().allow("").optional(),
  is_vip: joi.boolean().optional(),
  is_verified: joi.boolean().optional(),
  industry_id: joi.number().optional(),
  // kompatibilitas payload lama (dipetakan di domain)
  website: joi.string().allow("").optional(),
  company_address: joi.string().allow("").optional(),
  company_description: joi.string().allow("").optional()
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

const insertProvinceParamType = joi.object({
  name: joi.string().max(100).required()
});

const updateProvinceParamType = joi.object({
  id: joi.number().required(),
  name: joi.string().max(100).required()
});

const deleteProvinceParamType = joi.object({
  id: joi.number().required()
});

const insertCityParamType = joi.object({
  name: joi.string().max(100).required(),
  province_id: joi.number().required()
});

const updateCityParamType = joi.object({
  id: joi.number().required(),
  name: joi.string().max(100).optional(),
  province_id: joi.number().optional()
});

const deleteCityParamType = joi.object({
  id: joi.number().required()
});

const updatePaymentOrderStatusParamType = joi.object({
  id: joi.string().guid().required(),
  status: joi.string().valid("pending", "paid", "expired", "failed").required(),
  admin_user_id: joi.string().guid().required(),
  ip_address: joi.string().allow("", null).optional(),
  user_agent: joi.string().allow("", null).optional()
});

const planTypeParam = joi.string().valid("subscription", "single_post", "boost");

const insertPlanParamType = joi.object({
  type: planTypeParam.required(),
  name: joi.string().max(50).required(),
  display_name: joi.string().max(100).required(),
  price_idr: joi.number().min(0).required(),
  duration_days: joi.number().min(1).required(),
  is_active: joi.boolean().default(true),
  max_active_posts: joi.number().min(1).when("type", { is: "subscription", then: joi.required(), otherwise: joi.forbidden() }),
  is_hot: joi.boolean().when("type", { is: "single_post", then: joi.required(), otherwise: joi.forbidden() }),
  boost_priority: joi.number().min(1).when("type", { is: "boost", then: joi.required(), otherwise: joi.forbidden() })
});

const updatePlanParamType = joi.object({
  type: planTypeParam.required(),
  id: joi.number().required(),
  name: joi.string().max(50).optional(),
  display_name: joi.string().max(100).optional(),
  price_idr: joi.number().min(0).optional(),
  duration_days: joi.number().min(1).optional(),
  is_active: joi.boolean().optional(),
  max_active_posts: joi.number().min(1).when("type", { is: "subscription", then: joi.optional(), otherwise: joi.forbidden() }),
  is_hot: joi.boolean().when("type", { is: "single_post", then: joi.optional(), otherwise: joi.forbidden() }),
  boost_priority: joi.number().min(1).when("type", { is: "boost", then: joi.optional(), otherwise: joi.forbidden() })
});

const deletePlanParamType = joi.object({
  type: planTypeParam.required(),
  id: joi.number().required()
});

const updateApplicationParamType = joi.object({
  id: joi.string().guid().required(),
  status_name: joi.string().required()
});

const deleteApplicationParamType = joi.object({
  id: joi.string().guid().required(),
  hard_delete: joi.boolean().default(false)
});

// ==================== WORKER SUB-RESOURCES ====================
// Field per resource (payload sama dengan endpoint worker masing-masing)
const workerSubResourceFields = {
  work_experiences: {
    company_name: joi.string().max(150),
    job_title: joi.string().max(100),
    start_date: joi.string(),
    end_date: joi.string().allow(null),
    is_current: joi.boolean(),
    description: joi.string().allow("", null)
  },
  educations: {
    institution_name: joi.string().max(150),
    degree: joi.string().max(100),
    major: joi.string().max(100).allow("", null),
    start_date: joi.string(),
    end_date: joi.string().allow(null),
    is_current: joi.boolean(),
    description: joi.string().allow("", null)
  },
  certifications: {
    name: joi.string().max(150),
    issuer: joi.string().max(150),
    link: joi.string().allow("", null),
    credential_id: joi.string().max(100).allow("", null),
    issue_date: joi.string(),
    expiry_date: joi.string().allow(null),
    is_active: joi.boolean()
  },
  portfolios: {
    title: joi.string().max(150),
    link: joi.string().max(500),
    description: joi.string().allow("", null),
    is_public: joi.boolean()
  }
};

const buildSubResourceSchema = (fields, extraKeys) => joi.object({
  resource: joi.string().valid(...Object.keys(workerSubResourceFields)).required(),
  worker_id: joi.string().guid().required(),
  ...extraKeys,
  ...fields
});

// Gabungan semua field resource sebagai optional; validasi kolom relevan dilakukan
// oleh config WORKER_SUBRESOURCES di domain (kolom tak relevan diabaikan).
const allSubResourceFields = Object.assign({}, ...Object.values(workerSubResourceFields).map(fields =>
  Object.fromEntries(Object.entries(fields).map(([key, schema]) => [key, schema.optional()]))
));

const insertWorkerSubResourceParamType = buildSubResourceSchema(allSubResourceFields, {});

const updateWorkerSubResourceParamType = buildSubResourceSchema(allSubResourceFields, {
  id: joi.string().guid().required()
});

const deleteWorkerSubResourceParamType = joi.object({
  resource: joi.string().valid(...Object.keys(workerSubResourceFields)).required(),
  worker_id: joi.string().guid().required(),
  id: joi.string().guid().required()
});

const insertWorkerLanguageParamType = joi.object({
  worker_id: joi.string().guid().required(),
  language_name: joi.string().max(100).required(),
  proficiency_level_id: joi.number().required(),
  is_primary: joi.boolean().default(false)
});

const updateWorkerLanguageParamType = joi.object({
  worker_id: joi.string().guid().required(),
  id: joi.string().guid().required(),
  language_name: joi.string().max(100).optional(),
  proficiency_level_id: joi.number().optional(),
  is_primary: joi.boolean().optional()
});

const deleteWorkerLanguageParamType = joi.object({
  worker_id: joi.string().guid().required(),
  id: joi.string().guid().required()
});

const updateWorkerResumeParamType = joi.object({
  worker_id: joi.string().guid().required(),
  id: joi.string().guid().required(),
  title: joi.string().max(150).optional(),
  is_default: joi.boolean().optional()
});

const deleteWorkerResumeParamType = joi.object({
  worker_id: joi.string().guid().required(),
  id: joi.string().guid().required()
});

const insertWorkerSkillParamType = joi.object({
  worker_id: joi.string().guid().required(),
  skill_id: joi.string().guid().required()
});

const deleteWorkerSkillParamType = joi.object({
  worker_id: joi.string().guid().required(),
  skill_id: joi.string().guid().required()
});

const updateWorkerApplicationParamType = joi.object({
  worker_id: joi.string().guid().required(),
  id: joi.string().guid().required(),
  application_status_id: joi.number().optional(),
  cover_letter: joi.string().allow("", null).optional()
});

const deleteWorkerApplicationParamType = joi.object({
  worker_id: joi.string().guid().required(),
  id: joi.string().guid().required()
});

const updateWorkerJobPostAnswerParamType = joi.object({
  worker_id: joi.string().guid().required(),
  id: joi.string().guid().required(),
  answer: joi.alternatives().try(joi.string(), joi.object(), joi.array(), joi.number(), joi.boolean()).required()
});

const deleteWorkerJobPostAnswerParamType = joi.object({
  worker_id: joi.string().guid().required(),
  id: joi.string().guid().required()
});

const deleteWorkerSavedJobParamType = joi.object({
  worker_id: joi.string().guid().required(),
  id: joi.string().guid().required()
});

// ==================== EMPLOYER SUB-RESOURCES ====================
const deleteEmployerJobPostParamType = joi.object({
  employer_id: joi.string().guid().required(),
  id: joi.string().guid().required()
});

const updateEmployerSubscriptionParamType = joi.object({
  employer_id: joi.string().guid().required(),
  id: joi.string().guid().required(),
  expires_at: joi.date().iso().optional(),
  is_active: joi.boolean().optional()
});

const deleteEmployerSubscriptionParamType = joi.object({
  employer_id: joi.string().guid().required(),
  id: joi.string().guid().required()
});

// ==================== CHAT MODERATION ====================
const deleteConversationMessageParamType = joi.object({
  conversation_id: joi.string().guid().required(),
  message_id: joi.string().guid().required(),
  admin_user_id: joi.string().guid().required(),
  ip_address: joi.string().allow("", null).optional(),
  user_agent: joi.string().allow("", null).optional()
});

const bulkDeleteConversationMessagesParamType = joi.object({
  conversation_id: joi.string().guid().required(),
  // empty / omitted = purge all messages in the conversation
  message_ids: joi.array().items(joi.string().guid()).optional(),
  admin_user_id: joi.string().guid().required(),
  ip_address: joi.string().allow("", null).optional(),
  user_agent: joi.string().allow("", null).optional(),
});

const updateConversationStatusParamType = joi.object({
  id: joi.string().guid().required(),
  status: joi.string().valid("ACTIVE", "ARCHIVED").required(),
  reason: joi.string().max(1000).allow("", null).optional(),
  admin_user_id: joi.string().guid().required(),
  ip_address: joi.string().allow("", null).optional(),
  user_agent: joi.string().allow("", null).optional(),
});

module.exports = {
  updateUserStatusParamType,
  verifyEmployerParamType,
  updateJobStatusParamType,
  resolveFraudEventParamType,
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
  deleteApplicationParamType,
  insertProvinceParamType,
  updateProvinceParamType,
  deleteProvinceParamType,
  insertCityParamType,
  updateCityParamType,
  deleteCityParamType,
  insertPlanParamType,
  updatePlanParamType,
  deletePlanParamType,
  updatePaymentOrderStatusParamType,
  insertWorkerSubResourceParamType,
  updateWorkerSubResourceParamType,
  deleteWorkerSubResourceParamType,
  insertWorkerLanguageParamType,
  updateWorkerLanguageParamType,
  deleteWorkerLanguageParamType,
  updateWorkerResumeParamType,
  deleteWorkerResumeParamType,
  insertWorkerSkillParamType,
  deleteWorkerSkillParamType,
  updateWorkerApplicationParamType,
  deleteWorkerApplicationParamType,
  updateWorkerJobPostAnswerParamType,
  deleteWorkerJobPostAnswerParamType,
  deleteWorkerSavedJobParamType,
  deleteEmployerJobPostParamType,
  updateEmployerSubscriptionParamType,
  deleteEmployerSubscriptionParamType,
  deleteConversationMessageParamType,
  bulkDeleteConversationMessagesParamType,
  updateConversationStatusParamType,
};
