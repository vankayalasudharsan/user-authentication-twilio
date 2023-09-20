
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Middleware for parsing JSON requests
app.use(bodyParser.json());

const {
  userRegistration,
  userAuthentication,
  users
} = require('./routes/index');

// Imported Routes From Routes Floder
app.use('/user-registration',userRegistration) //user singup or registration routes
app.use('/user-authentication',userAuthentication)//user Authentication Routes
app.use('/users',users)//After Login To See List Of Registered Users Route

app.get("/", (req, res) => {
  res.send("Sudharsan Server Is Running");
});

const port = process.env.APP_PORT || 4000;

//server Initiation
app.listen(port, () => {
  console.log(`Server Url http://localhost:${port}`);
});
