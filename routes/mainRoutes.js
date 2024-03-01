const { Router } = require("express");
const { showSignPage, showResourcesPage, getItems, showRequestsPage, handleLogin, handleRequestAccess, handleUpload, getPDF, handleAddingResources, showDashboard } = require("../controllers/mainControllers");

const router = Router();

router.get('/', showSignPage);

router.get('/dashboard', showDashboard);

router.post('/login', handleLogin);

router.post('/request-access', handleRequestAccess);

router.get('/resources', showResourcesPage);

router.post('/add-resource', handleAddingResources);

router.get('/requests', showRequestsPage);

router.post('/get-items', getItems);

router.post('/upload', handleUpload);

router.get('/get-pdf/:file/:type?', getPDF);

module.exports = router;