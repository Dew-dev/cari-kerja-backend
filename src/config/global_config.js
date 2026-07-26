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
  telegramBot: {
    token: process.env.TELEGRAM_BOT_TOKEN || "",
    username: process.env.TELEGRAM_BOT_USERNAME || "",
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
    apiBase: process.env.TELEGRAM_API_BASE || "https://api.telegram.org",
    rateLimitMax: Number(process.env.TELEGRAM_RATE_LIMIT_MAX || 25),
    rateLimitDuration: Number(process.env.TELEGRAM_RATE_LIMIT_DURATION_MS || 1000),
    startPayloadTtlSec: Number(process.env.TELEGRAM_START_PAYLOAD_TTL_SEC || 3600),
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
    modelVersion: process.env.MATCHING_MODEL_VERSION || "hybrid-v3",
    // GPT CV read for matching (requires OPENAI_API_KEY). Set false to skip.
    cvGptEnabled: process.env.MATCHING_CV_GPT_ENABLED !== "false",
    embeddingUrl: process.env.MATCHING_EMBEDDING_URL || "",
    embeddingApiKey: process.env.MATCHING_EMBEDDING_API_KEY || "",
    embeddingDims: Number(process.env.MATCHING_EMBEDDING_DIMS || 256),
    weights: {
      // hybrid-v3: rule-based + GPT CV fit (weights renormalize if cv_fit skipped)
      semantic: Number(process.env.MATCHING_W_SEMANTIC || 0.15),
      skills: Number(process.env.MATCHING_W_SKILLS || 0.22),
      cv_fit: Number(process.env.MATCHING_W_CV_FIT || 0.2),
      position: Number(process.env.MATCHING_W_POSITION || 0.13),
      experience: Number(process.env.MATCHING_W_EXPERIENCE || 0.12),
      salary: Number(process.env.MATCHING_W_SALARY || 0.08),
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
