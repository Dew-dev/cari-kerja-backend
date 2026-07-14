const S3 = require("aws-sdk/clients/s3");
const config = require("../../../config/global_config");
const wrapper = require("../../utils/wrapper");
const logger = require("../../utils/logger");
const ctx = "R2-Helper";
const endpoint = config.get("/r2BucketAuth/enpS3Client");
const accessKey = config.get("/r2BucketAuth/accS3User");
const secretKey = config.get("/r2BucketAuth/secS3USer");
const bucketName = config.get("/r2BucketAuth/bucketName");

const r2 = new S3({
  endpoint: endpoint,
  accessKeyId: accessKey,
  secretAccessKey: secretKey,
  region: "auto",
  signatureVersion: "v4",
});

const addObjectStream = async (params) => {
  try {
    const newParams = {
      ...params,
      Bucket: bucketName,
    };
    const result = await r2.putObject(newParams).promise();

    return wrapper.data("Object successfully added");
  } catch (error) {
    return wrapper.error("Error adding date");
  }
};

const getObjectStream = async (fileKey) => {
  try {
    const signedUrl = await r2.getSignedUrlPromise({
      Bucket: bucketName,
      Key: fileKey,
      Expires: 60 * 60,
    });
    return wrapper.data({ url: signedUrl });
  } catch (error) {
    return wrapper.error("Error get object");
  }
};

const deleteObjectStream = async (fileKey) => {
  try {
    const result = await r2.deleteObject({ Bucket: bucketName, Key: fileKey }).promise();

    return wrapper.data("Object successfully deleted");
  } catch (error) {
    return wrapper.error("Error delete data");
  }
};

module.exports = {
  addObjectStream,
  getObjectStream,
  deleteObjectStream,
};
