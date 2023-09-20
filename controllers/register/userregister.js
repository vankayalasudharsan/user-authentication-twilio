require("dotenv").config(); //dot env imported
const db = require("../../models/index"); //imported db from models
const { where, Op } = require("sequelize");
const response = require("../../helper/responsehelper"); //response hepler imported from helper file
const twilio = require("twilio"); //twilio third party package for sending otps for mobile numbers
const ipModule = require("ip");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { IPinfoWrapper } = require("node-ipinfo");

// Twilio Credentials Imported From Dontenv file
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const verifySid = process.env.VERIFY_SID;
const client = require("twilio")(accountSid, authToken);
const axios = require("axios");

//Controller For Sending Otp
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

  const userIP = ipModule.address();
  const ipData = await axios.get(`https://ipinfo.io/${userIP}/json`);
  const { ip } = ipData.data;

  if (!ip) {
    return response.error(res, {
      statusCode: 400,
      message: "Invalid Request From Invalid Ip Address Device",
    });
  }

  const isUserRegisteredAlready = await db.User.findOne({
    where: {
      phone_number: phone_number,
    },
  });

  if (isUserRegisteredAlready) {
    return response.error(res, {
      statusCode: 400,
      message: "This phone number has already Used For Registartion",
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

// Verify OTP API
exports.VerifyOtp = async (req, res) => {
  const { user_name, password, phone_number, otpCode } = req.body;

  //All Required Validations
  if (!user_name || user_name === "") {
    return response.error(res, {
      statusCode: 400,
      message: "Missing Username",
    });
  }

  if (!password || password === "") {
    return response.error(res, {
      statusCode: 400,
      message: "Missing Username",
    });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(password)) {
    return response.error(res, {
      statusCode: 400,
      message:
        "password should contain only uppercase letters, lowercase letters, digits, and the specified special characters, with a minimum length of 8 characters",
    });
  }

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

  const userIP = ipModule.address();
  const ipData = await axios.get(`https://ipinfo.io/${userIP}/json`);
  const { ip } = ipData.data;

  if (!ip) {
    return response.error(res, {
      statusCode: 400,
      message: "Invalid Request From Invalid Ip Address Device",
    });
  }

  try {
    const to = phone_number;

    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to, code: otpCode });

    if (verificationCheck.status === "approved") {
      const encryptedPassword = await bcrypt.hash(password, 10);

      const registeredUser = await db.User.create({
        user_name: user_name,
        ip_address: ip,
        password: encryptedPassword,
        phone_number: phone_number,
        otp: otpCode,
      });

      const payload = {
        id: registeredUser.id,
      };

      const SecretKey = process.env.SECRET_KEY;

      const AccessToken = await jwt.sign(payload, SecretKey);

      return response.success(res, {
        statusCode: 200,
        message: "Otp Verified",
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
