const Model = require("../Models/Model");
const Methods = require("../Models/Methods");
const Course = require("../Models/Course");
const User = require("../Models/User");
const Request = require("../Models/Request");
const Notification = require("../Models/Notification");

const showDefaultPage = async (req, res) => {
    if (req.session.uid) {
        const semesterCourses = await Course.customSql("SELECT * FROM courses WHERE id IN (SELECT course_id FROM departments_courses WHERE semester = 'first')")

        res.render('dashboard', { semesterCourses });
    } else res.render("sign", { alert: { message: 'Login to gain access', type: 'warning' } })
}

const handleLogin = async (req, res) => {
    try {
        //Validate user information
        const methods = new Methods(req.body);
        const { invalidKeys } = methods.validateData();

        //Check if there is invalid data to send back to user
        if (Object.keys(invalidKeys).length > 0) return res.send({ invalidKeys });

        //Check if user exists
        const { id, password } = req.body;
        const [user] = await User.find(['id', id]);

        //Verify password to proceed or send warning
        if (password == user?.password) {
            //Assign user id to the session
            req.session.uid = id;

            res.status(200).send({ url: "/" });
        } else {
            res.status(401).send({ message: 'Invalid login credentials', type: 'warning' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Internal server error, please try again', type: 'error' });
    }
}

const handleRequestAccess = async (req, res) => {
    try {
        //Validate user information
        const methods = new Methods(req.body);
        const { invalidKeys } = methods.validateData();

        //Check if there is invalid data to send back to user
        if (Object.keys(invalidKeys).length > 0) return res.send({ invalidKeys });

        //Prepare "request" data
        const { id, name, email } = req.body;
        const data = {
            sender: id,
            receiver: 'admin',
            message: `Access request received from ${Methods.capitalize(name)}`,
            extra_info: email,
            type: 'access'
        }

        //Check if "request" data already exists to throw a warning
        const sameRequest = await Request.find([['sender', id], ['type', 'access']]);

        if (sameRequest.length) return res.status(409).send({
            message: "Oops! It looks like you've already submitted a similar request, please wait for a response",
            type: 'warning'
        });

        //Add request to database
        const request = new Request(data);
        await request.add();

        //Get users to be notified
        const admins = await User.find(['role', 'admin']);

        //Prepare "notification" data
        const columns = ['content_id', 'user_id', 'type'];
        const content = admins.map(admin => [
            request.id,
            admin.id,
            'request'
        ]);

        //Add a notification for each eligible user
        const notification = new Notification({ columns, values: content });
        await notification.multiAdd();

        res.status(200).send({
            message: "Access request has been successfully submitted. You will be notified once it is processed.",
            type: "success"
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Internal server error, please try again', type: 'error' });
    }
}

const showResourcesPage = async (req, res) => {
    // const resources = await 

    res.render('resources');
}

const showRequestsPage = async (req, res) => {
    const requests = await Request.find([['receiver', 'admin']]);
    const types = {};

    requests.forEach(request => {
        const { type } = request;
        types[type] = (types[type] || 0) + 1;
    });

    res.render('requests', { requests, types });
}

const getItems = async (req, res) => {
    const { table } = req.body;

    delete req.body.table;

    const conditions = Object.entries(req.body);

    const course = await Model.find(conditions, table);

    res.json({ course });
}

const handleUpload = async (req, res) => {
    const { pdfFile } = req.files;

    if (!pdfFile || pdfFile.mimetype !== 'application/pdf') {
        return res.status(400).send({ message: 'You can only upload a valid PDF file', type: 'error' });
    }

    console.log(pdfFile);
    res.status(200).send('File uploaded successfully.');
}

module.exports = {
    showDefaultPage, handleLogin, handleRequestAccess,
    showResourcesPage, showRequestsPage, getItems,
    handleUpload
}