const commandHandler = require("../repositories/commands/command_handler");
const queryHandler = require("../repositories/queries/query_handler");
const validator = require("../../../helpers/utils/validator");
const {
  sendResponse,
  paginationResponse,
} = require("../../../helpers/utils/response");

const createContactMessage = async (req, res) => {
  const payload = req.body;
  
  // Basic validation
  if (!payload.name || !payload.email || !payload.subject || !payload.message) {
    return sendResponse({
      err: true,
      statusCode: 400,
      message: "name, email, subject, dan message wajib diisi",
    }, res);
  }

  const result = await commandHandler.createContactMessage(payload);
  return sendResponse(result, res, 201);
};

const getContactMessages = async (req, res) => {
  const payload = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    search: req.query.search || null,
  };

  const result = await queryHandler.getContactMessages(payload);
  return paginationResponse(result, res);
};

const getContactMessageById = async (req, res) => {
  const payload = {
    id: req.params.id,
  };

  if (!payload.id) {
    return sendResponse({
      err: true,
      statusCode: 400,
      message: "id wajib diisi",
    }, res);
  }

  const result = await queryHandler.getContactMessageById(payload);
  return sendResponse(result, res);
};

const deleteContactMessage = async (req, res) => {
  const payload = {
    id: req.params.id,
  };

  if (!payload.id) {
    return sendResponse({
      err: true,
      statusCode: 400,
      message: "id wajib diisi",
    }, res);
  }

  const result = await commandHandler.deleteContactMessage(payload);
  return sendResponse(result, res);
};

module.exports = {
  createContactMessage,
  getContactMessages,
  getContactMessageById,
  deleteContactMessage,
};
