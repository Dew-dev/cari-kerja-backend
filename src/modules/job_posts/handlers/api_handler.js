const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const logger = require("../../../helpers/utils/logger");
const wrapper = require("../../../helpers/utils/wrapper");
const { InternalServerError } = require("../../../helpers/errors");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const {
  sendResponse,
  paginationResponse,
} = require("../../../helpers/utils/response");

const getJobpostsByRecruiterId = async (req, res) => {
  const { recruiter_id } = req.params;
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
  let payload = { recruiter_id, sort_by, sort_order, limit, page };
  const conditions = ["j.recruiter_id = $1"]; // $1 is recruiterId
  const values = [recruiter_id];
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
  addCondition("j.created_at >= ?", created_after);
  addCondition("j.created_at <= ?", created_before);

  payload = { ...payload, conditions, values, idx };

  const sortableColumns = {
    title: "j.title",
    location: "j.location",
    salary_min: "j.salary_min",
    salary_max: "j.salary_max",
    created_at: "j.created_at",
  };

  const orderColumn = sortableColumns[sort_by] || sortableColumns.created_at;
  const orderDirection = sort_order.toLowerCase() === "asc" ? "ASC" : "DESC";

  payload = { ...payload, orderColumn, orderDirection };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getJobpostsByRecruiterIdParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getJobpostsByRecruiterId(
    validatePayload.data
  );
  return paginationResponse(result, res);
};

const getJobpostById = async (req, res) => {
  const payload = req.params;
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getJobpostByIdParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getJobpostById(validatePayload.data);
  return sendResponse(result, res);
};

const createJobPost = async (req, res) => {
  const payload = { ...req.body, recruiter_id: req.userMeta.recruiter_id };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.createJobPostParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.createJobPost(validatePayload.data);
  return sendResponse(result, res, 201);
};

const createJobPostQuestions = async (req, res) => {
  const payload = req.body;
  const { id } = req.params;
  // return payload;
  const result = await commandHandler.createJobPostQuestions(payload, id);
  return sendResponse(result, res, 201);
};

const updateJobPostQuestions = async (req, res) => {
  const payload = req.body;
  const { question_id } = req.params;
  // return payload;
  const result = await commandHandler.updateJobPostQuestion(
    payload,
    question_id
  );
  return sendResponse(result, res, 201);
};

const getJobpostQuestions = async (req, res) => {
  try {
    // Ambil query params & job_post_id (bisa dari route atau query)
    const payload = {
      ...req.query,
      job_post_id: req.params.id || req.query.job_post_id,
    };

    // Validasi input menggunakan Joi schema
    const validatePayload = validator.isValidPayload(
      payload,
      queryModel.getJobpostQuestionsParamType
    );
    if (validatePayload.err) {
      return sendResponse(validatePayload, res);
    }

    // Jalankan handler utama
    const result = await queryHandler.getJobpostQuestions(
      validatePayload.data,
      req.ctx
    );

    // Kirimkan hasil dalam format pagination
    return paginationResponse(result, res);
  } catch (err) {
    logger.error(
      req.ctx,
      "getJobpostQuestions",
      "Error get jobpost questions",
      err
    );
    return sendResponse(
      wrapper.error(new InternalServerError(err.message)),
      res
    );
  }
};

const getJobposts = async (req, res) => {
  let payload = { ...req.query };

  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getJobpostsParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getJobposts(validatePayload.data);
  return paginationResponse(result, res);
};

const getJobpostsSelf = async (req, res) => {
  const payload = { ...req.query, recruiter_id: req.userMeta.recruiter_id };
  console.log(payload);

  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getJobpostsSelfParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getJobpostsSelf(validatePayload.data);
  return paginationResponse(result, res);
};

const createJobPostAnswers = async (req, res) => {
  const payload = req.body;
  const { job_post_id } = req.params;
  // return payload;
  const result = await commandHandler.createJobPostAnswers(
    payload,
    job_post_id
  );
  return sendResponse(result, res, 201);
};

const createJobApplication = async (req, res) => {
  // gabungkan worker_id dari token/userMeta
  const payload = {
    worker_id: req.userMeta.worker_id,
    job_post_id: req.params.job_post_id,
    ...req.body,
  };

  // validasi payload sesuai Joi schema
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.createJobApplicationParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  // eksekusi command
  const result = await commandHandler.createJobApplication(
    validatePayload.data
  );
  return sendResponse(result, res);
};

const getCurrencyByCode = async (req, res) => {
  const payload = req.params;

  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getOneCurrencyParamType // joi schema untuk currency
  );

  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await queryHandler.getCurrencyByCode(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getJobpostsByRecruiterId,
  getJobpostById,
  createJobPost,
  createJobPostQuestions,
  updateJobPostQuestions,
  getJobposts,
  getJobpostsSelf,
  getJobpostQuestions,
  createJobPostAnswers,
  createJobApplication,
  getCurrencyByCode,
};
