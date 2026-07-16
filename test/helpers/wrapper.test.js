const wrapper = require("../../src/helpers/utils/wrapper");

describe("wrapper.buildPaginationMeta", () => {
  it("should build valid meta from numeric total", () => {
    const meta = wrapper.buildPaginationMeta(1, 10, 25);

    expect(meta).toEqual({
      page: 1,
      per_page: 10,
      total_data: 25,
      total_pages: 3,
    });
  });

  it("should parse string total from database", () => {
    const meta = wrapper.buildPaginationMeta(2, 10, "15");

    expect(meta.total_data).toBe(15);
    expect(meta.total_pages).toBe(2);
  });

  it("should default invalid total to zero instead of null or NaN", () => {
    const meta = wrapper.buildPaginationMeta(1, 10, null);

    expect(meta.total_data).toBe(0);
    expect(meta.total_pages).toBe(0);
    expect(Number.isNaN(meta.total_data)).toBe(false);
    expect(Number.isNaN(meta.total_pages)).toBe(false);
  });

  it("should handle undefined and empty string total", () => {
    expect(wrapper.buildPaginationMeta(1, 10, undefined).total_data).toBe(0);
    expect(wrapper.buildPaginationMeta(1, 10, "").total_data).toBe(0);
  });

  it("should serialize to JSON without null numeric fields", () => {
    const meta = wrapper.buildPaginationMeta(1, 10, null);
    const parsed = JSON.parse(JSON.stringify(meta));

    expect(parsed.total_data).toBe(0);
    expect(parsed.total_pages).toBe(0);
    expect(parsed.total_data).not.toBeNull();
    expect(parsed.total_pages).not.toBeNull();
  });
});
