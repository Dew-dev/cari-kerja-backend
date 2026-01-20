const { getToken, verifyAccessToken } = require("../helpers/auth/jwt_helper");

const optionalVerifyToken = async (req, res, next) => {
  try {
    // 1. Ambil token dari Authorization
    let token = getToken(req.headers["authorization"]);

    // 2. Fallback ke cookies
    if (!token) {
      token = req.cookies?.token || req.cookies?.accessToken || null;
    }

    // 3. Tidak ada token → lanjut tanpa user
    if (!token) {
      req.userMeta = null;
      return next();
    }

    // 4. Ada token → coba verify
    const checkedToken = await verifyAccessToken(token);

    // 5. Token invalid → ignore (opsional auth)
    if (checkedToken.err) {
      req.userMeta = null;
      return next();
    }

    // 6. Token valid → inject user
    req.userMeta = checkedToken.data;
    return next();
  } catch (err) {
    // Safety net: jangan pernah block request
    req.userMeta = null;
    return next();
  }
};

module.exports = optionalVerifyToken;
