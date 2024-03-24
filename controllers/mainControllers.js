const path = require('path');
const fs = require('fs').promises;

const Model = require("../Models/Model");
const Methods = require("../Models/Methods");
const Course = require("../Models/Course");
const User = require("../Models/User");
const Request = require("../Models/Request");
const Notification = require("../Models/Notification");
const Resource = require("../Models/Resource.js");
const CourseLecturer = require("../Models/CourseLecturer");
const History = require("../Models/History");
const Collection = require("../Models/Collection");
const CollectionResource = require("../Models/CollectionResource.js");
const Department = require("../Models/Department.js");

const DEFAULT_USER_ID = '12345678';

const tempFolder = path.resolve(__dirname, '..', 'temp');
const uploadsFolder = path.resolve(__dirname, '..', 'uploads', 'resources');

const error_alert = {
    message: 'Internal Server Error',
    type: 'error'
}

const unauthorized_alert = {
    message: 'Cannot access the requested page',
    type: 'warning'
}

async function getCollections(userCollections = {}) {
    const collections = [];

    for (const collection of userCollections) {
        const [slides] = await Resource.customSql(
            `
            SELECT COUNT(*) AS count FROM resources
            WHERE id IN (
                SELECT resource_id FROM collections_resources
                WHERE collection_id = ${collection.id}
            ) AND type = 'slide';
            `
        );
        const [pqs] = await Resource.customSql(
            `
            SELECT COUNT(*) AS count FROM resources
            WHERE id IN (
                SELECT resource_id FROM collections_resources
                WHERE collection_id = ${collection.id}
            ) AND type = 'past question';
            `
        );

        const data = {
            id: collection.id,
            name: collection.collection_name,
            slides: slides.count,
            pqs: pqs.count,
            added: Methods.formatDate(collection.created_at)
        }

        collections.push(data);
    }

    return collections;
}

const routeSetup = async (req, res, next) => {
    // req.session.uid = DEFAULT_USER_ID;
    const { alert, uid } = req.session;

    if (!uid) {
        req.session.alert = {
            message: "User login is required",
            type: 'warning',
        }
        return res.redirect("/");
    }

    try {
        const [user] = await User.find(['id', uid]);

        const allCourses = await Course.find();
        const allDepartments = await Department.find();
        const allRoles = await User.customSql('SELECT DISTINCT role FROM users');

        //Add-resource overlay data
        const lecturerCourses = await Course.customSql(`SELECT * FROM courses WHERE id IN (SELECT course_id FROM courses_lecturers WHERE lecturer_id = '${uid}')`);
        const filename = Methods.tempFilename(uid);
        const filePath = path.join(tempFolder, filename);
        const previewRoute = (await Methods.checkFileExistence({ filePath })) ? `/get-pdf/${filename}/preview` : null;

        res.locals.data = {
            user,
            lecturerCourses,
            previewRoute,
            allCourses,
            allDepartments,
            allRoles,
        }

        if (alert) {
            res.locals.data.alert = alert;
            delete req.session.alert;
        }

        next();
    } catch (error) {
        console.error('Error in routeSetup:', error);
        res.status(500).render('500', { error_alert });
    }
}

const showSignPage = async (req, res) => {
    const { alert, uid } = req.session;

    if (uid) {
        req.session.alert = {
            message: "You're already logged in",
            type: 'success',
        }
        return res.redirect("/dashboard");
    }

    delete req.session.alert;

    res.render("sign", { data: { alert } });
}

