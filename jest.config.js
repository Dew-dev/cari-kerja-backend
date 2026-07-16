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
    "!src/modules/**/command.js",
    "!src/modules/**/query.js",
  ],
  coverageDirectory: "test/coverage",
  clearMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: ["<rootDir>/test/setup/jest.setup.js"],
  modulePathIgnorePatterns: ["<rootDir>/node_modules/"],
};
