/**
 * Contact obfuscation helpers for anti-scraping.
 * Raw email/phone must not appear in public profile HTML/API payloads.
 */

const maskEmail = (email) => {
  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at < 1) return "***";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const localMask =
    local.length <= 2
      ? `${local[0] || "*"}*`
      : `${local[0]}${"*".repeat(Math.min(local.length - 1, 5))}`;
  const domainParts = domain.split(".");
  const domainName = domainParts[0] || "";
  const tld = domainParts.slice(1).join(".") || "***";
  const domainMask =
    domainName.length <= 2
      ? `${domainName[0] || "*"}*`
      : `${domainName[0]}${"*".repeat(Math.min(domainName.length - 1, 4))}`;
  return `${localMask}@${domainMask}.${tld}`;
};

const maskTelephone = (phone) => {
  if (!phone || typeof phone !== "string") return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  const visibleTail = digits.slice(-3);
  const visibleHead = digits.slice(0, Math.min(3, digits.length - 3));
  return `${visibleHead}${"*".repeat(Math.max(digits.length - visibleHead.length - 3, 3))}${visibleTail}`;
};

/**
 * Strip raw contact fields and expose masked placeholders + reveal flags.
 */
const obfuscateContactFields = (row = {}) => {
  const has_email = Boolean(row.email);
  const has_telephone = Boolean(row.telephone);
  return {
    ...row,
    email: undefined,
    telephone: undefined,
    email_masked: has_email ? maskEmail(row.email) : null,
    telephone_masked: has_telephone ? maskTelephone(row.telephone) : null,
    contact_revealable: {
      email: has_email,
      telephone: has_telephone,
    },
  };
};

module.exports = {
  maskEmail,
  maskTelephone,
  obfuscateContactFields,
};