const showDashboard = async (req, res) => {
    const userId = req.session?.uid;

    try {
        const [user_info] = await User.find(['id', userId]);

        var courses = await Course.find([['limit', 10]]);
        var heading = 'courses';

        if (user_info.role == "student") {
            courses = await Course.customSql("SELECT * FROM courses WHERE id IN (SELECT course_id FROM departments_courses WHERE semester = 'first')")
            heading = 'semester courses';
        } else if (user_info.role == "lecturer") {
            courses = await Course.customSql(`SELECT * FROM courses WHERE id IN (SELECT course_id FROM courses_lecturers WHERE lecturer_id = ${userId})`);
            heading = 'courses taken';
        }

        const allCourses = await Course.find();

        const resources = await Resource.find([['order by', 'created_at desc']]);

        const recentlyAdded = [];

        resources.forEach(resource => {
            const courseInfo = allCourses.find(info => info.id == resource.course_id)
            const data = {
                id: resource.id,
                code: courseInfo.code,
                type: resource.type,
                name: Methods.joinedName(resource),
                last_visited: Methods.formatDate(resource.created_at)
            }

            recentlyAdded.push(data);
        })

        const pfp = user_info.pfp;

        res.render('dashboard', { courses, recentlyAdded, pfp, heading });
    } catch (error) {
        console.error('Error in showDashboard:', error);
        res.status(500).render('500', { error_alert });
    }
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

            res.status(200).send({ url: "/dashboard" });
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
        const { id, name, email, message } = req.body;
        const data = {
            sender_id: id,
            sender_name: name,
            receiver: 'admin',
            message: Methods.sentenceCase(message),
            extra_info: email,
            type: 'access'
        }

        //Check if "request" data already exists to throw a warning
        const sameID = await Request.find([['sender_id', id], ['type', 'access']]);
        const IDExists = await User.find([['id', id]]);
        const emailExists = await User.find([['email', email]]);

        if (sameID.length) {
            return res.status(409).send({
                message: "Oops! It looks like you've already submitted a similar request, please wait for a response",
                type: 'warning'
            });
        } else if (IDExists.length) {
            return res.status(409).send({
                message: "The ID is already being used in the system",
                type: 'warning'
            });
        } else if (emailExists.length) {
            return res.status(409).send({
                message: "The email is already being used in the system",
                type: 'warning'
            });
        }

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
            message: "Access request has been successfully submitted. You will be notified once it is processed",
            type: "success"
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Internal server error, please try again', type: 'error' });
    }
}

const showResourcesPage = async (req, res) => {
    const userId = req.session.uid;

    try {
        const [user_info] = await User.find(['id', userId]);

        if (user_info.role != "lecturer") {
            req.session.alert = unauthorized_alert;
            return res.redirect("/dashboard");
        }

        const lecturerCourses = await CourseLecturer.find(['lecturer_id', req.session.uid], null, ['course_id']);
        const courseResources = {};

        for (const course of lecturerCourses) {
            const [key, value] = Object.entries(course)[0];
            const [courseDesc] = await Course.find(['id', value], null, ['code']);
            const resources = await Resource.find(['course_id', value]);

            resources.forEach(resource => {
                resource.date_added = Methods.formatDate(resource.created_at);
                resource.last_updated = Methods.formatDate(resource.updated_at);
            })

            courseResources[courseDesc.code] = resources;
        }

        res.render('resources', { courseResources });
    } catch (error) {
        console.error('Error in showResourcesPage:', error);
        res.status(500).render('500', { error_alert });
    }
}

