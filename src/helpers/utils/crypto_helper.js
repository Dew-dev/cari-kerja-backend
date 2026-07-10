const crypto = require("crypto");
const CryptoJS = require("crypto-js");

const algorithm = "aes-256-cbc";
const rawKey = process.env.ENCRYPTION_KEY || "antigravity_default_secret_key_123456";
const ENCRYPTION_KEY = crypto.createHash("sha256").update(rawKey).digest(); // Guaranteed to be 32 bytes
const DET_IV = crypto.createHash("md5").update("cc_backend_iv_16").digest(); // Guaranteed to be 16 bytes

const encrypt = (text) => {
  if (text === null || text === undefined || text === "") {
    return text;
  }
  try {
    const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, DET_IV);
    let encrypted = cipher.update(String(text), "utf8", "base64");
    encrypted += cipher.final("base64");
    return encrypted;
  } catch (error) {
    return text;
  }
};

const decrypt = (ciphertext) => {
  if (ciphertext === null || ciphertext === undefined || ciphertext === "") {
    return ciphertext;
  }
  try {
    // Determine if it is a CryptoJS string (Base64 for "Salted__")
    if (typeof ciphertext === "string" && ciphertext.startsWith("U2FsdGVkX1")) {
      const bytes = CryptoJS.AES.decrypt(ciphertext, rawKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      // If decryption fails, it may return empty string
      if (decryptedString) {
        return decryptedString;
      }
    }

    const decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, DET_IV);
    let decrypted = decipher.update(String(ciphertext), "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    // If decryption fails, return original value (fallback for unencrypted data)
    return ciphertext;
  }
};

const sensitiveKeys = ["email", "username", "telephone", "name", "address", "worker_name", "worker_telephone"];

const isSensitiveKey = (key) => {
  if (!key) return false;
  const lowerKey = key.toLowerCase();
  return sensitiveKeys.includes(lowerKey);
};

const encryptDocument = (doc) => {
  if (!doc || typeof doc !== "object") return doc;
  const encrypted = { ...doc };
  for (const key of Object.keys(encrypted)) {
    if (isSensitiveKey(key) && typeof encrypted[key] === "string") {
      encrypted[key] = encrypt(encrypted[key]);
    }
  }
  return encrypted;
};

const decryptRows = (rows) => {
  if (!rows) return rows;
  const isArray = Array.isArray(rows);
  const data = isArray ? rows.map(r => ({ ...r })) : [{ ...rows }];
  for (const row of data) {
    if (row && typeof row === "object") {
      for (const key of Object.keys(row)) {
        if (isSensitiveKey(key) && typeof row[key] === "string") {
          row[key] = decrypt(row[key]);
        }
      }
    }
  }
  return isArray ? data : data[0];
};

module.exports = {
  encrypt,
  decrypt,
  isSensitiveKey,
  encryptDocument,
  decryptRows
};
