/**
 * Backward-compatible R2 helper — delegates to shared S3-compatible client.
 * Prefer requiring `helpers/databases/s3_compatible/oss` or `helpers/storage/object_storage`.
 */

module.exports = require("../s3_compatible/oss");