const handleAddingResources = async (req, res) => {
    try {
        const data = req.body;
        // Validate user information
        const methods = new Methods(data);
        const { invalidKeys } = methods.validateData();

        // Check if there is invalid data to send back to the user
        if (Object.keys(invalidKeys).length > 0) {
            return res.send({ invalidKeys });
        }

        const userId = req.session.uid;

        if (!userId) return res.status(401).send({ message: 'User authentication required, please login', type: 'warning' });

        const filePath = path.join(tempFolder, Methods.tempFilename(userId));

        if (!(await Methods.checkFileExistence({ filePath }))) {
            return res.status(400).send({
                message: "No file found. Make sure to upload your file before submitting the form",
                type: 'warning'
            });
        }

        const [course] = await Course.find(['id', data.course_id]);
        const filename = `${course.code}-${data.name}-${Date.now()}.pdf`;
        const destinationPath = path.join(uploadsFolder, filename);

        data.description = Methods.sentenceCase(data.description);
        data.file = filename;
        data.uploaded_by = userId;

        if (!data.start_year && !data.end_year) {
            if (!data.module) return res.status(500).send({ message: 'Resource data is incomplete, please reload the page and try again', type: 'error' });
        } else {
            data.year = `${data.start_year} / ${data.end_year}`;
            delete data.start_year;
            delete data.end_year;
        }

        await fs.rename(filePath, destinationPath);

        const resource = new Resource(data);
        await resource.add();

        res.status(200).send({
            message: "Resource has been added successfully",
            type: "success",
            clean_up: 'add-resource',
            lecturer_id: userId
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Internal server error, please try again",
            type: "error"
        });
    }
}

const showHistoryPage = async (req, res) => {
    try {
        const userId = req.session.uid;

        const allCourses = await Course.find();
        const allResources = await Resource.find();

        const history = await History.find([['user_id', userId], ['order by', 'updated_at desc']]);

        const courseHistory = []
        const resourceHistory = []

        history.forEach(content => {
            const isCourse = content?.course_id;
            const isResource = content?.resource_id;

            var contentInfo;
            var extra_info;

            if (isCourse) contentInfo = allCourses.find(info => info.id == content.course_id)
            if (isResource) {
                contentInfo = allResources.find(info => info.id == content.resource_id);
                extra_info = allCourses.find(info => info.id == contentInfo.course_id);
                contentInfo.name = Methods.joinedName(contentInfo);
            }

            const data = {
                id: contentInfo.id,
                code: contentInfo?.code || extra_info?.code,
                type: contentInfo?.type,
                name: contentInfo.name,
                last_visited: Methods.formatDate(content.updated_at)
            }

            if (isCourse) courseHistory.push(data);
            if (isResource) resourceHistory.push(data);
        })

        res.render("history", { courseHistory, resourceHistory });
    } catch (error) {
        console.error('Error in "showHistoryPage": ', error);
        res.status(500).render('500', { error_alert });
    }
}

const showRequestsPage = async (req, res) => {
    const userId = req.session.uid;

    try {
        const [user_info] = await User.find(['id', userId]);

        if (user_info.role != "lecturer" && user_info.role != "admin") {
            req.session.alert = unauthorized_alert;
            return res.redirect("/dashboard");
        }

        const requests = await Request.find([['receiver', user_info.role], ['order by', 'created_at desc']]);
        const types = {};

        requests.forEach(request => {
            const { type } = request;
            types[type] = (types[type] || 0) + 1;
        });

        res.render('requests', { requests, types });
    } catch (error) {
        console.error('Error in showRequestsPage:', error);
        res.status(500).render('500', { error_alert });
    }
}

const handleAcceptedRequests = async (req, res) => {
    try {
        const data = req.body;
        // Validate user information
        const methods = new Methods(data);
        const { invalidKeys } = methods.validateData();

        // Check if there is invalid data to send back to the user
        if (Object.keys(invalidKeys).length > 0) {
            invalidKeys.scope = '#select-clone';
            return res.send({ invalidKeys });
        }

        const [requests] = await Request.find(['id', data.request_id]);

        const user_data = {
            id: requests.sender_id,
            name: requests.sender_name,
            email: requests.extra_info,
            password: 'pass',
            role: data.role,
        }

        if (data.role == 'student') {
            user_data.department_id = data.department_id
        }

        data.pfp = await Methods.getPFP();

        const user = new User(user_data);
        const userResult = await user.add();

        if (!userResult || Methods.isObject(userResult)) {
            const message = (Methods.isObject(userResult)) ? userResult.message : "Unable to process request, please try again";

            res.status(500).send({
                message,
                type: "error",
            });
            return
        }

        if (data.role == 'lecturer') {
            const courseLecturers = new CourseLecturer({
                course_id: data.course_id,
                lecturer_id: user_data.id
            });
            await courseLecturers.add();
        }

        //Update request information
        const request = new Request({ handled_by: req.session.uid, id: data.request_id, status: 'accepted' });
        const result = await request.update();

        if (!result || Methods.isObject(result)) {
            const message = (Methods.isObject(result)) ? result.message : "Unable to process request, please try again";

            res.status(500).send({
                message,
                type: "error",
            });
            return
        }

        res.status(200).send({
            message: 'Request accepted successfully',
            type: 'success',
            clean_up: 'request',
            request_id: data.request_id
        })
    } catch (error) {
        console.error('Error in "handleAcceptedRequests": ', error);
        res.status(500).send({
            message: "Internal server error, please try again",
            type: "error"
        });
    }
}

