const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const logger = require("../../../helpers/utils/logger");
const wrapper = require("../../../helpers/utils/wrapper");
const xenditHelper = require("../../../helpers/xendit/xendit_helper");
const { ForbiddenError } = require("../../../helpers/errors");
const {
  sendResponse,
  paginationResponse,
} = require("../../../helpers/utils/response");

const ctx = "Payments-API-Handler";
const WORKER_ROLE_ID = 1;
const RECRUITER_ROLE_ID = 2;
const SUPER_ADMIN_ROLE_ID = 3;

const assertRecruiterAccess = (req, res) => {
  const roleId = req.userMeta?.role_id;
  if (roleId !== RECRUITER_ROLE_ID && roleId !== SUPER_ADMIN_ROLE_ID) {
    sendResponse(
      wrapper.error(new ForbiddenError("Only recruiters can access payment features")),
      res
    );
    return false;
  }
  return true;
};

const getAllPlans = async (req, res) => {
  const payload = { type: req.query.type };
  const validatePayload = validator.isValidPayload(payload, queryModel.getPlansParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getAllPlans(validatePayload.data);
  return sendResponse(result, res);
};

const createInvoice = async (req, res) => {
  if (!assertRecruiterAccess(req, res)) {
    return;
  }

  const payload = {
    ...req.body,
    recruiter_id: req.userMeta.recruiter_id,
    user_email: req.userMeta.email,
  };

  const validatePayload = validator.isValidPayload(payload, commandModel.createInvoiceParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await commandHandler.createInvoice(validatePayload.data);
  return sendResponse(result, res, 201);
};

const getPaymentOrders = async (req, res) => {
  if (!assertRecruiterAccess(req, res)) {
    return;
  }

  const payload = {
    ...req.query,
    recruiter_id: req.userMeta.recruiter_id,
  };

  const validatePayload = validator.isValidPayload(payload, queryModel.getPaymentOrdersParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await queryHandler.getPaymentOrders(validatePayload.data);
  return paginationResponse(result, res);
};

const getOrderDetail = async (req, res) => {
  if (!assertRecruiterAccess(req, res)) {
    return;
  }

  const payload = {
    id: req.params.id,
    recruiter_id: req.userMeta.recruiter_id,
  };

  const validatePayload = validator.isValidPayload(payload, queryModel.getOrderDetailParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await queryHandler.getOrderDetail(validatePayload.data);
  return sendResponse(result, res);
};

const getActivePlan = async (req, res) => {
  if (!assertRecruiterAccess(req, res)) {
    return;
  }

  const payload = { recruiter_id: req.userMeta.recruiter_id };

  const validatePayload = validator.isValidPayload(payload, queryModel.getActivePlanParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await queryHandler.getActivePlan(validatePayload.data);
  return sendResponse(result, res);
};

const handleXenditWebhook = async (req, res) => {
  const callbackToken = req.headers["x-callback-token"];
  if (!xenditHelper.verifyWebhookToken(callbackToken)) {
    logger.error(ctx, "handleXenditWebhook", "Invalid webhook token", callbackToken);
    return res.status(401).send({
      success: false,
      message: "Invalid webhook token",
      code: 401,
    });
  }

  const payload = req.body;
  const validatePayload = validator.isValidPayload(payload, commandModel.xenditWebhookParamType);
  if (validatePayload.err) {
    return res.status(400).send({
      success: false,
      message: validatePayload.err.message,
      code: 400,
    });
  }

  const result = await commandHandler.handleXenditWebhook(validatePayload.data);

  if (result.err) {
    logger.error(ctx, "handleXenditWebhook", "Webhook processing error", result.err);
    return res.status(200).send({
      success: false,
      message: result.err.message,
      code: 200,
    });
  }

  return res.status(200).send({
    success: true,
    data: result.data,
    message: "Webhook processed successfully",
    code: 200,
  });
};

const applySinglePostToJob = async (req, res) => {
  if (!assertRecruiterAccess(req, res)) {
    return;
  }

  const payload = {
    ...req.body,
    recruiter_id: req.userMeta.recruiter_id,
  };

  const validatePayload = validator.isValidPayload(payload, commandModel.applySinglePostParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }

  const result = await commandHandler.applySinglePostToJob(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getAllPlans,
  createInvoice,
  getPaymentOrders,
  getOrderDetail,
  getActivePlan,
  handleXenditWebhook,
  applySinglePostToJob,
};
