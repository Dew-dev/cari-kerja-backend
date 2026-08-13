/**
 * CV parser sidecar HTTP client (when CV_PARSER_SERVICE_URL is set).
 */
jest.mock("axios", () => ({
  post: jest.fn(),
}));

describe("cv_python_parser remote sidecar", () => {
  let axios;
  let parser;
  const fs = require("fs");
  const os = require("os");
  const path = require("path");

  beforeEach(() => {
    jest.resetModules();
    delete process.env.CV_PARSER_SERVICE_URL;
    delete process.env.CV_PARSER_SERVICE_TOKEN;
    delete process.env.CV_PYTHON_BIN;

    axios = require("axios");
    axios.post.mockReset();
    parser = require("../../../src/modules/cv-parsing/services/cv_python_parser");
  });

  it("isRemoteParserEnabled is false without URL", () => {
    expect(parser.isRemoteParserEnabled()).toBe(false);
  });

  it("parseWithPythonResumeParser posts to /v1/parse when URL is set", async () => {
    process.env.CV_PARSER_SERVICE_URL = "http://127.0.0.1:5101/";
    process.env.CV_PARSER_SERVICE_TOKEN = "secret";
    jest.resetModules();
    axios = require("axios");
    axios.post.mockResolvedValue({
      data: {
        personal_info: { name: "Ada" },
        work_experiences: [],
        educations: [],
        skills: ["JS"],
        _meta: { source: "sidecar" },
      },
    });
    parser = require("../../../src/modules/cv-parsing/services/cv_python_parser");

    const tmp = path.join(os.tmpdir(), `cv-sidecar-test-${Date.now()}.pdf`);
    fs.writeFileSync(tmp, Buffer.from("%PDF-1.4 fake"));
    try {
      const result = await parser.parseWithPythonResumeParser(tmp);
      expect(result.personal_info.name).toBe("Ada");
      expect(result.skills).toEqual(["JS"]);
      expect(axios.post).toHaveBeenCalledWith(
        "http://127.0.0.1:5101/v1/parse",
        expect.objectContaining({
          filename: path.basename(tmp),
          file_base64: expect.any(String),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer secret",
          }),
        })
      );
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it("extractTextWithPython posts to /v1/extract-text when URL is set", async () => {
    process.env.CV_PARSER_SERVICE_URL = "http://cv-parser:5101";
    jest.resetModules();
    axios = require("axios");
    axios.post.mockResolvedValue({ data: { text: "hello from pdf" } });
    parser = require("../../../src/modules/cv-parsing/services/cv_python_parser");

    const tmp = path.join(os.tmpdir(), `cv-sidecar-text-${Date.now()}.pdf`);
    fs.writeFileSync(tmp, Buffer.from("%PDF-1.4 fake"));
    try {
      const text = await parser.extractTextWithPython(tmp);
      expect(text).toBe("hello from pdf");
      expect(axios.post.mock.calls[0][0]).toBe("http://cv-parser:5101/v1/extract-text");
    } finally {
      fs.unlinkSync(tmp);
    }
  });
});
