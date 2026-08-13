const {
  resolveLocale,
  normalizeNameTranslationsPayload,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
} = require("../../src/helpers/i18n/locale");

describe("shared i18n locale helper", () => {
  it("supports id en ru uz", () => {
    expect(SUPPORTED_LOCALES).toEqual(["id", "en", "ru", "uz"]);
    expect(resolveLocale("uz")).toBe("uz");
    expect(resolveLocale("ru-RU")).toBe("ru");
    expect(DEFAULT_LOCALE).toBe("id");
  });

  it("normalizes flat name and translations map", () => {
    const flat = normalizeNameTranslationsPayload({ name: "Teknologi" });
    expect(flat.ok).toBe(true);
    expect(flat.translations.id.name).toBe("Teknologi");

    const multi = normalizeNameTranslationsPayload({
      translations: {
        id: { name: "Teknologi Informasi" },
        en: { name: "Information Technology" },
        ru: { name: "IT" },
        uz: { name: "IT" },
      },
    });
    expect(multi.ok).toBe(true);
    expect(Object.keys(multi.translations).sort()).toEqual(["en", "id", "ru", "uz"]);
  });
});
