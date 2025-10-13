const users = require("./users");
const recruiters = require("./recruiters");
const workExperience = require("./work_experiences");

module.exports = (server) => {
  users(server);
  recruiters(server);
  workExperience(server);
};
