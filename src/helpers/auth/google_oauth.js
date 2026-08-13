const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const config = require("../../config/global_config");
const { sanitizeOauthRoleId } = require("./account_guards");
const { buildOauthLoginErrorRedirect } = require("./oauth_redirect");

const clientId = config.get("/googleAuth/clientId");
const secretKey = config.get("/googleAuth/secretKey");
const urlApp = config.get("/host");

passport.use(
  new GoogleStrategy(
    {
      clientID: clientId,
      clientSecret: secretKey,
      callbackURL: `${urlApp}/api/v1/users/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        picture: profile.photos[0].value,
      };
      return done(null, user);
    }
  )
);

const redirectOauthFailure = (res, { origin, roleId, message }) => {
  return res.redirect(
    buildOauthLoginErrorRedirect({
      origin,
      roleId,
      err: { message: message || "Google OAuth failed" },
      fallbackMessage: "Google OAuth failed",
    })
  );
};

const authGoogle = (req, res, next) => {
  const { role_id, origin } = req.query;
  const safeRole = sanitizeOauthRoleId(role_id);
  // Tolak attempt privilege escalation (role admin) sebelum redirect ke Google
  if (role_id !== undefined && role_id !== null && role_id !== "" && safeRole === null) {
    return redirectOauthFailure(res, {
      origin,
      roleId: 1,
      message: "Invalid OAuth role",
    });
  }
  passport.authenticate("google", {
    scope: ["email", "profile"],
    state: JSON.stringify({ role_id: safeRole ?? 1, origin }),
  })(req, res, next);
};

const authGoogleCallback = (req, res, next) => {
  let state = {};
  try {
    state = req.query.state ? JSON.parse(req.query.state) : {};
  } catch (e) {
    state = {};
  }
  const { role_id, origin } = state;
  const safeRole = sanitizeOauthRoleId(role_id);
  if (role_id !== undefined && role_id !== null && role_id !== "" && safeRole === null) {
    return redirectOauthFailure(res, {
      origin,
      roleId: 1,
      message: "Invalid OAuth role",
    });
  }
  passport.authenticate("google", { session: false }, (err, user) => {
    if (err || !user) {
      return redirectOauthFailure(res, {
        origin,
        roleId: safeRole ?? 1,
        message: "Google OAuth failed",
      });
    }
    req.user = { ...user, role_id: safeRole ?? 1, origin };
    next();
  })(req, res, next);
};

module.exports = { authGoogle, authGoogleCallback };
