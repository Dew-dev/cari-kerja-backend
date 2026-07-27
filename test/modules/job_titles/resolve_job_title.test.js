const {
  resolveJobTitle,
  normalizeName,
} = require("../../../src/modules/job_titles/helpers/resolve_job_title");

describe("resolveJobTitle", () => {
  it("normalizes whitespace and trim", () => {
    expect(normalizeName("  Senior   Developer  ")).toBe("Senior Developer");
  });

  it("returns existing row by id without insert", async () => {
    const existing = {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Backend Engineer",
      slug: "backend-engineer",
    };
    const db = {
      executeQuery: jest.fn().mockResolvedValueOnce({ rows: [existing] }),
    };

    const result = await resolveJobTitle({ id: existing.id }, db);

    expect(result).toEqual(existing);
    expect(db.executeQuery).toHaveBeenCalledTimes(1);
    expect(db.executeQuery.mock.calls[0][0]).toMatch(/WHERE id = \$1/);
  });

  it("dedupes by slug: second create with same name hits ON CONFLICT path once", async () => {
    const row = {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Product Manager",
      slug: "product-manager",
    };
    const db = {
      executeQuery: jest
        .fn()
        // first call: no existing by slug
        .mockResolvedValueOnce({ rows: [] })
        // insert returning
        .mockResolvedValueOnce({ rows: [row] })
        // second resolve: found by slug
        .mockResolvedValueOnce({ rows: [row] }),
    };

    const first = await resolveJobTitle({ name: "Product Manager" }, db);
    const second = await resolveJobTitle({ name: "  product   manager " }, db);

    expect(first).toEqual(row);
    expect(second).toEqual(row);
    expect(db.executeQuery.mock.calls[1][0]).toMatch(/ON CONFLICT \(slug\)/);
    // second resolve should SELECT by slug only (no insert)
    expect(db.executeQuery.mock.calls[2][0]).toMatch(/WHERE slug = \$1/);
    expect(db.executeQuery).toHaveBeenCalledTimes(3);
  });

  it("returns null when neither id nor name provided", async () => {
    const db = { executeQuery: jest.fn() };
    const result = await resolveJobTitle({}, db);
    expect(result).toBeNull();
    expect(db.executeQuery).not.toHaveBeenCalled();
  });
});
