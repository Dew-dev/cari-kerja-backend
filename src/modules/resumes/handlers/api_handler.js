const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const {
  sendResponse,
  paginationResponse,
} = require("../../../helpers/utils/response");
const wrapper = require("../../../helpers/utils/wrapper");
const { InternalServerError } = require("../../../helpers/errors");
const objectStorage = require("../../../helpers/storage/object_storage");

const withResolvedResumeUrl = async (resume) => {
  if (!resume) return resume;
  const url = await objectStorage.resolveUrl(resume.resume_url, {
    signed: true,
    expiresInSeconds: 60 * 60,
  });
  return { ...resume, resume_url: url, resume_storage_ref: resume.resume_url };
};

// query
const getResume = async (req, res) => {
  const payload = { ...req.params, worker_id: req.userMeta.worker_id };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getResumeType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getResume(validatePayload.data);
  if (!result.err && result.data) {
    result.data = await withResolvedResumeUrl(result.data);
  }
  return sendResponse(result, res);
};

const getAllResumes = async (req, res) => {
  const payload = {
    worker_id: req.userMeta.worker_id,
    ...req.query,
    ...req.params,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getAllResumesType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getAllResumes(validatePayload.data);
  if (!result.err && Array.isArray(result.data)) {
    result.data = await Promise.all(result.data.map(withResolvedResumeUrl));
  }
  return paginationResponse(result, res);
};

/**
 * Dedicated signed-URL endpoint for sensitive CV documents (anti-scraping / no public CDN).
 * GET /api/v1/workers/resumes/:id/signed-url
 */
const getResumeSignedUrl = async (req, res) => {
  const payload = { ...req.params, worker_id: req.userMeta.worker_id };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getResumeType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getResume(validatePayload.data);
  if (result.err) return sendResponse(result, res);

  const stored = result.data?.resume_url;
  const url = await objectStorage.resolveUrl(stored, {
    signed: true,
    expiresInSeconds: 15 * 60,
  });
  if (!url) {
    return sendResponse(
      wrapper.error(new InternalServerError("Failed to resolve resume URL")),
      res
    );
  }
  return sendResponse(
    wrapper.data({
      url,
      expires_in: 15 * 60,
      resume_id: result.data.id,
    }),
    res
  );
};

// command
const addResume = async (req, res) => {
  const payload = { worker_id: req.userMeta.worker_id, ...req.body };
  if (req.file) {
    try {
      payload.resume_url = await objectStorage.persistUploadedFile(req.file, {
        folder: "resumes",
      });
    } catch (err) {
      return sendResponse(
        wrapper.error(new InternalServerError(err.message || "Upload failed")),
        res
      );
    }
  }
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.addResumeType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.addResume(validatePayload.data);
  if (!result.err && result.data) {
    result.data = await withResolvedResumeUrl(result.data);
  }
  return sendResponse(result, res);
};

const updateResume = async (req, res) => {
  const payload = {
    id: req.params.id,
    worker_id: req.userMeta.worker_id,
    ...req.body,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateResumeType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateResume(validatePayload.data);
  return sendResponse(result, res);
};

const deleteResume = async (req, res) => {
  const payload = {
    id: req.params.id,
    worker_id: req.userMeta.worker_id,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.deleteResumeType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const existing = await queryHandler.getResume(validatePayload.data);
  const result = await commandHandler.deleteResume(validatePayload.data);
  if (!result.err && existing?.data?.resume_url) {
    await objectStorage.deleteStored(existing.data.resume_url);
  }
  return sendResponse(result, res);
};

module.exports = {
  getResume,
  getAllResumes,
  getResumeSignedUrl,
  addResume,
  updateResume,
  deleteResume,
};
