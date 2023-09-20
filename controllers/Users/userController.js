require("dotenv").config(); //dot env imported
const db = require("../../models/index"); //imported db from models
const { where, Op } = require("sequelize");
const response = require("../../helper/responsehelper");

exports.list = async (req, res) => {
  try {
    //fetching users list from db
    const allUsersList = await db.User.findAll();

    //No User Found Response
    if (allUsersList.length === 0) {
      return response.success(res, {
        statusCode: 200,
        message: "No Users Found",
      });
    }

    //Success Response And All Users List AsResponse
    return response.success(res, {
      statusCode: 200,
      message: "Registered Users List Fetched Successfully",
      data: allUsersList,
    });
  } catch (e) {
    console.log("Error While Fecthing User List :", e);
    return response.error(res, {
      statusCode: 500,
      message: "Something Went Woring",
    });
  }
};
