/**
 * Python CV bridge smoke test (requires local python + pdfplumber).
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  isPythonResumeParserEnabled,
  parseWithPythonResumeParser,
  resolvePythonScriptPath,
} = require("../../../src/modules/cv-parsing/services/cv_python_parser");

describe("python resume parser bridge", () => {
  it("exposes script path and optional enable flag", () => {
    expect(typeof isPythonResumeParserEnabled()).toBe("boolean");
    expect(fs.existsSync(resolvePythonScriptPath())).toBe(true);
  });

  it("parses a minimal PDF via python heuristics", async () => {
    const samplePdf = path.join(os.tmpdir(), `cv-python-bridge-${Date.now()}.pdf`);
    const pdf = `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length 320 >>stream
BT /F1 12 Tf 72 720 Td (Andi Wijaya) Tj 0 -18 Td (andi@email.com) Tj 0 -18 Td (081298765432) Tj 0 -28 Td (Professional Experience) Tj 0 -18 Td (Backend Developer Jan 2020 - Present) Tj 0 -18 Td (Toko Inc.) Tj 0 -28 Td (Skills) Tj 0 -18 Td (Backend: Node.js, PostgreSQL) Tj ET
endstream
endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000638 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
707
%%EOF
`;
    fs.writeFileSync(samplePdf, pdf);

    try {
      const parsed = await parseWithPythonResumeParser(samplePdf);
      expect(parsed.personal_info).toBeTruthy();
      expect(
        parsed.personal_info.email === "andi@email.com" || Boolean(parsed.personal_info.full_name)
      ).toBe(true);
      expect(Array.isArray(parsed.skills)).toBe(true);
    } finally {
      fs.unlinkSync(samplePdf);
    }
  }, 60000);
});
