const Course = require("../Models/Course");

const showSignPage = (req, res) => {
    res.render('sign');
}

const showDashboard = async (req, res) => {
    const semesterCourses = await Course.customSql("SELECT * FROM courses WHERE id IN (SELECT course_id FROM departments_courses WHERE semester = 'first')")
    
    res.render('dashboard', { semesterCourses });
}

module.exports = {
    showSignPage, showDashboard
}