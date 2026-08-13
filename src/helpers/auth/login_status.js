const TELEGRAM_PLACEHOLDER_EMAIL_RE = /^telegram_.+@carikerja\.id$/i;

const isTelegramPlaceholderEmail = (email) =>
  typeof email === "string" && TELEGRAM_PLACEHOLDER_EMAIL_RE.test(email);

/** Auth fields safe to expose on profile / refresh (no cross-provider banners). */
const buildAuthStatus = (user) => ({
  login_provider: user?.login_provider || null,
  email_verified_at: user?.email_verified_at || null,
});

module.exports = {
  isTelegramPlaceholderEmail,
  buildAuthStatus,
};
