const queryHandler = require("../repositories/queries/query_handler");
const { sendResponse } = require("../../../helpers/utils/response");

// GET /api/v1/locations/provinces
const getAllProvinces = async (req, res) => {
  const result = await queryHandler.getAllProvinces();
  return sendResponse(result, res);
};

// GET /api/v1/locations/provinces/:id
const getProvinceById = async (req, res) => {
  const payload = { id: req.params.id };
  const result = await queryHandler.getProvinceById(payload);
  return sendResponse(result, res);
};

// GET /api/v1/locations/cities
// Query params: province_id (optional)
const getAllCities = async (req, res) => {
  const payload = { province_id: req.query.province_id };
  const result = await queryHandler.getAllCities(payload);
  return sendResponse(result, res);
};

// GET /api/v1/locations/cities/:id
const getCityById = async (req, res) => {
  const payload = { id: req.params.id };
  const result = await queryHandler.getCityById(payload);
  return sendResponse(result, res);
};

// GET /api/v1/locations/search
// Query params: search (required), type (provinces|cities|all), province_id (for cities only)
const searchLocations = async (req, res) => {
  const payload = {
    search: req.query.search,
    type: req.query.type || "all",
    province_id: req.query.province_id,
  };
  const result = await queryHandler.searchLocations(payload);
  return sendResponse(result, res);
};

module.exports = {
  getAllProvinces,
  getProvinceById,
  getAllCities,
  getCityById,
  searchLocations,
};
