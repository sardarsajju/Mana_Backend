const express = require("express");
const { addSchedule, bookAppointment, deleteSchedule } = require("../controllers/appointmentController");
const {getPatientAppointments, getRecentPatientAppointments,updateAppointmentStatus,cancelAppointment, getDoctorDashboardStats } = require("../controllers/appointmentController")

const router = express.Router();

router.post("/schedule", addSchedule);
router.post("/book", bookAppointment);
router.delete('/schedule/:schedule_id',deleteSchedule)
router.get('/patient/:patient_id', getPatientAppointments);
router.get('/patient/:patient_id/recent', getRecentPatientAppointments)
router.patch("/status/:appointment_id", updateAppointmentStatus);
router.patch("/cancel/:appointment_id", cancelAppointment);
router.get("/doctor/:doctor_id/stats", getDoctorDashboardStats)


module.exports = router;
