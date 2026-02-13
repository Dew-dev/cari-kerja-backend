const locationHandler = require("../modules/locations/handlers/api_handler");

module.exports = (server) => {
  // Get all provinces
  server.get("/api/v1/locations/provinces", locationHandler.getAllProvinces);

  // Get province by ID
  server.get("/api/v1/locations/provinces/:id", locationHandler.getProvinceById);

  // Get all cities (with optional province_id filter)
  server.get("/api/v1/locations/cities", locationHandler.getAllCities);

  // Get city by ID
  server.get("/api/v1/locations/cities/:id", locationHandler.getCityById);

  // Search locations
  server.get("/api/v1/locations/search", locationHandler.searchLocations);
};
