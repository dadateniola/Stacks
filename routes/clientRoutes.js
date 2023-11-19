//Setup project dependencies
const {Router} = require("express");
const { showLandingPage, showIntroPage } = require("../controllers/clientControllers");


//Setup parameters
const router = Router();


//Setup Routes
router.get("/", showIntroPage);

router.get("/home", showLandingPage)


module.exports = router;