const handleDeclinedRequests = async (req, res) => {
    try {
        const data = req.body;
        // Validate user information
        const methods = new Methods(data);
        const { invalidKeys } = methods.validateData();

        // Check if there is invalid data to send back to the user
        if (Object.keys(invalidKeys).length > 0) {
            return res.send({ invalidKeys });
        }

        //Send the message back to the sender

        //Update request information
        const request = new Request({ handled_by: req.session.uid, id: data.request_id, status: 'rejected' });
        const result = await request.update();

        if (!result) {
            res.status(200).send({
                message: "Unable to process request, please try again",
                type: "error",
            });
            return
        }

        res.status(200).send({
            message: "Request successfully declined",
            type: "success",
            clean_up: 'request',
            request_id: data.request_id
        });
    } catch (error) {
        console.error('Error in "handleDeclinedRequests": ', error);
        res.status(500).send({
            message: "Internal server error, please try again",
            type: "error"
        });
    }
}

const handleHistory = async (req, res) => {
    try {
        const { id, type } = req.body;
        const userId = req.session.uid;
        const column = (type == 'course') ? 'course_id' : (type == 'resource') ? 'resource_id' : null;

        if (!column) return res.status(200).send("Success");

        // Check if the history entry already exists
        const existingHistory = await History.find([['user_id', userId], [column, id]]);

        if (existingHistory.length) {
            // If the entry exists, update the 'updated_at' timestamp
            await History.customSql(
                `UPDATE histories
                 SET updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = ? AND ${column} = ?`,
                [userId, id]
            );

        } else {
            // If the entry doesn't exist, create a new history entry
            const newHistory = new History({
                user_id: userId,
            });

            newHistory[column] = id;

            await newHistory.add();
        }

        res.status(200).send("Success");
    } catch (error) {
        console.error('Error in handleHistory', error);
        res.status(500).send('Internal Server Error');
    }
}

const getUserCollections = async (req, res) => {
    try {
        const userId = req.session.uid;
        const collections = await Collection.find(['user_id', userId])

        res.status(200).send(collections)
    } catch (error) {
        console.log('Error in getUserCollections ', error);
        res.status(500).send([])
    }
}

const handleAddingCollection = async (req, res) => {
    try {
        const data = req.body;
        // Validate user information
        const methods = new Methods(data);
        const { invalidKeys } = methods.validateData();

        // Check if there is invalid data to send back to the user
        if (Object.keys(invalidKeys).length > 0) {
            return res.send({ invalidKeys });
        }

        const userId = req.session.uid;
        const { resource_id } = data;

        if (!userId) return res.status(401).send({ message: 'User authentication required, please login', type: 'warning' });

        if (!resource_id) return res.status(400).send({ message: "Request is missing important information, please try again", type: 'error' });

        data.user_id = userId;
        delete data.resource_id;

        const collectionNameExists = await Collection.find(['collection_name', data.collection_name])

        if (collectionNameExists.length) return res.status(409).send({ message: `Collection name "${data.collection_name}" is already in use`, type: 'warning' });

        const collection = new Collection(data);
        await collection.add();

        const collectionResourceExists = await CollectionResource.find([['collection_id', collection.id], ['resource_id	', resource_id]]);

        if (collectionResourceExists.length) return res.status(409).send({ message: 'This resource already exists in this collection', type: 'warning' });

        const collectionResource = new CollectionResource({
            resource_id,
            collection_id: collection.id
        })
        await collectionResource.add();

        res.status(200).send({
            message: `Created "${data.collection_name}" and added a resource`,
            type: 'success',
            clean_up: 'create-collection'
        })
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Internal server error, please try again",
            type: "error"
        });
    }
}

