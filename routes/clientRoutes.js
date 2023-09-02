//Setup project dependencies
const {Router} = require("express");
const { showLandingPage } = require("../controllers/clientControllers");


//Setup parameters
const router = Router();

//Route middlewares
//Set all route titles to "Stacks" by default
router.use((req, res, next) => {
    res.locals.title = 'Stacks';
    next();
})

//Setup Routes
router.get("/", showLandingPage);


module.exports = router;