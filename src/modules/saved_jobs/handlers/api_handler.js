const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const logger = require("../../../helpers/utils/logger");
const wrapper = require("../../../helpers/utils/wrapper");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const {
  sendResponse,
  paginationResponse,
} = require("../../../helpers/utils/response");

const getSavedJobsByWorkerId = async (req, res) => {
  const { worker_id } = req.params;
  const {
    status,
    employment_type,
    experience_level,
    salary_type,
    location,
    salary_min,
    salary_max,
    currency,
    created_after,
    created_before,
    sort_by = "created_at",
    sort_order = "desc",
    limit = 10,
    page = 1,
  } = req.query;
  let payload = { worker_id, sort_by, sort_order, limit, page };
  const conditions = ["sj.worker_id = $1"]; // $1 is workerId
  const values = [worker_id];
  let idx = 2; // parameter index tracker

  const addCondition = (cond, val) => {
    if (val !== undefined && val !== null && val !== "") {
      conditions.push(cond.replace("?", `$${idx}`));
      values.push(val);
      payload = { ...payload, val };
      idx += 1;
    }
  };

  // Optional filters – note: we compare to the column name used in the SELECT query
  addCondition("jps.name = ?", status);
  addCondition("et.name = ?", employment_type);
  addCondition("el.name = ?", experience_level);
  addCondition("st.name = ?", salary_type);
  addCondition("j.location ILIKE ?", location ? `%${location}%` : null);
  addCondition("j.salary_min >= ?", salary_min);
  addCondition("j.salary_max <= ?", salary_max);
  addCondition("c.name = ?", currency);
  addCondition("sj.created_at >= ?", created_after);
  addCondition("sj.created_at <= ?", created_before);

  payload = { ...payload, conditions, values, idx };

  const sortableColumns = {
    title: "j.title",
    location: "j.location",
    salary_min: "j.salary_min",
    salary_max: "j.salary_max",
    created_at: "sj.created_at",
  };

  const orderColumn = sortableColumns[sort_by] || sortableColumns.created_at;
  const orderDirection = sort_order.toLowerCase() === "asc" ? "ASC" : "DESC";

  payload = { ...payload, orderColumn, orderDirection };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getSavedJobsByWorkerIdParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getSavedJobsByWorkerId(
    validatePayload.data
  );
  return paginationResponse(result, res);
};

const getSavedJobsById = async (req, res) => {
  const payload = req.params;
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getSavedJobsByIdParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getSavedJobsById(validatePayload.data);
  return sendResponse(result, res);
};

const getSavedJobs = async (req, res) => {
  let payload = { ...req.query };

  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getSavedJobsParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getSavedJobs(validatePayload.data);
  return paginationResponse(result, res);
};

const getSavedJobsSelf = async (req, res) => {
  const payload = { ...req.query, worker_id: req.userMeta.worker_id };
  //console.log(payload);

  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getSavedJobsSelfParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getSavedJobsSelf(validatePayload.data);
  return paginationResponse(result, res);
};

const createSavedJob = async (req, res) => {
  const payload = { ...req.params, worker_id: req.userMeta.worker_id };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.createSavedJobParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.createSavedJob(validatePayload.data);
  return sendResponse(result, res, 201);
};

const deleteJobPost = async (req, res) => {
  const payload = { ...req.params };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.deleteSavedJobParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteSavedJob(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getSavedJobsByWorkerId,
  getSavedJobsById,
  getSavedJobs,
  getSavedJobsSelf,
  createSavedJob,
  deleteJobPost,
};
