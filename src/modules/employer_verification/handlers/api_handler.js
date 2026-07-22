const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");
const { ForbiddenError, BadRequestError } = require("../../../helpers/errors");
const wrapper = require("../../../helpers/utils/wrapper");

const assertRecruiter = (req) => {
  if (Number(req.userMeta?.role_id) !== 2) {
    return wrapper.error(
      new ForbiddenError("Only recruiters can access employer verification")
    );
  }
  return null;
};

const getStatus = async (req, res) => {
  const denied = assertRecruiter(req);
  if (denied) return sendResponse(denied, res);

  const payload = {
    user_id: req.userMeta.id,
    role_id: req.userMeta.role_id,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getStatusParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await queryHandler.getStatus(validatePayload.data);
  return sendResponse(result, res);
};

const getDocTypes = async (req, res) => {
  const result = await queryHandler.getDocTypes();
  return sendResponse(result, res);
};

const upsertDraft = async (req, res) => {
  const denied = assertRecruiter(req);
  if (denied) return sendResponse(denied, res);

  const payload = {
    user_id: req.userMeta.id,
    ...req.body,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.upsertDraftParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.upsertDraft(validatePayload.data);
  return sendResponse(result, res);
};

const uploadDocument = async (req, res) => {
  const denied = assertRecruiter(req);
  if (denied) return sendResponse(denied, res);

  if (!req.file) {
    return sendResponse(
      wrapper.error(new BadRequestError("File is required (field: document)")),
      res
    );
  }

  const payload = {
    user_id: req.userMeta.id,
    doc_type: req.body.doc_type,
    file_url: `/uploads/employer-verification/${req.file.filename}`,
    file_name: req.file.originalname,
    mime_type: req.file.mimetype,
  };

  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.uploadDocumentParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.uploadDocument(validatePayload.data);
  return sendResponse(result, res, 201);
};

const deleteDocument = async (req, res) => {
  const denied = assertRecruiter(req);
  if (denied) return sendResponse(denied, res);

  const payload = {
    user_id: req.userMeta.id,
    doc_type: req.params.doc_type,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.deleteDocumentParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.deleteDocument(validatePayload.data);
  return sendResponse(result, res);
};

const submitApplication = async (req, res) => {
  const denied = assertRecruiter(req);
  if (denied) return sendResponse(denied, res);

  const payload = { user_id: req.userMeta.id };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.submitApplicationParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.submitApplication(validatePayload.data);
  return sendResponse(result, res);
};

const requestReactivation = async (req, res) => {
  const denied = assertRecruiter(req);
  if (denied) return sendResponse(denied, res);

  const payload = {
    user_id: req.userMeta.id,
    reason: req.body?.reason,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.requestReactivationParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);

  const result = await commandHandler.requestReactivation(validatePayload.data);
  return sendResponse(result, res, 201);
};

module.exports = {
  getStatus,
  getDocTypes,
  upsertDraft,
  uploadDocument,
  deleteDocument,
  submitApplication,
  requestReactivation,
};
