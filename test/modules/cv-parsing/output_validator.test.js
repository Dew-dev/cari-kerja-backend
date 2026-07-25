/**
 * Unit tests for the CV output validator / sanitizer.
 */

"use strict";

const {
  validateCvOutput,
  MAX_WORK_EXPERIENCES,
  MAX_EDUCATIONS,
  MAX_SKILLS,
  MAX_STRING_LEN,
} = require("../../../src/modules/cv-parsing/validators/cv_output_validator");

function baseValid() {
  return {
    personal_info: { name: "Budi", email: "budi@example.com" },
    work_experiences: [{ company: "PT Maju", position: "Staff" }],
    educations: [{ institution: "UI" }],
    skills: ["JavaScript", "Node"],
  };
}

describe("validateCvOutput", () => {
  test("passes a valid object and returns cleaned shape", () => {
    const out = validateCvOutput(baseValid());
    expect(out.personal_info).toEqual({ name: "Budi", email: "budi@example.com" });
    expect(out.work_experiences).toHaveLength(1);
    expect(out.educations).toHaveLength(1);
    expect(out.skills).toEqual(["JavaScript", "Node"]);
  });

  test("accepts personal_info as null and normalizes undefined to null", () => {
    const withNull = Object.assign(baseValid(), { personal_info: null });
    expect(validateCvOutput(withNull).personal_info).toBeNull();

    const withUndefined = baseValid();
    delete withUndefined.personal_info;
    expect(validateCvOutput(withUndefined).personal_info).toBeNull();
  });

  test("throws AI_OUTPUT_INVALID when not an object", () => {
    expect(() => validateCvOutput(null)).toThrow(/object/i);
    expect(() => validateCvOutput("str")).toMatchObject;
    try {
      validateCvOutput(42);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e.code).toBe("AI_OUTPUT_INVALID");
    }
  });

  test("throws when required keys missing or wrong type", () => {
    const missing = baseValid();
    delete missing.work_experiences;
    expect(() => validateCvOutput(missing)).toThrow();

    const wrong = baseValid();
    wrong.skills = "not-array";
    try {
      validateCvOutput(wrong);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e.code).toBe("AI_OUTPUT_INVALID");
    }

    const badPersonal = baseValid();
    badPersonal.personal_info = ["array-not-allowed"];
    try {
      validateCvOutput(badPersonal);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e.code).toBe("AI_OUTPUT_INVALID");
    }
  });

  test("strips <script> and <style> tags with contents", () => {
    const dirty = baseValid();
    dirty.personal_info = {
      name: 'Budi<script>alert("x")</script>',
      bio: 'Hello<style>.a{color:red}</style>World',
    };
    const out = validateCvOutput(dirty);
    expect(out.personal_info.name).toBe("Budi");
    expect(out.personal_info.bio).toBe("HelloWorld");
    expect(out.personal_info.name).not.toContain("script");
  });

  test("strips control characters but keeps newlines", () => {
    const dirty = baseValid();
    dirty.personal_info = { note: "line1\nline2\u0000\u0007end" };
    const out = validateCvOutput(dirty);
    expect(out.personal_info.note).toBe("line1\nline2end");
  });

  test("truncates over-long strings instead of throwing", () => {
    const dirty = baseValid();
    dirty.personal_info = { bio: "a".repeat(MAX_STRING_LEN + 500) };
    const out = validateCvOutput(dirty);
    expect(out.personal_info.bio.length).toBe(MAX_STRING_LEN);
  });

  test("truncates oversized arrays", () => {
    const big = baseValid();
    big.work_experiences = Array.from({ length: MAX_WORK_EXPERIENCES + 10 }, () => ({
      company: "X",
    }));
    big.educations = Array.from({ length: MAX_EDUCATIONS + 5 }, () => ({ institution: "Y" }));
    big.skills = Array.from({ length: MAX_SKILLS + 50 }, (_, i) => "skill" + i);

    const out = validateCvOutput(big);
    expect(out.work_experiences).toHaveLength(MAX_WORK_EXPERIENCES);
    expect(out.educations).toHaveLength(MAX_EDUCATIONS);
    expect(out.skills).toHaveLength(MAX_SKILLS);
  });
});
