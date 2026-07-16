/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.js"],
  collectCoverageFrom: [
    "src/modules/categories/**/*.js",
    "src/modules/certifications/**/*.js",
    "src/modules/contact_us/**/*.js",
    "src/modules/educations/**/*.js",
    "src/modules/employment_types/**/*.js",
    "src/modules/experience_levels/**/*.js",
    "src/modules/genders/**/*.js",
    "src/modules/industries/**/*.js",
    "!src/modules/**/command.js",
    "!src/modules/**/query.js",
  ],
  coverageDirectory: "test/coverage",
  clearMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: ["<rootDir>/test/setup/jest.setup.js"],
  modulePathIgnorePatterns: ["<rootDir>/node_modules/"],
};
