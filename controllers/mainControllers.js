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

const DEFAULT_USER_ID = 123006;

const tempFolder = path.resolve(__dirname, '..', 'temp');
const uploadsFolder = path.resolve(__dirname, '..', 'uploads', 'resources');

const routeSetup = async (req, res, next) => {
    req.session.uid = DEFAULT_USER_ID;
    const userId = req.session.uid;

    try {
        //Add-resource overlay data
        const lecturerCourses = await Course.customSql(`SELECT * FROM courses WHERE id IN (SELECT course_id FROM courses_lecturers WHERE lecturer_id = ${userId})`);
        const filename = `${userId}.pdf`;
        const filePath = path.join(tempFolder, filename);
        const previewRoute = (await Methods.checkFileExistence({ filePath })) ? `/get-pdf/${filename}/preview` : null;

        res.locals.data = {
            lecturerCourses,
            previewRoute,
        }

        next();
    } catch (error) {
        console.error('Error in routeSetup:', error);
        res.status(500).send('Internal Server Error');
    }
}

const showSignPage = async (req, res) => {
    res.render("sign")
}

const showDashboard = async (req, res) => {
    const semesterCourses = await Course.customSql("SELECT * FROM courses WHERE id IN (SELECT course_id FROM departments_courses WHERE semester = 'first')")

    res.render('dashboard', { semesterCourses });
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
        const sameRequest = await Request.find([['sender_id', id], ['type', 'access']]);

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
            message: "Access request has been successfully submitted. You will be notified once it is processed",
            type: "success"
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Internal server error, please try again', type: 'error' });
    }
}

const showResourcesPage = async (req, res) => {
    try {
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
        res.status(500).send('Internal Server Error');
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

        const filePath = path.join(tempFolder, `${userId}.pdf`);

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
            type: "success"
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
    const id = req.session.uid;

    const allCourses = await Course.find();
    const allResources = await Resource.find();

    const courses = await History.find([['user_id', id], ['type', 'course'], ['order by', 'updated_at desc']]);
    const resources = await History.find([['user_id', id], ['type', 'resource'], ['order by', 'updated_at desc']]);

    const courseHistory = []
    const resourceHistory = []

    courses.forEach(course => {
        const courseInfo = allCourses.find(info => info.id == course.content_id)
        const data = {
            id: courseInfo.id,
            code: courseInfo.code,
            name: courseInfo.name,
            last_visited: Methods.formatDate(course.updated_at)
        }

        courseHistory.push(data);
    })

    resources.forEach(resource => {
        const resourceInfo = allResources.find(info => info.id == resource.content_id)
        const courseInfo = allCourses.find(info => info.id == resourceInfo.course_id)
        const data = {
            id: resourceInfo.id,
            code: courseInfo.code,
            type: resourceInfo.type,
            name: Methods.joinedName(resourceInfo),
            last_visited: Methods.formatDate(resource.updated_at)
        }

        resourceHistory.push(data);
    })

    res.render("history", { courseHistory, resourceHistory });
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

const handleAcceptedRequests = async (req, res) => {
    try {
        const data = req.body;
        // Validate user information
        const methods = new Methods(data);
        const { invalidKeys } = methods.validateData();

        // Check if there is invalid data to send back to the user
        if (Object.keys(invalidKeys).length > 0) {
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

        const user = new User(user_data);
        const userResult = await user.add();

        if (!userResult) {
            res.status(500).send({
                message: "Unable to process request, please try again",
                type: "error",
            });
            return
        }

        //Update request information
        const request = new Request({ handled_by: req.session.uid, id: data.request_id, status: 'accepted' });
        const result = await request.update();

        if (!result) {
            res.status(500).send({
                message: "Unable to process request, please try again",
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

        // Check if the history entry already exists
        const existingHistory = await History.find([['user_id', userId], ['content_id', id], ['type', type]]);

        if (existingHistory.length) {
            // If the entry exists, update the 'updated_at' timestamp
            await History.customSql(`
                UPDATE histories
                SET updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ${userId} AND content_id = ${id} AND type = '${type}'
            `);
        } else {
            // If the entry doesn't exist, create a new history entry
            const newHistory = new History({
                user_id: userId,
                content_id: id,
                type
            });
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

const showCollectionsPage = (req, res) => {
    res.send("collections")
}

const getItems = async (req, res) => {
    const { table, custom } = req.body;

    if (custom) {
        const items = await Model.customSql(custom);

        res.json(items);
    } else {
        delete req.body.table;

        const conditions = Object.entries(req.body);

        const items = await Model.find(conditions, table);

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

    const filename = `${userId}.pdf`;

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

module.exports = {
    routeSetup,
    showSignPage, showDashboard, handleLogin, handleRequestAccess,
    handleAcceptedRequests, handleDeclinedRequests, showHistoryPage,
    showResourcesPage, showRequestsPage, getItems, getUserCollections,
    handleUpload, getPDF, handleAddingResources, handleHistory,
    handleAddingCollection, handleCollectionResouorce, showCollectionsPage
}