const handleCollectionResouorce = async (req, res) => {
    try {
        const { resource_id, collection_id } = req.body;

        const collectionResourceExists = await CollectionResource.find([['collection_id', collection_id], ['resource_id	', resource_id]]);

        const [collection] = await Collection.find(['id', collection_id], null, ['collection_name']);

        if (collectionResourceExists.length) return res.status(409).send({ message: `This resource already exists in collection "${collection.collection_name}"`, type: 'warning' });

        const collectionResource = new CollectionResource({
            resource_id,
            collection_id
        })
        await collectionResource.add();

        res.status(200).send({
            message: `Added a resource to "${collection.collection_name}"`,
            type: 'success'
        })
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Internal server error, please try again",
            type: "error"
        });
    }
}

const showCollectionsPage = async (req, res) => {
    const userId = req.session.uid;

    try {
        const [user_info] = await User.find(['id', userId]);

        if (user_info.role != "student") {
            req.session.alert = unauthorized_alert;
            return res.redirect("/dashboard");
        }

        const pfp = user_info.pfp;

        const userCollections = await Collection.find(['user_id', userId]);

        const collections = await getCollections(userCollections);

        res.render("collections", { collections, pfp });
    } catch (error) {
        console.error('Error in showCollectionsPage:', error);
        res.status(500).render('500', { error_alert });
    }
}

const showManageUsersPage = async (req, res) => {
    const userId = req.session.uid;

    try {
        const [user_info] = await User.find(['id', userId]);

        if (user_info.role != "admin") {
            req.session.alert = unauthorized_alert;
            return res.redirect("/dashboard");
        }

        const users = await User.find([['order by', 'created_at desc']]);
        const roles = {};

        users.forEach(user => {
            const { role } = user;
            roles[role] = (roles[role] || 0) + 1;
        });

        res.render("manage-users", { users, roles });
    } catch (error) {
        console.error('Error in showManageUsersPage:', error);
        res.status(500).render('500', { error_alert });
    }
}

const showNoticeBoard = async (req, res) => {
    try {

        res.render('notice-board');
    } catch (error) {
        console.error('Error in showCollectionsPage:', error);
        res.status(500).render('500', { error_alert });
    }
}

const handleAddUser = async (req, res) => {
    try {
        const data = req.body;
        // Validate user information
        const methods = new Methods(data);
        const { invalidKeys } = methods.validateData();

        // Check if there is invalid data to send back to the user
        if (Object.keys(invalidKeys).length > 0) {
            invalidKeys.scope = '#add-user';
            return res.send({ invalidKeys });
        }

        const userId = req.session.uid;
        const { course_id } = data;

        delete data.course_id;

        if (!userId) return res.status(401).send({ message: 'User authentication required, please login', type: 'warning' });

        //Check if id or email already exists
        const IDExists = await User.find([['id', data.id]])
        const emailExists = await User.find([['email', data.email]])

        if (IDExists.length) {
            invalidKeys.id = 'Id is already in use';
        } else if (emailExists.length) {
            invalidKeys.email = 'Email is already in use';
        }

        if (Object.keys(invalidKeys).length > 0) {
            invalidKeys.scope = '#add-user';
            return res.send({ invalidKeys });
        }

        //Remove department_id if role isnt student
        if (data.role != 'student') delete data.department_id;

        data.pfp = await Methods.getPFP();

        //Add new user to database
        const user = new User(data);
        const result = await user.add();

        //Attach a course to the user if they are a lecturer
        if (data.role == 'lecturer') {
            const courseLecturers = new CourseLecturer({
                course_id,
                lecturer_id: data.id
            });
            const clResult = await courseLecturers.add();

            if (!clResult || Methods.isObject(clResult)) {
                const message = (Methods.isObject(clResult)) ? clResult.message : "Unable to add user, please try again";

                res.status(500).send({
                    message,
                    type: "error",
                });
                return
            }
        }

        if (!result || Methods.isObject(result)) {
            const message = (Methods.isObject(result)) ? result.message : "Unable to add user, please try again";

            res.status(500).send({
                message,
                type: "error",
            });
            return
        }

        res.status(200).send({
            message: "User has been added successfully",
            type: "success",
            clean_up: 'add-user'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Internal server error, please try again",
            type: "error"
        });
    }
}

