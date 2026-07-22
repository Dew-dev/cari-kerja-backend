const joi = require("joi");
const { ALL_DOC_TYPES } = require("../../../../helpers/fraud/employer_verification_docs");

const upsertDraftParamType = joi.object({
  user_id: joi.string().uuid().required(),
  company_legal_name: joi.string().max(255).required(),
  npwp_number: joi.string().max(64).required(),
  nib_number: joi.string().max(64).required(),
  applicant_notes: joi.string().max(2000).allow("", null).optional(),
});

const uploadDocumentParamType = joi.object({
  user_id: joi.string().uuid().required(),
  doc_type: joi
    .string()
    .valid(...ALL_DOC_TYPES)
    .required(),
  file_url: joi.string().required(),
  file_name: joi.string().max(255).allow("", null).optional(),
  mime_type: joi.string().max(128).allow("", null).optional(),
});

const deleteDocumentParamType = joi.object({
  user_id: joi.string().uuid().required(),
  doc_type: joi
    .string()
    .valid(...ALL_DOC_TYPES)
    .required(),
});

const submitApplicationParamType = joi.object({
  user_id: joi.string().uuid().required(),
});

const requestReactivationParamType = joi.object({
  user_id: joi.string().uuid().required(),
  reason: joi.string().max(1000).allow("", null).optional(),
});

const reviewApplicationParamType = joi.object({
  id: joi.string().uuid().required(),
  action: joi.string().valid("approve", "reject").required(),
  admin_note: joi.string().max(2000).allow("", null).optional(),
  rejection_reason: joi.string().max(2000).allow("", null).optional(),
  reviewed_by: joi.string().uuid().required(),
});

const markUnderReviewParamType = joi.object({
  id: joi.string().uuid().required(),
  reviewed_by: joi.string().uuid().required(),
});

module.exports = {
  upsertDraftParamType,
  uploadDocumentParamType,
  deleteDocumentParamType,
  submitApplicationParamType,
  requestReactivationParamType,
  reviewApplicationParamType,
  markUnderReviewParamType,
};
