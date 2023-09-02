//The below code implementation was performed in participation of:
//Dada Teniola Emmanuel
//Baiyere Samuel Fikayo

//Initialize project dependencies
require("dotenv").config();
const express = require("express");
const session = require('express-session');
const path = require("path");
const clientRoutes = require("./routes/clientRoutes")

//Setup parameters
const app = express();
const port = process.env.PORT || 3000;

//Setup project middlewares
//-----------------------------------------------------------------

//Session
var sess = {
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {}
}
if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
}
app.use(session(sess))

//Express
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "assets")));

//EJS
app.set("view engine", "ejs");
app.set("views", "pages");

//-----------------------------------------------------------------


//Project Routes
app.use(clientRoutes);


//Start app and listen on a specified port
app.listen(port, (err) =>
  console.log(
    err ||
      `Localhost: http://localhost:${port}/\nServer listening on port ${port}`
  )
);