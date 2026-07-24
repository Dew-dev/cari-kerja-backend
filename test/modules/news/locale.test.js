const {
  resolveLocale,
  pickTranslation,
  normalizeTranslationsPayload,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
} = require("../../../src/modules/news/helpers/locale");

describe("news locale helper", () => {
  it("resolves supported locales and defaults unknown to id", () => {
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("en-US")).toBe("en");
    expect(resolveLocale("id-ID")).toBe("id");
    expect(resolveLocale("fr")).toBe("id");
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(SUPPORTED_LOCALES).toEqual(["id", "en"]);
  });

  it("picks exact translation or falls back to id", () => {
    const rows = [
      { locale: "id", title: "Judul" },
      { locale: "en", title: "Title" },
    ];
    expect(pickTranslation(rows, "en").locale_resolved).toBe("en");
    expect(pickTranslation(rows, "en").row.title).toBe("Title");
    expect(pickTranslation([{ locale: "id", title: "Judul" }], "en").locale_resolved).toBe(
      "id"
    );
  });

  it("normalizes flat payload into translations.id", () => {
    const result = normalizeTranslationsPayload({
      title: "Hello",
      body: "<p>World</p>",
    });
    expect(result.ok).toBe(true);
    expect(result.translations.id.title).toBe("Hello");
    expect(result.translations.id.body).toBe("<p>World</p>");
  });
});
