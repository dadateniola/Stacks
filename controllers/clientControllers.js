//Setup parameters

//Setup route handlers
const showLandingPage = (req, res) => {
    res.render("landing")   
}


module.exports = { showLandingPage }