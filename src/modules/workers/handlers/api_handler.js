const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse, paginationResponse } = require("../../../helpers/utils/response");
const wrapper = require("../../../helpers/utils/wrapper");
const { ForbiddenError, InternalServerError } = require("../../../helpers/errors");
const objectStorage = require("../../../helpers/storage/object_storage");

const SUPER_ADMIN_ROLE_ID = 3;

// query
const getWorkerByUserId = async (req, res) => {
  const payload = { user_id: req.userMeta.id };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getWorkerByUserIdParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getWorkerByUserId(validatePayload.data);
  return sendResponse(result, res);
};

const getWorkerById = async (req, res) => {
  const payload = {
    id: req.params.id,
    viewer_user_id: req.userMeta?.id,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getWorkerByIdParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getWorkerById(validatePayload.data);
  return sendResponse(result, res);
};

const revealWorkerContact = async (req, res) => {
  const payload = {
    id: req.params.id,
    field: req.params.field || req.query.field || req.body?.field,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.revealWorkerContactParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.revealWorkerContact(validatePayload.data);
  return sendResponse(result, res);
};

const sanitizeWorkersQuery = (query = {}) => {
  const payload = {};
  for (const [key, value] of Object.entries(query)) {
    // Tenure filter is category_id + min_years (job_title_id is deprecated).
    if (key === "job_title_id") continue;
    if (value === "" || value === null || value === undefined) continue;
    if (typeof value === "number" && Number.isNaN(value)) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    payload[key] = value;
  }
  return payload;
};

const getWorkers = async (req, res) => {
  const payload = sanitizeWorkersQuery(req.query);
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getWorkersParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getWorkers(validatePayload.data);
  return paginationResponse(result, res);
};

// command
const updateOneWorker = async (req, res) => {
  const payload = { ...req.body, ...req.params };

  const isSuperAdmin = req.userMeta?.role_id === SUPER_ADMIN_ROLE_ID;
  if (!isSuperAdmin && req.userMeta?.id !== payload.user_id) {
    return sendResponse(
      wrapper.error(new ForbiddenError("You are not allowed to update this worker profile")),
      res
    );
  }

  // Avatar must be attached before validation so it is included in validated payload
  if (req.file) {
    try {
      const stored = await objectStorage.persistUploadedFile(req.file, {
        folder: "avatars/worker",
      });
      if (objectStorage.isObjectStored(stored) && objectStorage.hasPublicBaseUrl()) {
        payload.avatar_url = await objectStorage.resolveUrl(stored, { signed: false });
      } else {
        payload.avatar_url = stored;
      }
    } catch (err) {
      return sendResponse(
        wrapper.error(new InternalServerError(err.message || "Avatar upload failed")),
        res
      );
    }
  }

  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateWorkerParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateOneWorker(validatePayload.data);
  return sendResponse(result, res);
};

const updateSelfWorker = async (req, res) => {
  const payload = {
    ...req.body,
    id: req.userMeta.worker_id,
    user_id: req.userMeta.id,
  };
  if (req.file) {
    try {
      const stored = await objectStorage.persistUploadedFile(req.file, {
        folder: "avatars/worker",
      });
      if (objectStorage.isObjectStored(stored) && objectStorage.hasPublicBaseUrl()) {
        payload.avatar_url = await objectStorage.resolveUrl(stored, { signed: false });
      } else {
        payload.avatar_url = stored;
      }
    } catch (err) {
      return sendResponse(
        wrapper.error(new InternalServerError(err.message || "Avatar upload failed")),
        res
      );
    }
  }
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateWorkerParamType
  );

  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateOneWorker(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getWorkerByUserId,
  getWorkerById,
  revealWorkerContact,
  getWorkers,
  updateOneWorker,
  updateSelfWorker,
};
