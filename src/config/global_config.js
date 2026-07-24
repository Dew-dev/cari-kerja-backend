require("dotenv").config();
const confidence = require("confidence");

const config = {
  host: process.env.APP_HOST,
  env: process.env.APP_ENV,
  port: process.env.APP_PORT,
  frontendUrl: process.env.FE_URL,
  cors: {
    origins: process.env.CORS_ORIGINS,
  },
  postgresqlUrl: process.env.POSTGRESQL_URL || "postgresql://postgres:postgres@localhost:5432/sample",
  jwt: {
    accessSign: process.env.ACCESS_SIGN_OPTIONS,
    refreshSign: process.env.REFRESH_SIGN_OPTIONS,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  },
  basicAuth: {
    username: process.env.USERNAME_BASIC,
    password: process.env.PASSWORD_BASIC,
  },
  googleAuth: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    secretKey: process.env.GOOGLE_SECRET_KEY,
  },
  telegramAuth: {
    clientId: process.env.TELEGRAM_CLIENT_ID,
    clientSecret: process.env.TELEGRAM_CLIENT_SECRET,
    redirectUri: process.env.TELEGRAM_REDIRECT_URI,
  },
  r2BucketAuth: {
    enpS3Client: process.env.R2_ENDPOINT_S3_CLIENT,
    userApiToken: process.env.R2_USER_API_TOKEN,
    accS3User: process.env.R2_ACCESS_S3_USER,
    secS3User: process.env.R2_SECRET_S3_USER,
    bucketName: process.env.R2_BUCKET_NAME,
  },
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  xendit: {
    secretKey: process.env.XENDIT_SECRET_KEY,
    webhookToken: process.env.XENDIT_WEBHOOK_TOKEN,
    callbackUrl: process.env.XENDIT_CALLBACK_URL,
    successRedirectUrl: process.env.XENDIT_SUCCESS_REDIRECT_URL,
    failureRedirectUrl: process.env.XENDIT_FAILURE_REDIRECT_URL,
  },
  turnstile: {
    secretKey: process.env.TURNSTILE_SECRET_KEY || "",
    siteKey: process.env.TURNSTILE_SITE_KEY || "",
  },
  matching: {
    enabled: process.env.MATCHING_ENABLED !== "false",
    modelVersion: process.env.MATCHING_MODEL_VERSION || "hybrid-v2",
    embeddingUrl: process.env.MATCHING_EMBEDDING_URL || "",
    embeddingApiKey: process.env.MATCHING_EMBEDDING_API_KEY || "",
    embeddingDims: Number(process.env.MATCHING_EMBEDDING_DIMS || 256),
    weights: {
      semantic: Number(process.env.MATCHING_W_SEMANTIC || 0.25),
      skills: Number(process.env.MATCHING_W_SKILLS || 0.25),
      position: Number(process.env.MATCHING_W_POSITION || 0.15),
      experience: Number(process.env.MATCHING_W_EXPERIENCE || 0.15),
      salary: Number(process.env.MATCHING_W_SALARY || 0.1),
      location: Number(process.env.MATCHING_W_LOCATION || 0.1),
      education: Number(process.env.MATCHING_W_EDUCATION || 0),
    },
    elasticsearch: {
      enabled: process.env.MATCHING_ES_ENABLED === "true",
      node: process.env.ELASTICSEARCH_NODE || "http://localhost:9200",
      username: process.env.ELASTICSEARCH_USERNAME || "",
      password: process.env.ELASTICSEARCH_PASSWORD || "",
      jobsIndex: process.env.MATCHING_ES_JOBS_INDEX || "matching_jobs",
      workersIndex: process.env.MATCHING_ES_WORKERS_INDEX || "matching_workers",
      knnCandidates: Number(process.env.MATCHING_ES_KNN_CANDIDATES || 50),
    },
  },
};

const store = new confidence.Store(config);

exports.get = (key) => store.get(key);
