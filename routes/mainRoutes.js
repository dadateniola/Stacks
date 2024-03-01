const { Router } = require("express");
const { showDefaultPage, showResourcesPage, getItems, showRequestsPage, handleLogin, handleRequestAccess, handleUpload, getPDF } = require("../controllers/mainControllers");

const router = Router();

router.get('/', showDefaultPage);

router.post('/login', handleLogin)

router.post('/request-access', handleRequestAccess)

router.get('/resources', showResourcesPage);

router.get('/requests', showRequestsPage);

router.post('/get-items', getItems)

router.post('/upload', handleUpload)

router.get('/get-pdf/:file/:type?', getPDF)

module.exports = router;