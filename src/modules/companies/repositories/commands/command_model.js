const joi = require("joi");

const updateCompanyParamType = joi.object({
  company_name: joi.string().min(1).max(512).optional(),
  avatar_url: joi.string().uri().optional().allow("", null),
  company_website: joi.string().uri().optional().allow("", null),
  address: joi.string().optional().allow("", null),
  industry_id: joi.number().integer().optional().allow(null),
  description: joi.string().optional().allow("", null),
  employee_count: joi.string().optional().allow("", null),
  instagram_url: joi.string().optional().allow("", null),
  tiktok_url: joi.string().optional().allow("", null),
});

const updateMemberRoleParamType = joi.object({
  userId: joi.string().uuid().required(),
  role: joi.string().valid("admin", "recruiter").required(),
});

const removeMemberParamType = joi.object({
  userId: joi.string().uuid().required(),
});

const transferOwnershipParamType = joi.object({
  new_owner_user_id: joi.string().uuid().required(),
});

const createInvitationParamType = joi.object({
  email: joi
    .string()
    .email({ tlds: { allow: false } })
    .required(),
  role: joi.string().valid("admin", "recruiter").default("recruiter"),
});

const invitationIdParamType = joi.object({
  id: joi.string().uuid().required(),
});

const acceptInvitationParamType = joi.object({
  token: joi.string().min(16).required(),
});

const previewInvitationParamType = joi.object({
  token: joi.string().min(16).required(),
});

const updatePersonalProfileParamType = joi.object({
  contact_name: joi.string().min(1).max(150).optional(),
  contact_phone: joi.string().min(3).max(50).optional(),
  avatar_url: joi.string().uri().optional().allow("", null),
});

module.exports = {
  updateCompanyParamType,
  updateMemberRoleParamType,
  removeMemberParamType,
  transferOwnershipParamType,
  createInvitationParamType,
  invitationIdParamType,
  acceptInvitationParamType,
  previewInvitationParamType,
  updatePersonalProfileParamType,
};
