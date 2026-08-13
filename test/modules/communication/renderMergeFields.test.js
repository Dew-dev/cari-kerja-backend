const { renderMergeFields } = require("../../../src/helpers/utils/renderMergeFields");

describe("renderMergeFields", () => {
  it("should replace supported placeholders", () => {
    const result = renderMergeFields("Hi {{candidate_name}}, re: {{job_title}} at {{company_name}}", {
      candidate_name: "Budi",
      job_title: "Developer",
      company_name: "EGI",
    });
    expect(result).toBe("Hi Budi, re: Developer at EGI");
  });

  it("should return empty string for unknown placeholders", () => {
    const result = renderMergeFields("Hello {{unknown_field}}", {});
    expect(result).toBe("Hello ");
  });
});
