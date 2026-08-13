/**
 * Shared Elasticsearch client for matching (knn) and job search (full-text).
 */

const config = require("../../../config/global_config");
const logger = require("../../utils/logger");

const ctx = "ElasticsearchClient";

let client = null;
let ClientCtor = null;

const loadClientCtor = () => {
  if (ClientCtor) return ClientCtor;
  try {
    // Lazy require so the app boots when the optional package is not installed yet.
    ({ Client: ClientCtor } = require("@elastic/elasticsearch"));
    return ClientCtor;
  } catch (err) {
    if (err?.code === "MODULE_NOT_FOUND") {
      logger.error(
        ctx,
        "loadClientCtor",
        "@elastic/elasticsearch is not installed; ES features disabled until npm install"
      );
      return null;
    }
    throw err;
  }
};

const getMatchingEsConfig = () => {
  const matching = config.get("/matching") || {};
  return matching.elasticsearch || {};
};

const getJobSearchConfig = () => {
  const jobSearch = config.get("/jobSearch") || {};
  return jobSearch.elasticsearch || {};
};

/** Connection settings shared by matching + job search. */
const getConnectionConfig = () => {
  const matching = getMatchingEsConfig();
  const jobSearch = getJobSearchConfig();
  return {
    node:
      matching.node ||
      jobSearch.node ||
      process.env.ELASTICSEARCH_NODE ||
      "http://localhost:9200",
    username: matching.username || jobSearch.username || "",
    password: matching.password || jobSearch.password || "",
  };
};

const isMatchingEnabled = () => getMatchingEsConfig().enabled === true;

const isJobSearchEnabled = () => getJobSearchConfig().enabled === true;

/** @deprecated Prefer isMatchingEnabled — kept for matching module compatibility */
const isEnabled = () => isMatchingEnabled();

const getEsConfig = () => getMatchingEsConfig();

/**
 * Lazy singleton Elasticsearch client.
 * Returns null when neither matching nor job-search ES is enabled.
 */
const getClient = () => {
  if (!isMatchingEnabled() && !isJobSearchEnabled()) return null;
  if (client) return client;

  const Client = loadClientCtor();
  if (!Client) return null;

  const es = getConnectionConfig();
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
  isMatchingEnabled,
  isJobSearchEnabled,
  getEsConfig,
  getJobSearchConfig,
  getMatchingEsConfig,
  resetClient,
};
