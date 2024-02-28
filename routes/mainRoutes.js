const { Router } = require("express");
const { showDefaultPage, showResourcesPage, getItems, showRequestsPage, handleLogin, handleRequestAccess, handleUpload } = require("../controllers/mainControllers");

const router = Router();

router.get('/', showDefaultPage);

router.post('/login', handleLogin)

router.post('/request-access', handleRequestAccess)

router.get('/resources', showResourcesPage);

router.get('/requests', showRequestsPage);

router.post('/get-items', getItems)

router.post('/upload', handleUpload)

module.exports = router;