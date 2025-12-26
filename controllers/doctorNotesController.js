const db = require("../db");

exports.saveDoctorNotes = async (req, res) => {
  try {
    const { appointment_id, diagnosis, prescription, advice, role } = req.body;

    // 🔒 Role check
    if (role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can save notes"
      });
    }

    // Check if notes already exist
    const [existing] = await db.query(
      "SELECT note_id FROM doctor_notes WHERE appointment_id = ?",
      [appointment_id]
    );

    if (existing.length > 0) {
      // UPDATE
      await db.query(
        `UPDATE doctor_notes 
         SET diagnosis = ?, prescription = ?, advice = ?
         WHERE appointment_id = ?`,
        [diagnosis, prescription, advice, appointment_id]
      );

      return res.json({ message: "Notes updated successfully" });
    }

    // INSERT (first time)
    await db.query(
      `INSERT INTO doctor_notes
       (appointment_id, diagnosis, prescription, advice)
       VALUES (?, ?, ?, ?)`,
      [appointment_id, diagnosis, prescription, advice]
    );

    res.status(201).json({ message: "Notes saved successfully" });

  } catch (error) {
    console.error("Save notes error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




exports.getDoctorNotes = async (req, res) => {
  try {
    const { appointment_id } = req.params;

    const [rows] = await db.query(
      `SELECT diagnosis, prescription, advice, created_at, updated_at
       FROM doctor_notes
       WHERE appointment_id = ?`,
      [appointment_id]
    );

    res.json(rows.length ? rows[0] : null);
  } catch (error) {
    console.error("Get notes error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
