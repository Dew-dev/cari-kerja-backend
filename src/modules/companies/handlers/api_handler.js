const queryHandler = require("../repositories/queries/query_handler");
const commandHandler = require("../repositories/commands/command_handler");
const queryModel = require("../repositories/queries/query_model");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const wrapper = require("../../../helpers/utils/wrapper");
const { InternalServerError } = require("../../../helpers/errors");
const { sendResponse, paginationResponse } = require("../../../helpers/utils/response");
const objectStorage = require("../../../helpers/storage/object_storage");

const resolveAvatarUpload = async (file, folder) => {
  if (!file) return null;
  const stored = await objectStorage.persistUploadedFile(file, { folder });
  if (objectStorage.isObjectStored(stored) && objectStorage.hasPublicBaseUrl()) {
    return objectStorage.resolveUrl(stored, { signed: false });
  }
  return stored;
};

const getMyCompany = async (req, res) => {
  const result = await queryHandler.getMyCompany(req.userMeta);
  return sendResponse(result, res);
};

const getCompanyById = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    req.params,
    queryModel.getCompanyByIdParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.getCompanyById(validatePayload.data);
  return sendResponse(result, res);
};

const listCompanies = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    { ...req.query },
    queryModel.listCompaniesParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.listCompanies(validatePayload.data);
  return paginationResponse(result, res);
};

const updateMyCompany = async (req, res) => {
  const body = { ...req.body };
  if (req.file) {
    try {
      body.avatar_url = await resolveAvatarUpload(req.file, "avatars/company");
    } catch (err) {
      return sendResponse(
        wrapper.error(new InternalServerError(err.message || "Logo upload failed")),
        res
      );
    }
  }
  const validatePayload = validator.isValidPayload(
    body,
    commandModel.updateCompanyParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.updateMyCompany(
    validatePayload.data,
    req.userMeta
  );
  return sendResponse(result, res);
};

const getMyRecruiterProfile = async (req, res) => {
  const result = await queryHandler.getMyRecruiterProfile(req.userMeta);
  return sendResponse(result, res);
};

const updatePersonalProfile = async (req, res) => {
  const body = { ...req.body };
  if (req.file) {
    try {
      body.avatar_url = await resolveAvatarUpload(req.file, "avatars/recruiter");
    } catch (err) {
      return sendResponse(
        wrapper.error(new InternalServerError(err.message || "Avatar upload failed")),
        res
      );
    }
  }
  const validatePayload = validator.isValidPayload(
    body,
    commandModel.updatePersonalProfileParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.updatePersonalProfile(
    validatePayload.data,
    req.userMeta
  );
  return sendResponse(result, res);
};

const listMembers = async (req, res) => {
  const result = await queryHandler.listMembers(req.userMeta);
  return sendResponse(result, res);
};

const updateMemberRole = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    { ...req.params, ...req.body },
    commandModel.updateMemberRoleParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.updateMemberRole(
    validatePayload.data,
    req.userMeta
  );
  return sendResponse(result, res);
};

const removeMember = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    req.params,
    commandModel.removeMemberParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.removeMember(
    validatePayload.data,
    req.userMeta
  );
  return sendResponse(result, res);
};

const leaveCompany = async (req, res) => {
  const result = await commandHandler.leaveCompany(req.userMeta);
  return sendResponse(result, res);
};

const transferOwnership = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    req.body,
    commandModel.transferOwnershipParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.transferOwnership(
    validatePayload.data,
    req.userMeta
  );
  return sendResponse(result, res);
};

const listInvitations = async (req, res) => {
  const result = await queryHandler.listInvitations(req.userMeta);
  return sendResponse(result, res);
};

const createInvitation = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    req.body,
    commandModel.createInvitationParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.createInvitation(
    validatePayload.data,
    req.userMeta
  );
  return sendResponse(result, res);
};

const resendInvitation = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    req.params,
    commandModel.invitationIdParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.resendInvitation(
    validatePayload.data,
    req.userMeta
  );
  return sendResponse(result, res);
};

const revokeInvitation = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    req.params,
    commandModel.invitationIdParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.revokeInvitation(
    validatePayload.data,
    req.userMeta
  );
  return sendResponse(result, res);
};

const previewInvitation = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    req.query,
    commandModel.previewInvitationParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.previewInvitation(validatePayload.data);
  return sendResponse(result, res);
};

const acceptInvitation = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    req.body,
    commandModel.acceptInvitationParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.acceptInvitation(
    validatePayload.data,
    req.userMeta
  );
  return sendResponse(result, res);
};

module.exports = {
  getMyCompany,
  getCompanyById,
  listCompanies,
  updateMyCompany,
  getMyRecruiterProfile,
  updatePersonalProfile,
  listMembers,
  updateMemberRole,
  removeMember,
  leaveCompany,
  transferOwnership,
  listInvitations,
  createInvitation,
  resendInvitation,
  revokeInvitation,
  previewInvitation,
  acceptInvitation,
};
