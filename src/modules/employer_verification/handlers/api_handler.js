const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");
const {
  ForbiddenError,
  BadRequestError,
  InternalServerError,
} = require("../../../helpers/errors");
const wrapper = require("../../../helpers/utils/wrapper");
const objectStorage = require("../../../helpers/storage/object_storage");

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

  let fileUrl;
  try {
    fileUrl = await objectStorage.persistUploadedFile(req.file, {
      folder: "employer-verification",
    });
  } catch (err) {
    return sendResponse(
      wrapper.error(
        new InternalServerError(err.message || "Document upload failed")
      ),
      res
    );
  }

  const payload = {
    user_id: req.userMeta.id,
    doc_type: req.body.doc_type,
    file_url: fileUrl,
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
  if (!result.err && result.data?.deleted_file_url) {
    await objectStorage.deleteStored(result.data.deleted_file_url);
  }
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
