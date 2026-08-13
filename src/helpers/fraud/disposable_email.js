/**
 * Blocklist disposable / throwaway email domains for registration.
 * Offline list — no external API dependency.
 */
const DISPOSABLE_DOMAINS = new Set(
  [
    "mailinator.com",
    "guerrillamail.com",
    "guerrillamail.net",
    "sharklasers.com",
    "grr.la",
    "tempmail.com",
    "temp-mail.org",
    "temp-mail.io",
    "10minutemail.com",
    "10minmail.com",
    "yopmail.com",
    "trashmail.com",
    "trashmail.me",
    "discard.email",
    "dispostable.com",
    "maildrop.cc",
    "getnada.com",
    "nada.email",
    "emailondeck.com",
    "fakeinbox.com",
    "throwawaymail.com",
    "moakt.com",
    "mailnesia.com",
    "mintemail.com",
    "mytemp.email",
    "tmpmail.org",
    "tmpmail.net",
    "mailcatch.com",
    "spamgourmet.com",
  ].map((d) => d.toLowerCase())
);

const extractDomain = (email) => {
  if (!email || typeof email !== "string") return null;
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).trim().toLowerCase();
};

const isDisposableEmail = (email) => {
  const domain = extractDomain(email);
  if (!domain) return false;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  // catch subdomains of known disposables (e.g. foo.mailinator.com)
  for (const blocked of DISPOSABLE_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) return true;
  }
  return false;
};

module.exports = {
  DISPOSABLE_DOMAINS,
  isDisposableEmail,
  extractDomain,
};
