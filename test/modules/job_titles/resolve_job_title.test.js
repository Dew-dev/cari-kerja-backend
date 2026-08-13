const {
  resolveJobTitle,
  normalizeName,
  JobTitleResolveError,
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
      category_id: 1,
    };
    const db = {
      executeQuery: jest.fn().mockResolvedValueOnce({ rows: [existing] }),
    };

    const result = await resolveJobTitle(
      { id: existing.id, category_id: 1 },
      db
    );

    expect(result).toEqual(existing);
    expect(db.executeQuery).toHaveBeenCalledTimes(1);
    expect(db.executeQuery.mock.calls[0][0]).toMatch(/WHERE id = \$1/);
  });

  it("rejects category mismatch on existing title", async () => {
    const existing = {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Backend Engineer",
      slug: "backend-engineer",
      category_id: 1,
    };
    const db = {
      executeQuery: jest.fn().mockResolvedValueOnce({ rows: [existing] }),
    };

    await expect(
      resolveJobTitle({ id: existing.id, category_id: 5 }, db)
    ).rejects.toMatchObject({
      name: "JobTitleResolveError",
      code: "JOB_TITLE_CATEGORY_MISMATCH",
    });
  });

  it("requires category_id when creating a new title", async () => {
    const db = {
      executeQuery: jest.fn().mockResolvedValueOnce({ rows: [] }),
    };

    await expect(
      resolveJobTitle({ name: "Brand New Role" }, db)
    ).rejects.toBeInstanceOf(JobTitleResolveError);
  });

  it("creates title with category_id and dedupes by slug", async () => {
    const row = {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Product Manager",
      slug: "product-manager",
      category_id: 10,
    };
    const db = {
      executeQuery: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [row] })
        .mockResolvedValueOnce({ rows: [row] }),
    };

    const first = await resolveJobTitle(
      { name: "Product Manager", category_id: 10 },
      db
    );
    const second = await resolveJobTitle(
      { name: "  product   manager ", category_id: 10 },
      db
    );

    expect(first).toEqual(row);
    expect(second).toEqual(row);
    expect(db.executeQuery.mock.calls[1][0]).toMatch(/ON CONFLICT \(slug\)/);
    expect(db.executeQuery.mock.calls[1][1]).toEqual(
      expect.arrayContaining([10])
    );
    expect(db.executeQuery.mock.calls[2][0]).toMatch(/WHERE slug = \$1/);
    expect(db.executeQuery).toHaveBeenCalledTimes(3);
  });

  it("assigns category when existing title has null category_id", async () => {
    const existing = {
      id: "33333333-3333-3333-3333-333333333333",
      name: "Analyst",
      slug: "analyst",
      category_id: null,
    };
    const updated = { ...existing, category_id: 2 };
    const db = {
      executeQuery: jest
        .fn()
        .mockResolvedValueOnce({ rows: [existing] })
        .mockResolvedValueOnce({ rows: [updated] }),
    };

    const result = await resolveJobTitle(
      { id: existing.id, category_id: 2 },
      db
    );

    expect(result).toEqual(updated);
    expect(db.executeQuery.mock.calls[1][0]).toMatch(/UPDATE job_titles/);
  });

  it("returns null when neither id nor name provided", async () => {
    const db = { executeQuery: jest.fn() };
    const result = await resolveJobTitle({}, db);
    expect(result).toBeNull();
    expect(db.executeQuery).not.toHaveBeenCalled();
  });
});
