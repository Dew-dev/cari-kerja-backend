const crypto = require("crypto");
const axios = require("axios");
const jwt = require("jsonwebtoken");

let jwksCache = null;
let jwksCacheTime = 0;

/**
 * Fetches Telegram's JWKS and extracts the public key for the given key ID (kid).
 * Caches the JWKS keys for 1 hour to prevent redundant requests.
 */
async function getTelegramPublicKey(kid) {
  const now = Date.now();
  if (!jwksCache || now - jwksCacheTime > 3600000) {
    const res = await axios.get("https://oauth.telegram.org/.well-known/jwks.json");
    if (res.data && Array.isArray(res.data.keys)) {
      jwksCache = res.data.keys;
      jwksCacheTime = now;
    } else {
      throw new Error("Invalid response from Telegram JWKS endpoint");
    }
  }

  const jwk = jwksCache.find((k) => k.kid === kid);
  if (!jwk) {
    throw new Error("Signing key not found in Telegram JWKS");
  }

  // Import JWK directly using native Node.js crypto (Node 15.9.0+)
  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  return publicKey.export({ type: "spki", format: "pem" });
}

/**
 * Decodes and verifies the Telegram ID token (JWT) using the public key from JWKS.
 * Validates issuer and audience.
 */
async function verifyTelegramOidcToken(idToken, clientId) {
  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || !decoded.header || !decoded.header.kid) {
    throw new Error("Invalid Telegram ID Token format");
  }

  const publicKeyPem = await getTelegramPublicKey(decoded.header.kid);
  const verified = jwt.verify(idToken, publicKeyPem, {
    issuer: "https://oauth.telegram.org",
    audience: clientId,
    algorithms: ["RS256", "ES256", "EdDSA", "ES256K"],
  });

  return verified;
}

module.exports = {
  verifyTelegramOidcToken,
};
