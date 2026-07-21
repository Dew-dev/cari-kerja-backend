/**
 * Lightweight disposable / invalid phone heuristics (no external API).
 */
const normalizePhone = (phone) =>
  String(phone || "").replace(/[\s\-().]/g, "");

const isDisposablePhone = (phone) => {
  const raw = normalizePhone(phone);
  if (!raw) return false;

  // Must look like a phone (8–15 digits, optional leading +)
  if (!/^\+?\d{8,15}$/.test(raw)) return true;

  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return true;

  // All same digit / sequential junk
  if (/^(\d)\1+$/.test(digits)) return true;
  if (digits === "1234567890" || digits === "0123456789") return true;

  // Known fake / test prefixes used by spam farms
  const fakePrefixes = ["0000", "1111", "9999", "555555"];
  if (fakePrefixes.some((p) => digits.startsWith(p))) return true;

  return false;
};

module.exports = {
  normalizePhone,
  isDisposablePhone,
};
