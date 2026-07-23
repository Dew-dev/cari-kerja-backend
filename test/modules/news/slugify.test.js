const { slugify } = require("../../../src/modules/news/helpers/slugify");

describe("news slugify", () => {
  it("normalizes titles to url-safe slugs", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
    expect(slugify("  Tips Karir 2026  ")).toBe("tips-karir-2026");
    expect(slugify("")).toBe("item");
  });
});
