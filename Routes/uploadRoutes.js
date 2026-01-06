const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

/* Storage Configuration */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

/* =========================
   Editor Image Upload
========================= */
router.post("/editor-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  res.json({
    url: `http://localhost:5000/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
    fileSize: req.file.size
  });
});

/* =========================
   Editor File Upload
========================= */
router.post("/editor-file", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  res.json({
    url: `http://localhost:5000/uploads/${req.file.filename}`,
    fileName: req.file.originalname,
    fileSize: req.file.size
  });
});

module.exports = router;