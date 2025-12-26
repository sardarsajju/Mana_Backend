const express = require("express");
const { getDoctorDetails,getDoctorById} = require("../controllers/doctorController");
const {getAvailableDoctors} = require("../controllers/doctorController")
const {getDoctorSlots} = require("../controllers/doctorController")
const {getDoctorAppointments} = require("../controllers/doctorController")
const {getSpecializations} = require("../controllers/doctorController")
const { getDoctorsBySpecialization } = require("../controllers/doctorController");

const router = express.Router();

router.get("/specializations", getSpecializations);
router.get("/by-specialization/:specialization", getDoctorsBySpecialization);
router.get("/slots/:doctor_id/:date", getDoctorSlots);
router.get("/appointments/:doctor_id", getDoctorAppointments);
router.get("/details", getDoctorDetails);
router.get("/:doctor_id", getDoctorById);

router.get("/:doctor_id", getDoctorById);
// router.delete(
//   "/schedule/:doctor_id/:day_of_week",
//   deleteSchedule
// );


// router.post("/available_doctors", (req, res) => {
//   res.json({ message: "AVAILABLE DOCTORS ROUTE HIT" });
// });

module.exports = router;
