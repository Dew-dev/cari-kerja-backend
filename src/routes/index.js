const users = require("./users");
const recruiters = require("./recruiters");
const workers = require("./workers");
const workExperience = require("./work_experiences");
const certifications = require("./certifications");
const workerSkills = require("./worker_skills");
const skills = require("./skills");
const education = require("./educations");
const language = require("./languages");

module.exports = (server) => {
  users(server);
  recruiters(server);
  workExperience(server);
  workers(server);
  certifications(server);
  workerSkills(server);
  skills(server);
  education(server);
  language(server);
};
