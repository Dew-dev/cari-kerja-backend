/**
 * S3-compatible object storage client (MinIO, Cloudflare R2, AWS S3, etc.).
 * Active backend is selected via STORAGE_DRIVER + matching env credentials.
 */

const fs = require("fs");
const S3 = require("aws-sdk/clients/s3");
const config = require("../../../config/global_config");
const wrapper = require("../../utils/wrapper");
const logger = require("../../utils/logger");

const ctx = "S3-Compatible-Storage";

let cachedClient = null;
let cachedDriverKey = null;

const getDriverName = () =>
  String(process.env.STORAGE_DRIVER || "local").toLowerCase();

/**
 * Resolve connection settings for the active S3-compatible driver.
 */
const getActiveConfig = () => {
  const driver = getDriverName();

  if (driver === "minio") {
    const minio = config.get("/minio") || {};
    return {
      driver: "minio",
      endpoint: minio.endpoint,
      accessKeyId: minio.accessKey,
      secretAccessKey: minio.secretKey,
      bucketName: minio.bucketName,
      region: minio.region || "us-east-1",
      publicBaseUrl: minio.publicBaseUrl || "",
      forcePathStyle: minio.forcePathStyle !== false,
      sslEnabled: minio.useSSL !== false,
    };
  }

  if (driver === "r2" || driver === "s3") {
    const r2 = config.get("/r2BucketAuth") || {};
    return {
      driver: driver === "s3" ? "s3" : "r2",
      endpoint: r2.enpS3Client,
      accessKeyId: r2.accS3User,
      secretAccessKey: r2.secS3User,
      bucketName: r2.bucketName,
      region: process.env.S3_REGION || r2.region || "auto",
      publicBaseUrl: r2.publicBaseUrl || "",
      forcePathStyle: true,
      sslEnabled: true,
    };
  }

  return null;
};

const isConfigured = () => {
  const cfg = getActiveConfig();
  return Boolean(
    cfg &&
      cfg.endpoint &&
      cfg.accessKeyId &&
      cfg.secretAccessKey &&
      cfg.bucketName
  );
};

const getClient = () => {
  const cfg = getActiveConfig();
  if (!cfg) {
    throw new Error("S3-compatible storage is not configured for current STORAGE_DRIVER");
  }

  const driverKey = `${cfg.driver}|${cfg.endpoint}|${cfg.bucketName}`;
  if (cachedClient && cachedDriverKey === driverKey) return cachedClient;

  cachedClient = new S3({
    endpoint: cfg.endpoint,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    region: cfg.region || "us-east-1",
    signatureVersion: "v4",
    s3ForcePathStyle: cfg.forcePathStyle !== false,
    sslEnabled: cfg.sslEnabled !== false,
  });
  cachedDriverKey = driverKey;
  logger.info(ctx, `S3 client ready (${cfg.driver} @ ${cfg.endpoint})`, "getClient");
  return cachedClient;
};

const resetClient = () => {
  cachedClient = null;
  cachedDriverKey = null;
};

const addObjectStream = async (params) => {
  try {
    if (!isConfigured()) {
      return wrapper.error("Object storage is not configured");
    }
    const cfg = getActiveConfig();
    const client = getClient();
    await client
      .putObject({
        ...params,
        Bucket: cfg.bucketName,
      })
      .promise();
    return wrapper.data("Object successfully added");
  } catch (error) {
    logger.error(ctx, "addObjectStream", error.message || error);
    return wrapper.error("Error adding object");
  }
};

const uploadLocalFile = async ({ localPath, key, contentType, acl }) => {
  try {
    if (!isConfigured()) {
      return wrapper.error("Object storage is not configured");
    }
    const cfg = getActiveConfig();
    const client = getClient();
    const putParams = {
      Bucket: cfg.bucketName,
      Key: key,
      Body: fs.createReadStream(localPath),
      ContentType: contentType || "application/octet-stream",
    };
    if (acl) putParams.ACL = acl;

    await client.putObject(putParams).promise();
    return wrapper.data({ key });
  } catch (error) {
    logger.error(ctx, "uploadLocalFile", error.message || error);
    return wrapper.error("Error uploading file to object storage");
  }
};

const getSignedUrl = async (fileKey, expiresInSeconds = 60 * 60) => {
  try {
    if (!isConfigured()) {
      return wrapper.error("Object storage is not configured");
    }
    const cfg = getActiveConfig();
    const client = getClient();
    const url = await client.getSignedUrlPromise("getObject", {
      Bucket: cfg.bucketName,
      Key: fileKey,
      Expires: expiresInSeconds,
    });
    return wrapper.data({ url, expires_in: expiresInSeconds });
  } catch (error) {
    logger.error(ctx, "getSignedUrl", error.message || error);
    return wrapper.error("Error get object");
  }
};

/** @deprecated Prefer getSignedUrl */
const getObjectStream = async (fileKey) => getSignedUrl(fileKey, 60 * 60);

const deleteObjectStream = async (fileKey) => {
  try {
    if (!isConfigured()) {
      return wrapper.error("Object storage is not configured");
    }
    const cfg = getActiveConfig();
    const client = getClient();
    await client
      .deleteObject({ Bucket: cfg.bucketName, Key: fileKey })
      .promise();
    return wrapper.data("Object successfully deleted");
  } catch (error) {
    logger.error(ctx, "deleteObjectStream", error.message || error);
    return wrapper.error("Error delete data");
  }
};

/**
 * Ensure the configured bucket exists (MinIO / S3). Safe to call on boot.
 */
const ensureBucket = async () => {
  if (!isConfigured()) return { skipped: true, reason: "not_configured" };
  try {
    const cfg = getActiveConfig();
    const client = getClient();
    try {
      await client.headBucket({ Bucket: cfg.bucketName }).promise();
      return { ok: true, existed: true, bucket: cfg.bucketName };
    } catch (err) {
      const status = err?.statusCode || err?.status;
      if (status !== 404 && err?.code !== "NotFound" && err?.code !== "NoSuchBucket") {
        throw err;
      }
      await client
        .createBucket({
          Bucket: cfg.bucketName,
        })
        .promise();
      logger.info(ctx, `Created bucket ${cfg.bucketName}`, "ensureBucket");
      return { ok: true, created: true, bucket: cfg.bucketName };
    }
  } catch (error) {
    logger.error(ctx, "ensureBucket", error.message || error);
    return { err: error.message || String(error) };
  }
};

module.exports = {
  getDriverName,
  getActiveConfig,
  isConfigured,
  getClient,
  resetClient,
  addObjectStream,
  uploadLocalFile,
  getSignedUrl,
  getObjectStream,
  deleteObjectStream,
  ensureBucket,
};
