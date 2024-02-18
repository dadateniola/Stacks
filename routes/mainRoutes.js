const { Router } = require("express");
const { showSignPage, showDashboard } = require("../controllers/mainControllers");

const router = Router();

router.get('/', showSignPage);

router.post('/login', (req, res) => {
    console.log(req.body);

    res.status(200).json({ message: 'User successfully authenticated' });
    // res.status(400).json({ message: 'User not found' });
})

router.get('/dashboard', showDashboard);

module.exports = router;