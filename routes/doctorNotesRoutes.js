const express = require("express");
const {
  saveDoctorNotes,
  getDoctorNotes
} = require("../controllers/doctorNotesController");

const router = express.Router();

router.post("/save", saveDoctorNotes);
router.get("/:appointment_id", getDoctorNotes);

module.exports = router;
