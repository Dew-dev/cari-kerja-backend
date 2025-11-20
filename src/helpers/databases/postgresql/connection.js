const { Pool } = require("pg");
const config = require("../../../config/global_config");
const logger = require("../../utils/logger");
const connectionPool = new Map();

const init = async (pgConfig) => {
  const poolKey = pgConfig;
  if (!connectionPool.has(poolKey)) {
    let pool;
    if (config.get("/dbAivenSSL")) {
      pool = new Pool({
        connectionString: pgConfig,
        ssl: {
          rejectUnauthorized: true,
          ca: config.get("/dbAivenSSL"),
        },
      });
    } else {
      pool = new Pool({ connectionString: pgConfig });
    }
    const result = new Promise((resolve, reject) => {
      pool.connect((err, client) => {
        if (err) {
          reject(err);
          return;
        }
        // don't kill app when postgres is down
        client.on("error", (err) => {
          // if err not "idle connection is terminated by postgres" is rejected
          if (err.message !== "Connection terminated unexpectedly") {
            reject(err);
            return;
          }
        });
        resolve(pool);
        return;
      });
    });
    await result
      .then((res) => {
        logger.info(
          "postgresql connection",
          "connected",
          "database initiation"
        );
        connectionPool.set(poolKey, res);
      })
      .catch((err) =>
        logger.error(
          "postgresql connection",
          "connection error",
          "database initiation",
          err.stack
        )
      );
  }
};

const getConnection = async (pgConfig) => {
  const poolKey = pgConfig;
  if (!connectionPool.has(poolKey)) {
    await init(pgConfig);
  }
  return connectionPool.get(poolKey);
};

module.exports = {
  init,
  getConnection,
};