const handleDelete = async (req, res) => {
    try {
        const { id, type } = req.body;
        const send = {
            message: 'Data successfully deleted',
            type: "success",
            clean_up: 'delete'
        }

        if (!id || !type) {
            res.status(400).send({
                message: "Couldn't delete data, due to missing information",
                type: "error"
            });

            return;
        }

        if (type == 'user') {
            await User.delete(id);
            send.message = 'User successfully deleted';
            send.clean_up = 'delete-user'
        } else if (type == 'resource') {
            await Resource.delete(id);
            send.message = 'Resource successfully deleted';
        }

        res.status(200).send(send);
    } catch (error) {
        console.error(error)
        res.status(500).send({
            message: "Internal server error, please try again",
            type: "error"
        });
    }
}

const handleEdit = async (req, res) => {
    try {
        const data = req.body;
        // Validate user information
        const methods = new Methods(data);
        const { invalidKeys } = methods.validateData();

        // Check if there is invalid data to send back to the user
        if (Object.keys(invalidKeys).length > 0) {
            invalidKeys.scope = '#edit-overlay';
            return res.send({ invalidKeys });
        }

        const { id, type } = data;
        const send = {
            message: 'Data successfully updated',
            type: "success",
            clean_up: 'delete'
        }
        var result = 0;

        if (!id || !type) {
            res.status(400).send({
                message: "Couldn't update data, due to missing information",
                type: "error"
            });

            return;
        }

        delete data.type;

        if (type == 'resource') {
            const resource = new Resource(data);
            result = await resource.update();
            send.message = 'Resource successfully updated';
        } else if (type == 'course-box') {
            const course = new Course(data);
            result = await course.update();
            send.message = 'Course successfully updated';
        } else if (type == 'collection') {
            const collection = new Collection(data);
            result = await collection.update();
            send.message = 'Collection successfully updated';
        } else if (type == 'user') {
            const user = new User(data);
            result = await user.update();
            send.message = 'User successfully updated';
        }

        if (!result) {
            res.status(500).send({
                message: "Unable to update data, please try again",
                type: "error",
            });
            return;
        }

        res.status(200).send(send);
    } catch (error) {
        console.error(error)
        res.status(500).send({
            message: "Internal server error, please try again",
            type: "error"
        });
    }
}

