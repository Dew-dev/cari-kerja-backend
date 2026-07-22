const { Client } = require("@elastic/elasticsearch");
const config = require("../../../config/global_config");
const logger = require("../../utils/logger");

const ctx = "ElasticsearchClient";

let client = null;

const getEsConfig = () => {
  const matching = config.get("/matching") || {};
  return matching.elasticsearch || {};
};

const isEnabled = () => getEsConfig().enabled === true;

/**
 * Lazy singleton Elasticsearch client.
 * Returns null when MATCHING_ES_ENABLED is not true.
 */
const getClient = () => {
  if (!isEnabled()) return null;
  if (client) return client;

  const es = getEsConfig();
  const opts = {
    node: es.node || "http://localhost:9200",
  };

  if (es.username && es.password) {
    opts.auth = {
      username: es.username,
      password: es.password,
    };
  }

  client = new Client(opts);
  logger.info(ctx, `Elasticsearch client ready (${es.node})`, "getClient");
  return client;
};

const resetClient = () => {
  client = null;
};

module.exports = {
  getClient,
  isEnabled,
  getEsConfig,
  resetClient,
};
