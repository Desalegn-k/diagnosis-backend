const express = require("express");
const router = express.Router();
const controller = require("../controllers/symptomController");

router.get("/", controller.getAllSymptoms);

module.exports = router;
