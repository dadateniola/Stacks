require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fileUpload = require("express-fileupload");
const path = require('path');
const mainRoutes = require('./routes/mainRoutes');

const port = process.env.PORT || 5000;

const server = express();

//Setup session
var sess = {
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {}
}

if (server.get('env') === 'production') {
    server.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
}

//Collect POST data
server.use(express.json());

server.use(session(sess));

//Serving static files
server.use(express.static(path.join(__dirname, 'assets')));
server.use(express.static(path.join(__dirname, 'uploads')));

//Setup file upload
server.use(fileUpload());

//Setup ejs
server.set('view engine', 'ejs');
server.set('views', 'pages');

server.use(mainRoutes);

server.use((req, res) => {
    res.status(404).render("404", {
        error_alert: {
            message: 'Page Not Found',
            type: 'error'
        }
    });
})

//Startup the server on a port
server.listen(port, (err) => console.log(err || `Server Running\nVisit http://localhost:${port}/`))