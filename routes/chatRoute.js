const express = require("express");
const{sendMessage, getChatByAppointment } = require("../controllers/chatController")

const router = express.Router();

router.post("/send", sendMessage);
router.get("/:appointment_id",getChatByAppointment);

module.exports = router;