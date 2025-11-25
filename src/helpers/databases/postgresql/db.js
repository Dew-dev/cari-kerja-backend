const pgConnection = require("./connection");
const wrapper = require("../../utils/wrapper");
const logger = require("../../utils/logger");
const { Query } = require("pg");
const errorQueryMessage = "Error querying PostgreSQL";
const errorEmptyMessage = "Data Not Found Please Try Another Input";
const ctx = "Database.PostgreSQL";

class DB {
  constructor(pgConfig) {
    this.pgConfig = pgConfig;
  }

  async executeQuery(query, values) {
    try {
      const getDatabase = await pgConnection.getConnection(this.pgConfig);
      const result = await getDatabase.query(query, values);
      return result;
    } catch (err) {
      logger.error(ctx, errorQueryMessage, "executeQuery", err);
      return null;
    }
  }

  async findOne(
    parameter,
    projection,
    collectionName,
    whereConditions = "AND",
    isDeleted = false,
    timescope = false
  ) {
    try {
      const projectionKeys = Object.keys(projection);
      const parameterKey = Object.keys(parameter);
      const projectionPlaceholders = projectionKeys
        .map((key) => `"${collectionName}"."${key}"`)
        .join(", ");
      const parameterPlaceholders = parameterKey
        .map((key, index) => `"${collectionName}"."${key}" = $${index + 1}`)
        .join(` ${whereConditions} `);
      const deleted = isDeleted
        ? `AND "${collectionName}"."deleted_at" IS NULL`
        : "";
      const time = timescope
        ? `AND "${collectionName}"."${timescope.column}" BETWEEN '${timescope.start}' AND '${timescope.end}'`
        : "";
      const query = `
        SELECT ${projectionPlaceholders}
        FROM "${collectionName}"
        WHERE ${parameterPlaceholders} ${deleted} ${time}
        LIMIT 1;
      `;
      const values = parameterKey.map((key) => parameter[key]);
      console.log("Query FindOne : " + query);
      const result = await this.executeQuery(query, values);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows[0]);
    } catch (err) {
      logger.error(ctx, errorQueryMessage, "findOne", err);
      return wrapper.error(errorQueryMessage);
    }
  }

  async insertOne(document, collectionName) {
    try {
      const keys = Object.keys(document);
      const values = Object.values(document);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const projectionPlaceholders = keys.map((key) => `"${key}"`).join(", ");
      const query = `
        INSERT INTO "${collectionName}" (${projectionPlaceholders})
        VALUES (${placeholders})
        RETURNING *;
      `;
      const result = await this.executeQuery(query, values);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorQueryMessage);
      }
      return wrapper.data(result.rows[0]);
    } catch (err) {
      logger.error(ctx, errorQueryMessage, "insertOne", err);
      return wrapper.error(errorQueryMessage);
    }
  }

  async insertMany(documents, collectionName) {
    try {
      if (!Array.isArray(documents) || documents.length === 0) {
        throw new Error("Documents must be a non-empty array");
      }

      // Ambil field keys dari dokumen pertama
      const keys = Object.keys(documents[0]);

      // Buat placeholder value seperti ($1,$2,...), ($n,...)
      const valuePlaceholders = documents
        .map((_, rowIndex) => {
          const baseIndex = rowIndex * keys.length;
          const placeholders = keys
            .map((_, colIndex) => `$${baseIndex + colIndex + 1}`)
            .join(", ");
          return `(${placeholders})`;
        })
        .join(", ");

      // Gabungkan semua nilai (flatten array)
      const values = documents.flatMap((doc) => Object.values(doc));

      // Buat field list untuk query
      const projectionPlaceholders = keys.map((key) => `"${key}"`).join(", ");
      console.log("Projection :  " + projectionPlaceholders);
      console.log("Value :  " + valuePlaceholders);
      // Query final
      const query = `
        INSERT INTO "${collectionName}" (${projectionPlaceholders})
        VALUES ${valuePlaceholders}
        RETURNING *;
      `;

      console.log("query :  " + query);
      // Eksekusi query
      const result = await this.executeQuery(query, values);

      if (!result || result.rows.length === 0) {
        return wrapper.error("Insert many failed");
      }

      return wrapper.data(result.rows);
    } catch (err) {
      logger.error(ctx, "Error insertMany", "insertMany", err);
      return wrapper.error(err.message);
    }
  }

  async updateOne(parameter, updateQuery, collectionName) {
    try {
      const updateQueryKey = Object.keys(updateQuery);
      const parameterKey = Object.keys(parameter);
      const updateQueryKeyPlaceholders = updateQueryKey
        .map((key) => `"${key}" = '${updateQuery[key]}'`)
        .join(", ");
      const parameterPlaceholders = parameterKey
        .map((key, index) => `"${key}" = $${index + 1}`)
        .join(" AND ");
      const query = `
        UPDATE "${collectionName}"
        SET ${updateQueryKeyPlaceholders}
        WHERE ${parameterPlaceholders}
        RETURNING *;
      `;
      const values = parameterKey.map((key) => parameter[key]);
      const result = await this.executeQuery(query, values);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows[0]);
    } catch (err) {
      logger.error(ctx, errorQueryMessage, "updateOne", err);
      return wrapper.error(errorQueryMessage);
    }
  }

  async updateOneNew(parameter, updateQuery, collectionName) {
    try {
      const updateQueryKey = Object.keys(updateQuery);
      const parameterKey = Object.keys(parameter);
      const updateQueryKeyPlaceholders = updateQueryKey
        .map((key, index) => `"${key}" = $${index + 1}`)
        .join(", ");
      const lastIndex = updateQueryKey.length;
      const parameterPlaceholders = parameterKey
        .map((key, index) => `"${key}" = $${lastIndex + index + 1}`)
        .join(" AND ");
      const query = `
        UPDATE "${collectionName}"
        SET ${updateQueryKeyPlaceholders}
        WHERE ${parameterPlaceholders}
        RETURNING *;
      `;
      console.log("Update Query :  " + query);
      const updateQueryValues = updateQueryKey.map((key) => updateQuery[key]);
      const parameterValues = parameterKey.map((key) => parameter[key]);
      const values = [...updateQueryValues, ...parameterValues];
      const result = await this.executeQuery(query, values);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows[0]);
    } catch (err) {
      logger.error(ctx, errorQueryMessage, "updateOne", err);
      return wrapper.error(errorQueryMessage);
    }
  }

  async countData(parameter, collectionName, isDeleted = false) {
    try {
      const parameterKey = Object.keys(parameter);
      const parameterPlaceholders = parameterKey
        .map((key, index) => `"${collectionName}"."${key}" = $${index + 1}`)
        .join(" AND ");
      const deleted = isDeleted
        ? `AND "${collectionName}"."deleted_at" IS NULL`
        : "";
      const query = `
        SELECT COUNT(*)
        FROM "${collectionName}"
        WHERE ${parameterPlaceholders} ${deleted};
      `;
      const values = parameterKey.map((key) => parameter[key]);
      const result = await this.executeQuery(query, values);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows[0].count);
    } catch (err) {
      logger.error(ctx, errorQueryMessage, "countData", err);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findMany(
    parameter,
    projection,
    sort,
    page,
    limit,
    collectionName,
    isDeleted = false,
    timescope = false
  ) {
    try {
      const projectionKeys = Object.keys(projection);
      const parameterKey = Object.keys(parameter);
      const projectionPlaceholders = projectionKeys
        .map((key) => `"${collectionName}"."${key}"`)
        .join(", ");
      const sortingPlaceholders = Object.keys(sort)
        .map((key) => `"${collectionName}"."${key}"`)
        .join(", ");
      const parameterPlaceholders = parameterKey
        .map((key, index) => `"${collectionName}"."${key}" = $${index + 1}`)
        .join(" AND ");
      const offset = limit * (page - 1);
      const deleted = isDeleted
        ? `AND "${collectionName}"."deleted_at" IS NULL`
        : "";
      const time = timescope
        ? `AND "${collectionName}"."${timescope.column}" BETWEEN '${timescope.start}' AND '${timescope.end}'`
        : "";
      const query = `
        SELECT ${projectionPlaceholders}
        FROM "${collectionName}"
        WHERE ${parameterPlaceholders} ${deleted} ${time}
        ORDER BY ${sortingPlaceholders} 
        LIMIT ${limit} OFFSET ${offset};
      `;
      const values = parameterKey.map((key) => parameter[key]);
      const result = await this.executeQuery(query, values);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows);
    } catch (err) {
      logger.error(ctx, errorQueryMessage, "findMany", err);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findManyLike(
    parameter,
    projection,
    sort,
    page,
    limit,
    collectionName,
    whereConditions = "AND",
    isDeleted = false,
    timescope = false
  ) {
    try {
      let values = [];
      let idx = 1;

      // --------------------------------------------------------------
      // SELECT
      const projectionKeys = Object.keys(projection);
      const projectionPlaceholders =
        projectionKeys.length > 0
          ? projectionKeys
              .map((key) => `"${collectionName}"."${key}"`)
              .join(", ")
          : `"${collectionName}".*`;

      // --------------------------------------------------------------
      // WHERE
      const parameterKeys = Object.keys(parameter);
      let whereParts = [];

      for (const key of parameterKeys) {
        const value = parameter[key];

        whereParts.push(`"${collectionName}"."${key}" ILIKE $${idx}`);
        values.push("%" + value + "%");
        idx++;
      }

      let whereClause =
        whereParts.length > 0
          ? `WHERE ${whereParts.join(` ${whereConditions} `)}`
          : `WHERE 1=1`;

      if (isDeleted) {
        whereClause += ` AND "${collectionName}"."deleted_at" IS NULL`;
      }

      if (timescope) {
        whereClause += ` AND "${collectionName}"."${
          timescope.column
        }" BETWEEN $${idx} AND $${idx + 1}`;
        values.push(timescope.start, timescope.end);
        idx += 2;
      }

      // --------------------------------------------------------------
      // SORT (UPDATED WITH PRIORITY SUPPORT)
      let sortingClause = "";

      if (Object.keys(sort).length > 0) {
        const sortKey = Object.keys(sort).find((k) => k !== "priorityValue");
        const sortDirection = sort[sortKey].toUpperCase();

        // ⭐ Default priority: Uzbekistan
        const priorityValue = sort.priorityValue || "Uzbekistani Soʻm";

        // Jika sorting berdasarkan "name" → pakai custom priority sorting
        if (sortKey === "name") {
          sortingClause = `
          ORDER BY 
            CASE 
              WHEN "${collectionName}"."${sortKey}" = '${priorityValue}' THEN 0 
              ELSE 1 
            END,
            "${collectionName}"."${sortKey}" ${sortDirection}
        `;
        } else {
          // Normal sorting
          sortingClause = `
          ORDER BY "${collectionName}"."${sortKey}" ${sortDirection}
        `;
        }
      }

      // --------------------------------------------------------------
      const offset = limit * (page - 1);

      const query = `
      SELECT ${projectionPlaceholders}
      FROM "${collectionName}"
      ${whereClause}
      ${sortingClause}
      LIMIT ${limit} OFFSET ${offset};
    `;

      // --------------------------------------------------------------
      // DEBUG LOGGING
      console.log("========= QUERY DEBUG START =========");
      console.log("SQL QUERY:");
      console.log(query);
      console.log("VALUES:");
      console.log(values);
      console.log("=====================================");

      const result = await this.executeQuery(query, values);

      console.log("========= QUERY RESULT =========");
      console.log("Row Count:", result?.rows?.length || 0);
      console.log("Rows:", result?.rows || []);
      console.log("================================");

      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }

      return wrapper.data(result.rows);
    } catch (err) {
      console.error("========= QUERY ERROR =========");
      console.error("Error Message:", err.message);
      console.error("Stack:", err.stack);
      console.error("================================");

      logger.error(ctx, errorQueryMessage, "findMany", err);
      return wrapper.error(errorQueryMessage);
    }
  }

  async findAll(
    projection,
    sort,
    page,
    limit,
    collectionName,
    isDeleted = false,
    timescope = false
  ) {
    try {
      const projectionKeys = Object.keys(projection);
      const projectionPlaceholders = projectionKeys
        .map((key) => `"${collectionName}"."${key}"`)
        .join(", ");
      const sortingPlaceholders = Object.keys(sort)
        .map((key) => `"${collectionName}"."${key}"`)
        .join(", ");
      const offset = limit * (page - 1);
      const deleted = isDeleted
        ? `"${collectionName}"."deleted_at" IS NULL`
        : "";
      const time = timescope
        ? `"${collectionName}"."${timescope.column}" BETWEEN '${timescope.start}' AND '${timescope.end}'`
        : "";
      const isTimescopeOrDeleted =
        timescope || isDeleted ? `WHERE ${deleted} ${time}` : "";
      const query = `
        SELECT ${projectionPlaceholders}
        FROM "${collectionName}"
        ${isTimescopeOrDeleted}
        ORDER BY ${sortingPlaceholders} 
        LIMIT ${limit} OFFSET ${offset};
      `;

      console.log("========= QUERY DEBUG START =========");
      console.log("SQL QUERY:");
      console.log(query);
      console.log("VALUES:");
      console.log(values);
      console.log("=====================================");
      const result = await this.executeQuery(query);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows);
    } catch (err) {
      logger.error(ctx, errorQueryMessage, "findAll", err);
      return wrapper.error(errorQueryMessage);
    }
  }

  async deleteOne(parameter, collectionName) {
    try {
      const parameterKey = Object.keys(parameter);
      const parameterPlaceholders = parameterKey
        .map((key, index) => `"${collectionName}"."${key}" = $${index + 1}`)
        .join(" AND ");
      const query = `
        DELETE FROM "${collectionName}"
        WHERE ${parameterPlaceholders}
      `;
      const values = parameterKey.map((key) => parameter[key]);
      const result = await this.executeQuery(query, values);
      if (!result || result.rowsCount === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows[0]);
    } catch (err) {
      logger.error(ctx, errorQueryMessage, "deleteOne", err);
      return wrapper.error(errorQueryMessage);
    }
  }

  async selectRawQuery(rawQuery, values) {
    try {
      const result = await this.executeQuery(rawQuery, values);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows[0]);
    } catch (err) {
      logger.error(ctx, errorQueryMessage, "selectRawQuery", err);
      return wrapper.error(errorQueryMessage);
    }
  }

  async insertRawQuery(rawQuery, values) {
    try {
      const result = await this.executeQuery(rawQuery, values);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorQueryMessage);
      }
      return wrapper.data(result.rows[0]);
    } catch (err) {
      logger.error(ctx, errorQueryMessage, "insertRawQuery", err);
      return wrapper.error(errorQueryMessage);
    }
  }

  async updateRawQuery(rawQuery, values) {
    try {
      const result = await this.executeQuery(rawQuery, values);
      if (!result || result.rows.length === 0) {
        return wrapper.error(errorEmptyMessage);
      }
      return wrapper.data(result.rows[0]);
    } catch (err) {
      logger.error(ctx, errorQueryMessage, "updateRawQuery", err);
      return wrapper.error(errorQueryMessage);
    }
  }
}

module.exports = DB;
