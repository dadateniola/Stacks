//Setup parameters

//Setup route handlers
const showIntroPage = (req, res) => {
    res.render("intro")   
}

const showLandingPage = (req, res) => {
    res.render("landing")   
}



module.exports = { showLandingPage, showIntroPage }