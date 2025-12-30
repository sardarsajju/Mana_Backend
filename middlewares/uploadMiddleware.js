// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const fileType = req.body.file_type;

//     let folder = "uploads/reports";
//     if (fileType === "prescription") {
//       folder = "uploads/prescriptions";
//     }

//     // ✅ ensure folder exists
//     fs.mkdirSync(folder, { recursive: true });

//     cb(null, folder);
//   },

//   filename: (req, file, cb) => {
//     const uniqueName =
//       Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueName + path.extname(file.originalname));
//   },
// });

// const fileFilter = (req, file, cb) => {
//   const allowed = ["application/pdf", "image/png", "image/jpeg"];
//   if (allowed.includes(file.mimetype)) cb(null, true);
//   else cb(new Error("Invalid file type"), false);
// };

// module.exports = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 },
// });


// middlewares/uploadMiddleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.params.type; // ✅ AVAILABLE HERE

    let folder = "uploads/reports";
    if (type === "prescription") {
      folder = "uploads/prescriptions";
    }

    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

module.exports = multer({ storage });

