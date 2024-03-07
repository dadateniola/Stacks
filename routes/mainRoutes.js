const { Router } = require("express");
const { showSignPage, showResourcesPage, getItems, showRequestsPage, handleLogin, handleRequestAccess, handleUpload, getPDF, handleAddingResources, showDashboard, routeSetup, handleAcceptedRequests, handleDeclinedRequests } = require("../controllers/mainControllers");

const router = Router();

router.post('/login', handleLogin);

router.post('/request-access', handleRequestAccess);

router.post('/add-resource', handleAddingResources);

router.post('/get-items', getItems);

router.post('/upload', handleUpload);

router.post('/accept-request', handleAcceptedRequests);

router.post('/decline-request', handleDeclinedRequests);

router.use(routeSetup);

router.get('/dashboard', showDashboard);

router.get('/', showSignPage);

router.get('/resources', showResourcesPage);

router.get('/requests', showRequestsPage);

router.get('/get-pdf/:file/:type?', getPDF);

module.exports = router;