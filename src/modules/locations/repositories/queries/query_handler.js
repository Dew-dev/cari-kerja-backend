const Domain = require("./domain");
const config = require("../../../../config/global_config");
const DB = require("../../../../helpers/databases/postgresql/db");

const db = new DB(config.get("/postgresqlUrl"));
const domain = new Domain(db);

const getAllProvinces = async () => {
  return domain.getAllProvinces();
};

const getProvinceById = async (payload) => {
  return domain.getProvinceById(payload);
};

const getAllCities = async (payload) => {
  return domain.getAllCities(payload);
};

const getCityById = async (payload) => {
  return domain.getCityById(payload);
};

const searchLocations = async (payload) => {
  return domain.searchLocations(payload);
};

module.exports = {
  getAllProvinces,
  getProvinceById,
  getAllCities,
  getCityById,
  searchLocations,
};
