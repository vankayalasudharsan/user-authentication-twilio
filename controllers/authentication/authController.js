require("dotenv").config(); //dot env imported
const db = require("../../models/index"); //imported db from models
const { where, Op } = require("sequelize");
const response = require("../../helper/responsehelper"); //response hepler imported from helper file
const twilio = require("twilio"); //twilio third party package for sending otps for mobile numbers
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Twilio Credentials Imported From Dontenv file
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const verifySid = process.env.VERIFY_SID;
const client = require("twilio")(accountSid, authToken);

exports.login = async (req, res) => {
  const { phone_number, password } = req.body;

  if (!phone_number) {
    return response.error(res, {
      statusCode: 400,
      message: "Missing Phone Number",
    });
  }

  const regex = /^\+\d{12}$/;

  if (!regex.test(phone_number)) {
    return response.error(res, {
      statusCode: 400,
      message:
        "Invalid Phone Number Format Should be +91XXXXXXXXXX And all should be Numericals",
    });
  }

  try {
    const fetchUser = await db.User.findOne({
      where: {
        phone_number: phone_number,
      },
    });

    if (!fetchUser) {
      return response.error(res, {
        statusCode: 400,
        message: "No User Found Registered With That Mobile Number",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, fetchUser.password);
    if (!isPasswordValid) {
      return response.error(res, {
        statusCode: 400,
        message: "Invalid Password",
      });
    }

    const payload = {
      id: fetchUser.id,
    };

    const SecretKey = process.env.SECRET_KEY;

    const AccessToken = await jwt.sign(payload, SecretKey);

    return response.success(res, {
      statusCode: 200,
      message: "Login Success",
      data: {
        jwtToken: AccessToken,
      },
    });
  } catch (e) {
    console.error("Error While Login:", error);
    return response.error(res, {
      statusCode: 500,
      message: "Something Went Wrong",
    });
  }
};

exports.sendOtp = async (req, res) => {
  const { phone_number } = req.body;

  // Validation error for required data missing
  if (!phone_number) {
    return response.error(res, {
      statusCode: 400,
      message: "Missing Phone Number",
    });
  }

  const regex = /^\+\d{12}$/;

  if (!regex.test(phone_number)) {
    return response.error(res, {
      statusCode: 400,
      message:
        "Invalid Phone Number Format Should be +91XXXXXXXXXX And all should be Numericals",
    });
  }

  const isUserRegisteredAlready = await db.User.findOne({
    where: {
      phone_number: phone_number,
    },
  });

  if (!isUserRegisteredAlready) {
    return response.error(res, {
      statusCode: 400,
      message: "NO User Found Registered With That Mobile Number",
    });
  }

  // using try catch error handling to avoid server crash
  try {
    // twilio verification and sends otp
    const to = phone_number;
    await client.verify.v2.services(verifySid).verifications.create({
      channel: "sms",
      to,
    });

    // success response and otp sent to particular mobile number given in request
    return response.success(res, {
      statusCode: 200,
      message: "Otp Sent Successfully",
    });
  } catch (error) {
    // error response
    console.error("Error sending OTP:", error);
    return response.error(res, {
      statusCode: 500,
      message: "Something Went Wrong",
    });
  }
};

exports.verifyOtp = async (req, res) => {
  const { phone_number, otpCode } = req.body;

  //All Required Validations
  if (!phone_number) {
    return response.error(res, {
      statusCode: 400,
      message: "Missing otp or otp token",
    });
  }

  const regex = /^\+\d{12}$/;

  if (!regex.test(phone_number)) {
    return response.error(res, {
      statusCode: 400,
      message:
        "Invalid Phone Number Format Should be +91XXXXXXXXXX And all should be Numericals",
    });
  }

  if (!otpCode || otpCode === "") {
    return response.error(res, {
      statusCode: 400,
      message: "Missing otp or otp token",
    });
  }

  try {
    const to = phone_number;

    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to, code: otpCode });

    if (verificationCheck.status === "approved") {
      const registeredUser = await db.User.findOne({
        where: {
          phone_number: phone_number,
        },
      });

      const payload = {
        id: registeredUser.id,
      };

      const SecretKey = process.env.SECRET_KEY;

      const AccessToken = await jwt.sign(payload, SecretKey);

      return response.success(res, {
        statusCode: 200,
        message: "Otp Verified And Login Success",
        data: {
          jwtToken: AccessToken,
        },
      });
    } else {
      return response.error(res, {
        statusCode: 400,
        message: "Invalid Otp",
      });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return response.error(res, {
      statusCode: 500,
      message: "Something Went Wrong",
    });
  }
};
