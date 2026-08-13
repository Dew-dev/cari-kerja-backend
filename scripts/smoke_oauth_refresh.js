/**
 * Smoke: refresh-token + workers/me against local server (APP_PORT).
 * OAuth redirect encoding is covered by unit/QA tests (cannot automate IdP here).
 */
require("dotenv").config();
const { Client } = require("pg");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../src/helpers/auth/jwt_helper");

const BASE = `http://127.0.0.1:${process.env.SMOKE_PORT || 5011}`;
const basicUser = process.env.USERNAME_BASIC;
const basicPass = process.env.PASSWORD_BASIC;
const basicHeader = `Basic ${Buffer.from(`${basicUser}:${basicPass}`).toString("base64")}`;

async function main() {
  const c = new Client({ connectionString: process.env.POSTGRESQL_URL });
  await c.connect();
  const { rows } = await c.query(`
    SELECT u.id, u.email, u.role_id, u.login_provider, u.username,
           u.email_verified_at, u.is_suspended, w.id AS worker_id, w.name
    FROM users u
    JOIN workers w ON w.user_id = u.id
    WHERE u.role_id = 1
      AND (u.is_suspended IS NULL OR u.is_suspended = false)
    LIMIT 1
  `);
  await c.end();

  if (!rows[0]) {
    throw new Error("No worker user found for smoke test");
  }
  const user = rows[0];
  console.log("worker:", { id: user.id, email: user.email, worker_id: user.worker_id });

  const oauthAccess = await generateAccessToken({
    id: user.id,
    email: user.email,
    role_id: user.role_id,
    worker_id: user.worker_id,
    name: user.name,
    role: "user",
    login_provider: user.login_provider || "google",
  });
  const refresh = await generateRefreshToken({ id: user.id });

  // Simulate OAuth callback query string encoding
  const callbackUrl =
    `http://localhost:5173/auth/callback?token=${encodeURIComponent(oauthAccess)}` +
    `&refreshToken=${encodeURIComponent(refresh)}`;
  const parsed = new URL(callbackUrl);
  if (!parsed.searchParams.get("token") || !parsed.searchParams.get("refreshToken")) {
    throw new Error("OAuth callback params missing after encode");
  }
  console.log("OK oauth-callback-params encoded (google/telegram shape)");

  // PUT refresh-token with Basic + body
  const refreshRes = await fetch(`${BASE}/api/v1/users/refresh-token`, {
    method: "PUT",
    headers: {
      Authorization: basicHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  const refreshBody = await refreshRes.json();
  console.log("refresh status:", refreshRes.status);
  console.log("refresh keys:", Object.keys(refreshBody.data || {}));
  if (refreshRes.status !== 200 || !refreshBody?.data?.token || !refreshBody?.data?.user) {
    console.error(refreshBody);
    throw new Error("refresh-token smoke failed");
  }
  // Cookie SameSite/Secure (inspect Set-Cookie if present)
  const setCookie = refreshRes.headers.getSetCookie?.() || [];
  console.log("Set-Cookie:", setCookie);
  console.log("OK PUT /users/refresh-token");

  // GET workers/me with OAuth access token (pre-refresh, as FE would after callback)
  const meRes = await fetch(`${BASE}/api/v1/users/workers/me`, {
    headers: { Authorization: `Bearer ${oauthAccess}` },
  });
  const meBody = await meRes.json();
  console.log("me status:", meRes.status);
  if (meRes.status !== 200) {
    console.error(meBody);
    throw new Error("workers/me smoke failed");
  }
  console.log("OK GET /users/workers/me with Bearer OAuth access");

  // Failed refresh must not wipe anything server-side (stateless JWT) — just error
  const badRes = await fetch(`${BASE}/api/v1/users/refresh-token`, {
    method: "PUT",
    headers: {
      Authorization: basicHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken: "not-a-valid-token" }),
  });
  const badBody = await badRes.json();
  console.log("bad refresh status:", badRes.status, "message:", badBody.message);
  if (badRes.status === 200) {
    throw new Error("expected failed refresh to error");
  }
  // Access token from OAuth still valid after failed refresh
  const meAgain = await fetch(`${BASE}/api/v1/users/workers/me`, {
    headers: { Authorization: `Bearer ${oauthAccess}` },
  });
  if (meAgain.status !== 200) {
    throw new Error("failed refresh invalidated OAuth access token");
  }
  console.log("OK failed refresh does not invalidate OAuth access token");

  // Basic auth message clarity
  const noBasic = await fetch(`${BASE}/api/v1/users/refresh-token`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  const noBasicBody = await noBasic.json();
  console.log("no-basic message:", noBasicBody.message);
  if (noBasicBody.message === "Token is not valid") {
    throw new Error("misleading Basic auth message still present");
  }
  if (noBasic.status !== 401 || noBasicBody.message !== "Basic authentication required") {
    throw new Error(`unexpected basic auth message: ${noBasicBody.message}`);
  }
  console.log("OK Basic auth error message");

  console.log("\nSMOKE PASSED");
}

main().catch((e) => {
  console.error("SMOKE FAILED:", e.message);
  process.exit(1);
});
