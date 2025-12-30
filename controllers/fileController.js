const db = require("../db");

exports.uploadFile = async (req, res) => {
  try {
    const {
      appointment_id,
      uploaded_by,
      uploader_id,
      file_type
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File missing" });
    }

    if (!uploaded_by || !uploader_id) {
      return res.status(400).json({ message: "Uploader info missing" });
    }

    await db.query(
      `INSERT INTO appointment_files
       (appointment_id, uploaded_by, uploader_id, file_name, file_type, file_size, file_path)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        appointment_id,
        uploaded_by,
        uploader_id,
        req.file.originalname,
        file_type,
        req.file.size,
        req.file.path
      ]
    );

    res.status(201).json({ message: "File uploaded successfully" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};



exports.getFilesByAppointment = async (req, res) => {
  try {
    const { appointment_id } = req.params;

    const [files] = await db.query(
      `SELECT * FROM appointment_files
       WHERE appointment_id = ?
       ORDER BY created_at DESC`,
      [appointment_id]
    );

    res.json(files);
  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
};
