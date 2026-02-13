const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Locations-Query-Domain";

class Locations {
  constructor(db) {
    this.query = new Query(db);
  }

  async getAllProvinces() {
    const provinces = await this.query.getAllProvinces();

    if (provinces.err) {
      logger.error(ctx, "getAllProvinces", "Cannot find provinces", provinces.err);
      return wrapper.error(new NotFoundError("Cannot find provinces"));
    }

    logger.info(ctx, "getAllProvinces", "Get all provinces");
    return wrapper.data(provinces.data);
  }

  async getProvinceById(payload) {
    const { id } = payload;
    const province = await this.query.getProvinceById(id);

    if (province.err) {
      logger.error(ctx, "getProvinceById", "Province not found", province.err);
      return wrapper.error(new NotFoundError("Province not found"));
    }

    logger.info(ctx, "getProvinceById", "Get province", payload);
    return wrapper.data(province.data);
  }

  async getAllCities(payload) {
    const { province_id } = payload || {};

    let cities;
    if (province_id) {
      cities = await this.query.getCitiesByProvinceId(province_id);
    } else {
      cities = await this.query.getAllCities();
    }

    if (cities.err) {
      logger.error(ctx, "getAllCities", "Cannot find cities", cities.err);
      return wrapper.error(new NotFoundError("Cannot find cities"));
    }

    logger.info(ctx, "getAllCities", "Get cities", payload);
    return wrapper.data(cities.data);
  }

  async getCityById(payload) {
    const { id } = payload;
    const city = await this.query.getCityById(id);

    if (city.err) {
      logger.error(ctx, "getCityById", "City not found", city.err);
      return wrapper.error(new NotFoundError("City not found"));
    }

    logger.info(ctx, "getCityById", "Get city", payload);
    return wrapper.data(city.data);
  }

  async searchLocations(payload) {
    const { search, type = "all", province_id } = payload;

    if (!search || search.trim() === "") {
      return wrapper.error(new NotFoundError("Search term is required"));
    }

    const results = {};

    if (type === "provinces" || type === "all") {
      const provinces = await this.query.searchProvinces(search);
      results.provinces = !provinces.err ? provinces.data : [];
    }

    if (type === "cities" || type === "all") {
      const cities = await this.query.searchCities(search, province_id);
      results.cities = !cities.err ? cities.data : [];
    }

    logger.info(ctx, "searchLocations", "Search locations", payload);
    return wrapper.data(results);
  }
}

module.exports = Locations;
