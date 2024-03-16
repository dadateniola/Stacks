const { Router } = require("express");
const { showSignPage, showResourcesPage, getItems, showRequestsPage, handleLogin, handleRequestAccess, handleUpload, getPDF, handleAddingResources, showDashboard, routeSetup, handleAcceptedRequests, handleDeclinedRequests, showHistoryPage, handleHistory, getUserCollections, handleAddingCollection, handleCollectionResouorce, showCollectionsPage, showUserProfile, showManageUsersPage } = require("../controllers/mainControllers");

const router = Router();

router.post('/login', handleLogin);

router.post('/request-access', handleRequestAccess);

router.post('/add-resource', handleAddingResources);

router.post('/get-items', getItems);

router.post('/upload', handleUpload);

router.post('/accept-request', handleAcceptedRequests);

router.post('/decline-request', handleDeclinedRequests);

router.post('/add-history', handleHistory)

router.post('/get-user-collections', getUserCollections)

router.post("/add-to-collection", handleAddingCollection)

router.post("/add-collection-resource", handleCollectionResouorce)

router.use(routeSetup);

router.get('/dashboard', showDashboard);

router.get('/', showSignPage);

router.get('/resources', showResourcesPage);

router.get('/history', showHistoryPage);

router.get('/requests', showRequestsPage);

router.get("/collections", showCollectionsPage);

router.get("/manage-users", showManageUsersPage)

router.get("/profile/:id?", showUserProfile)

router.get('/get-pdf/:file/:type?', getPDF);

module.exports = router;