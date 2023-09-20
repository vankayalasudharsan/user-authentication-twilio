const userRegistration = require("./userRegistration/userRegistration");
const userAuthentication = require("./authentication/authroute");
const users = require("./Users/usersroute");

module.exports = { userRegistration, userAuthentication, users };
