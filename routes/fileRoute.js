const express = require("express");
const upload = require("../middlewares/uploadMiddleware");
const {
  uploadFile,
  getFilesByAppointment,
} = require("../controllers/fileController");

const router = express.Router();

router.post(
  "/upload",
  upload.single("file"),
  uploadFile
);

router.get(
  "/:appointment_id",
  getFilesByAppointment
);

module.exports = router;
