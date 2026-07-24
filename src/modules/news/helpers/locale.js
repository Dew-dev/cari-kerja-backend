const SUPPORTED_LOCALES = ["id", "en"];
const DEFAULT_LOCALE = "id";

/**
 * Normalize Accept-Language / query locale to a supported code.
 * @param {string|undefined|null} raw
 * @returns {string}
 */
function resolveLocale(raw) {
  if (!raw || typeof raw !== "string") return DEFAULT_LOCALE;
  const primary = raw.trim().toLowerCase().split(",")[0].split("-")[0].split("_")[0];
  if (SUPPORTED_LOCALES.includes(primary)) return primary;
  return DEFAULT_LOCALE;
}

/**
 * Pick translation row for requested locale with fallback to default.
 * @param {Array<{locale: string}>} rows
 * @param {string} requested
 * @returns {{ row: object|null, locale: string, locale_resolved: string }}
 */
function pickTranslation(rows, requested) {
  const locale = resolveLocale(requested);
  const list = Array.isArray(rows) ? rows : [];
  const exact = list.find((r) => r.locale === locale);
  if (exact) {
    return { row: exact, locale, locale_resolved: locale };
  }
  const fallback = list.find((r) => r.locale === DEFAULT_LOCALE) || list[0] || null;
  return {
    row: fallback,
    locale,
    locale_resolved: fallback ? fallback.locale : locale,
  };
}

/**
 * Normalize create/update payload into translations map.
 * Supports flat title/body as shorthand for locale `id`.
 * @param {object} payload
 * @returns {{ ok: true, translations: object } | { ok: false, error: string }}
 */
function normalizeTranslationsPayload(payload) {
  let translations = payload.translations;
  if (!translations || typeof translations !== "object" || Array.isArray(translations)) {
    if (payload.title || payload.body) {
      translations = {
        [DEFAULT_LOCALE]: {
          title: payload.title,
          slug: payload.slug,
          excerpt: payload.excerpt,
          body: payload.body,
          meta_title: payload.meta_title,
          meta_description: payload.meta_description,
        },
      };
    } else {
      return { ok: false, error: "translations is required (or provide title and body)" };
    }
  }

  const cleaned = {};
  for (const [loc, fields] of Object.entries(translations)) {
    const locale = resolveLocale(loc);
    if (!SUPPORTED_LOCALES.includes(locale)) continue;
    if (!fields || typeof fields !== "object") continue;
    cleaned[locale] = {
      title: fields.title,
      slug: fields.slug,
      excerpt: fields.excerpt,
      body: fields.body,
      meta_title: fields.meta_title,
      meta_description: fields.meta_description,
    };
  }

  if (!Object.keys(cleaned).length) {
    return { ok: false, error: "at least one supported locale translation is required" };
  }

  return { ok: true, translations: cleaned };
}

function normalizeCategoryTranslationsPayload(payload) {
  let translations = payload.translations;
  if (!translations || typeof translations !== "object" || Array.isArray(translations)) {
    if (payload.name) {
      translations = {
        [DEFAULT_LOCALE]: {
          name: payload.name,
          slug: payload.slug,
        },
      };
    } else {
      return { ok: false, error: "translations is required (or provide name)" };
    }
  }

  const cleaned = {};
  for (const [loc, fields] of Object.entries(translations)) {
    const locale = resolveLocale(loc);
    if (!SUPPORTED_LOCALES.includes(locale)) continue;
    if (!fields || typeof fields !== "object") continue;
    cleaned[locale] = {
      name: fields.name,
      slug: fields.slug,
    };
  }

  if (!Object.keys(cleaned).length) {
    return { ok: false, error: "at least one supported locale translation is required" };
  }

  return { ok: true, translations: cleaned };
}

module.exports = {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  resolveLocale,
  pickTranslation,
  normalizeTranslationsPayload,
  normalizeCategoryTranslationsPayload,
};
