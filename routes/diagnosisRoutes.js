const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const controller = require("../controllers/diagnosisController");
// require test function from diagnosisController


router.post("/evaluate",auth,controller.evaluate);
router.get("/history", auth, controller.history);
 


module.exports = router;
