const { Router } = require("express");
const { showSignPage, showDashboard, showResourcesPage, getItems, showRequestsPage, handleLogin, handleRequestAccess } = require("../controllers/mainControllers");

const router = Router();

router.get('/', showSignPage);

router.post('/login', handleLogin)

router.post('/request-access', handleRequestAccess)

router.get('/dashboard', showDashboard);

router.get('/resources', showResourcesPage);

router.get('/requests', showRequestsPage);

router.post('/get-items', getItems)

module.exports = router;