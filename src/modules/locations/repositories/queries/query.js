const errorEmptyMessage = "Data Not Found";
const errorQueryMessage = "Error querying PostgreSQL";
const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Locations-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  // Get all provinces
  async getAllProvinces() {
    try {
      const query = `
        SELECT 
          id,
          name
        FROM provinces
        ORDER BY name ASC;
      `;

      const result = await this.db.executeQuery(query, []);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "getAllProvinces", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  // Get province by ID
  async getProvinceById(id) {
    try {
      const query = `
        SELECT 
          id,
          name
        FROM provinces
        WHERE id = $1;
      `;

      const result = await this.db.executeQuery(query, [id]);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "getProvinceById", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  // Get all cities
  async getAllCities() {
    try {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.province_id,
          p.name AS province_name
        FROM cities c
        JOIN provinces p ON p.id = c.province_id
        ORDER BY p.name ASC, c.name ASC;
      `;

      const result = await this.db.executeQuery(query, []);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "getAllCities", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  // Get cities by province ID
  async getCitiesByProvinceId(province_id) {
    try {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.province_id,
          p.name AS province_name
        FROM cities c
        JOIN provinces p ON p.id = c.province_id
        WHERE c.province_id = $1
        ORDER BY c.name ASC;
      `;

      const result = await this.db.executeQuery(query, [province_id]);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "getCitiesByProvinceId", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  // Get city by ID
  async getCityById(id) {
    try {
      const query = `
        SELECT 
          c.id,
          c.name,
          c.province_id,
          p.name AS province_name
        FROM cities c
        JOIN provinces p ON p.id = c.province_id
        WHERE c.id = $1;
      `;

      const result = await this.db.executeQuery(query, [id]);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "getCityById", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  // Search provinces by name
  async searchProvinces(searchTerm) {
    try {
      const query = `
        SELECT 
          id,
          name
        FROM provinces
        WHERE LOWER(name) ILIKE '%' || LOWER($1) || '%'
        ORDER BY name ASC;
      `;

      const result = await this.db.executeQuery(query, [searchTerm]);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "searchProvinces", error);
      return wrapper.error(errorQueryMessage);
    }
  }

  // Search cities by name
  async searchCities(searchTerm, province_id = null) {
    try {
      let query = `
        SELECT 
          c.id,
          c.name,
          c.province_id,
          p.name AS province_name
        FROM cities c
        JOIN provinces p ON p.id = c.province_id
        WHERE LOWER(c.name) ILIKE '%' || LOWER($1) || '%'
      `;

      const params = [searchTerm];

      if (province_id) {
        query += ` AND c.province_id = $2`;
        params.push(province_id);
      }

      query += ` ORDER BY c.name ASC;`;

      const result = await this.db.executeQuery(query, params);

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, errorQueryMessage, "searchCities", error);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = Query;
