require("dotenv").config(); //dot env imported
const jwt = require("jsonwebtoken");
const response = require('../helper/responsehelper');
require("dotenv").config();

exports.tokenVerification = (req, res, next) => {
  let tok;
  const auth = req.headers['authorization'];
  if (!auth) {
    return response.error(res, {
        statusCode: 400,
        message: "Access Token Not Found",
      });
  } else {
    tok = auth.split(" ")[1];
    jwt.verify(tok, process.env.SECRET_KEY, (error, payload) => {
      if (error) {
        return response.error(res, {
            statusCode: 401,
            message: "Invalid Access Token",
          });
      } else {
        req.loggedInUser = payload;
        next();
      }
    });
  }
};