const showUserProfile = async (req, res) => {
    const { id } = req.params;
    const userId = id ? id.split('-').join('/') : null;

    const [user] = await User.find(['id', userId])

    if (!user) return res.send("User not found");

    const [department] = await Department.find(['id', user.department_id]);
    var extra_info = [];
    var col_group;
    var trigger;
    var heading;

    if (user.role == 'student') {
        trigger = 'collection';
        heading = 'user';
        col_group = `
            <colgroup>
                <col>
                <col span="3" style="width: 140px;">
            </colgroup>
        `;
        const userCollections = await Collection.find(['user_id', userId]);
        const collections = await getCollections(userCollections);

        collections.forEach(collection => {
            const data = {
                head: 'user collections',
                id: collection.id,
                name: collection.name,
                slides: collection.slides,
                past_questions: collection.pqs,
                date_added: collection.added
            }

            extra_info.push(data);
        })
    } else if (user.role == 'lecturer') {
        trigger = 'course-box';
        heading = 'lecturer';
        col_group = `
            <colgroup>
                <col style="width: 140px;">
                <col>
                <col style="width: 140px;">
            </colgroup>
        `;

        const courses = await Course.customSql(
            `
            SELECT * FROM courses 
            WHERE id IN (
                SELECT course_id FROM courses_lecturers
                WHERE lecturer_id = ?
            )
            `, [userId]
        )

        courses.forEach(course => {
            const data = {
                head: 'lecturers courses',
                id: course.id,
                code: course.code,
                name: course.name,
                date_added: Methods.formatDate(course.updated_at)
            }

            extra_info.push(data);
        });
    }
    user.department = department?.name;

    res.render("profile", { user, extra_info, col_group, trigger, heading })
}

const getItems = async (req, res) => {
    const { table, custom, columns } = req.body;

    if (custom) {
        const items = await Model.customSql(custom);

        res.json(items);
    } else {
        delete req.body.table;
        delete req.body.columns;

        const conditions = Object.entries(req.body);

        const items = await Model.find(conditions, table, columns);

        res.json(items);
    }
}

const handleUpload = async (req, res) => {
    if (!req?.files) return (req.aborted) ? console.log('Request aborted but still received') : console.log('Files not received');

    const { pdfFile } = req.files;
    const userId = req.session?.uid;

    if (!pdfFile || pdfFile.mimetype !== 'application/pdf') {
        return res.status(400).send({ message: 'You can only upload a valid PDF file', type: 'error' });
    }

    if (!userId) return res.status(401).send({ message: 'User authentication required, please login', type: 'warning' });

    const filename = Methods.tempFilename(userId);

    try {
        // Create the "temp" folder if it doesn't exist
        await fs.mkdir(tempFolder, { recursive: true });

        await pdfFile.mv(path.join(tempFolder, filename));

        return res.status(200).send({ filename });
    } catch (error) {
        console.error('Error moving file:', error);
        res.status(500).send({ message: 'Internal Server Error', type: 'error' });
    }
}

const getPDF = async (req, res) => {
    try {
        const { file, type } = req.params;

        if (!file) return res.status(400).send('File not found');

        const halfPath = (type == 'preview') ?
            path.resolve('temp', file) :
            path.resolve('uploads', 'resources', file);

        const filePath = path.resolve(__dirname, '..', halfPath);

        try {
            await fs.stat(filePath);
        } catch (error) {
            console.log(error);
            return res.status(404).send('File not found');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${file}"`);

        const fileContent = await fs.readFile(filePath);
        res.send(fileContent);
    } catch (error) {
        console.error('Error in getPDF:', error);
        res.status(500).send('Internal Server Error');
    }
}

const logout = (req, res) => {
    // Destroy the user's session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Error logging out');
        } else {
            // Redirect the user to the login page or any other appropriate page
            // req.session.alert = {
            //     message: 'Logout successful',
            //     type: 'success'
            // }
            return res.redirect("/");
        }
    });
}

module.exports = {
    routeSetup,
    showSignPage, showDashboard, handleLogin, handleRequestAccess,
    handleAcceptedRequests, handleDeclinedRequests, showHistoryPage,
    showResourcesPage, showRequestsPage, getItems, getUserCollections,
    handleUpload, getPDF, handleAddingResources, handleHistory,
    handleAddingCollection, handleCollectionResouorce, showCollectionsPage,
    showUserProfile, showManageUsersPage, handleAddUser, handleDelete,
    handleEdit, showNoticeBoard,
    logout
}