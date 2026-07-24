const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const {
  sendResponse,
  paginationResponse,
} = require("../../../helpers/utils/response");
const wrapper = require("../../../helpers/utils/wrapper");
const { BadRequestError } = require("../../../helpers/errors");

const listPublicNews = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.listPublicNewsParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.listPublic(validatePayload.data);
  return paginationResponse(result, res);
};

const getPublicNews = async (req, res) => {
  const payload = { slug: req.params.slug, locale: req.query.locale };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getPublicNewsParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.getPublicBySlug(validatePayload.data);
  return sendResponse(result, res);
};

const listNewsCategories = async (req, res) => {
  const payload = { locale: req.query.locale };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.listCategoriesParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.listCategories(validatePayload.data);
  return sendResponse(result, res);
};

const listAdminNews = async (req, res) => {
  const payload = { ...req.query };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.listAdminNewsParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.listAdmin(validatePayload.data);
  return paginationResponse(result, res);
};

const getAdminNews = async (req, res) => {
  const payload = { id: req.params.id };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getAdminNewsParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.getAdminById(validatePayload.data);
  return sendResponse(result, res);
};

const createNews = async (req, res) => {
  const payload = {
    ...req.body,
    author_user_id: req.userMeta.id,
  };
  if (payload.category_id === "") payload.category_id = null;
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.createNewsParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.createNews(validatePayload.data);
  return sendResponse(result, res, 201);
};

const updateNews = async (req, res) => {
  const payload = { id: req.params.id, ...req.body };
  if (payload.category_id === "") payload.category_id = null;
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateNewsParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.updateNews(validatePayload.data);
  return sendResponse(result, res);
};

const uploadCover = async (req, res) => {
  if (!req.file) {
    return sendResponse(
      wrapper.error(new BadRequestError("Cover file is required (field: cover)")),
      res
    );
  }
  const payload = {
    id: req.params.id,
    cover_url: `/uploads/news/covers/${req.file.filename}`,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.uploadCoverParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.uploadCover(validatePayload.data);
  return sendResponse(result, res);
};

const publishNews = async (req, res) => {
  const payload = { id: req.params.id };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.newsIdParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.publishNews(validatePayload.data);
  return sendResponse(result, res);
};

const archiveNews = async (req, res) => {
  const payload = { id: req.params.id };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.newsIdParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.archiveNews(validatePayload.data);
  return sendResponse(result, res);
};

const deleteNews = async (req, res) => {
  const payload = { id: req.params.id };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.newsIdParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.deleteNews(validatePayload.data);
  return sendResponse(result, res);
};

const createCategory = async (req, res) => {
  const validatePayload = validator.isValidPayload(
    req.body,
    commandModel.createCategoryParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.createCategory(validatePayload.data);
  return sendResponse(result, res, 201);
};

const updateCategory = async (req, res) => {
  const payload = { id: req.params.id, ...req.body };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateCategoryParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.updateCategory(validatePayload.data);
  return sendResponse(result, res);
};

const deleteCategory = async (req, res) => {
  const payload = { id: req.params.id };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.categoryIdParamType
  );
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.deleteCategory(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  listPublicNews,
  getPublicNews,
  listNewsCategories,
  listAdminNews,
  getAdminNews,
  createNews,
  updateNews,
  uploadCover,
  publishNews,
  archiveNews,
  deleteNews,
  createCategory,
  updateCategory,
  deleteCategory,
};
