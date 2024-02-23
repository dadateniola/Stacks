const Model = require("../Models/Model");
const Course = require("../Models/Course");
const Methods = require("../Models/Methods");

const showSignPage = (req, res) => {
    res.render('sign');
}

const handleLogin = async (req, res) => {
    const { id, password } = req.body;
    const methods = new Methods(req.body);
    const { invalidKeys } = methods.validateData();

    res.send(invalidKeys);
}

const handleRequestAccess = async (req, res) => {
    const methods = new Methods(req.body);
    const { invalidKeys } = methods.validateData();

    res.send(invalidKeys);
}

const showDashboard = async (req, res) => {
    const semesterCourses = await Course.customSql("SELECT * FROM courses WHERE id IN (SELECT course_id FROM departments_courses WHERE semester = 'first')")

    res.render('dashboard', { semesterCourses });
}

const showResourcesPage = (req, res) => {
    res.render('resources');
}

const showRequestsPage = (req, res) => {
    res.render('requests');
}

const getItems = async (req, res) => {
    const { table } = req.body;

    delete req.body.table;

    const conditions = Object.entries(req.body);

    const course = await Model.find(conditions, table);

    res.json({ course });
}

module.exports = {
    showSignPage, handleLogin, handleRequestAccess, showDashboard,
    showResourcesPage, showRequestsPage, getItems
}