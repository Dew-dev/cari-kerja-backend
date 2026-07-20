const TELEGRAM_PLACEHOLDER_EMAIL_RE = /^telegram_.+@carikerja\.id$/i;

const isTelegramPlaceholderEmail = (email) =>
  typeof email === "string" && TELEGRAM_PLACEHOLDER_EMAIL_RE.test(email);

const needsEmailSetup = (user) => {
  if (!user || user.login_provider !== "telegram") return false;
  if (!user.email || isTelegramPlaceholderEmail(user.email)) return true;
  return !user.email_verified_at;
};

const needsTelegramLink = (user) => {
  if (!user) return false;
  if (user.login_provider !== "local" && user.login_provider !== "google") {
    return false;
  }
  return !user.notification_telegram_id;
};

const buildAuthStatus = (user) => {
  const telegram_linked = Boolean(user?.notification_telegram_id);
  return {
    login_provider: user?.login_provider || null,
    email_verified_at: user?.email_verified_at || null,
    notification_telegram_id: user?.notification_telegram_id || null,
    notification_telegram_username: user?.notification_telegram_username || null,
    telegram_linked,
    requires_email_setup: needsEmailSetup(user),
    requires_email_update: needsEmailSetup(user),
    requires_telegram_link: needsTelegramLink(user),
  };
};

module.exports = {
  isTelegramPlaceholderEmail,
  needsEmailSetup,
  needsTelegramLink,
  buildAuthStatus,
};
