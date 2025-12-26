

const db = require("./../db");

exports.addSchedule = async (req, res) => {
    try {
        let { doctor_id, day_of_week, start_time, end_time } = req.body;

        if (!doctor_id || !day_of_week || !start_time || !end_time) {
            return res.status(400).json({
                message: "doctor_id, day_of_week, start_time and end_time are required"
            });
        }

        day_of_week = day_of_week.trim().toLowerCase();

        if (start_time.length === 5) start_time += ":00";
        if (end_time.length === 5) end_time += ":00";

        if (start_time >= end_time) {
            return res.status(400).json({
                message: "start_time must be before end_time"
            });
        }

        const [existing] = await db.query(
            `SELECT schedule_id, start_time, end_time
             FROM doctor_schedule
             WHERE doctor_id = ? AND day_of_week = ?`,
            [doctor_id, day_of_week]
        );

        if (existing.length > 0) {

            if (
                existing[0].start_time === start_time &&
                existing[0].end_time === end_time
            ) {
                return res.status(400).json({
                    message: "Schedule already exists for this day"
                });
            }

            await db.query(
                `UPDATE doctor_schedule
                 SET start_time = ?, end_time = ?
                 WHERE doctor_id = ? AND day_of_week = ?`,
                [start_time, end_time, doctor_id, day_of_week]
            );

            return res.json({
                message: "Schedule updated successfully"
            });
        }

        await db.query(
            `INSERT INTO doctor_schedule 
             (doctor_id, day_of_week, start_time, end_time)
             VALUES (?, ?, ?, ?)`,
            [doctor_id, day_of_week, start_time, end_time]
        );

        return res.status(201).json({
            message: "Schedule added successfully"
        });

    } catch (err) {
        console.error("❌ ADD SCHEDULE ERROR:", err);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


exports.bookAppointment = async (req, res) => {
    try {
        let { doctor_id, patient_id, appointment_date, appointment_time, reason } = req.body;


        if (!doctor_id || !patient_id || !appointment_date || !appointment_time) {
            return res.status(400).json({
                message: "doctor_id, patient_id, appointment_date and appointment_time are required"
            });
        }


        const day_of_week = new Date(appointment_date)
            .toLocaleString("en-US", { weekday: "long" })
            .toLowerCase();


        if (day_of_week === "saturday" || day_of_week === "sunday") {
            return res.status(400).json({
                message: "Doctor not available on weekends"
            });
        }


        const [scheduleResult] = await db.query(
            `SELECT start_time, end_time FROM doctor_schedule
             WHERE doctor_id = ? AND day_of_week = ?`,
            [doctor_id, day_of_week]
        );

        if (scheduleResult.length === 0) {
            return res.status(400).json({
                message: "Doctor not available on this day"
            });
        }

        const { start_time, end_time } = scheduleResult[0];


        if (appointment_time < start_time || appointment_time >= end_time) {
            return res.status(400).json({
                message: "Appointment time outside working hours"
            });
        }

        const [existing] = await db.query(
            `SELECT appointment_id FROM appointments
             WHERE doctor_id = ?
             AND appointment_date = ?
             AND appointment_time = ?
             AND status = 'BOOKED'`,
            [doctor_id, appointment_date, appointment_time]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                message: "Slot already booked"
            });
        }


        await db.query(
            `INSERT INTO appointments
             (doctor_id, patient_id, appointment_date, appointment_time, reason, status)
             VALUES (?, ?, ?, ?, ?, 'BOOKED')`,
            [doctor_id, patient_id, appointment_date, appointment_time, reason || null]
        );

        return res.status(201).json({
            message: "Appointment booked successfully"
        });

    } catch (err) {
        console.error("❌ BOOK APPOINTMENT ERROR:", err);
        return res.status(500).json({
            message: "Internal server error",
            error: err.message
        });
    }
};


exports.deleteSchedule = async (req, res) => {
    try {
        const { doctor_id, day_of_week } = req.params;

        const [result] = await db.query(
            "DELETE FROM doctor_schedule WHERE doctor_id = ? AND day_of_week = ?",
            [doctor_id, day_of_week]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Schedule not found" });
        }

        res.json({ message: "Schedule deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



exports.getPatientAppointments = async (req, res) => {
    try {
        const { patient_id } = req.params;

        const [appointments] = await db.query(
            `
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.reason,
        d.name AS doctor_name,
        d.specialization
      FROM appointments a
      JOIN doctor d ON a.doctor_id = d.doctor_id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `,
            [patient_id]
        );

        res.json(appointments);
    } catch (err) {
        console.error("Error fetching patient appointments:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};



exports.getRecentPatientAppointments = async (req, res) => {
    try {
        const { patient_id } = req.params;

        const [appointments] = await db.query(
            `
            SELECT 
  a.appointment_id,
  d.name AS doctor_name,
  d.specialization,
  a.appointment_date,
  a.appointment_time,
  a.status,
  a.created_at
FROM appointments a
JOIN doctor d ON a.doctor_id = d.doctor_id
WHERE a.patient_id = ?
ORDER BY a.created_at DESC
LIMIT 3;

            `,
            [patient_id]
        );

        res.json(appointments);
    } catch (error) {
        console.error("Error fetching recent appointments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { appointment_id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "BOOKED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Get current status
    const [rows] = await db.query(
      "SELECT status FROM appointments WHERE appointment_id = ?",
      [appointment_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const currentStatus = rows[0].status;

    // 🔐 Status transition rules
    const validTransitions = {
      BOOKED: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: []
    };

    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${currentStatus} to ${status}`
      });
    }

    await db.query(
      "UPDATE appointments SET status = ? WHERE appointment_id = ?",
      [status, appointment_id]
    );

    res.json({ message: "Status updated successfully" });

  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};



exports.cancelAppointment = async (req, res) => {
  try {
    const { appointment_id } = req.params;

    const [rows] = await db.query(
      "SELECT status FROM appointments WHERE appointment_id = ?",
      [appointment_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (rows[0].status !== "BOOKED") {
      return res.status(400).json({
        message: "Only booked appointments can be cancelled"
      });
    }

    await db.query(
      "UPDATE appointments SET status = 'CANCELLED' WHERE appointment_id = ?",
      [appointment_id]
    );

    res.json({ message: "Appointment cancelled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};



exports.getDoctorDashboardStats = async (req, res) => {
  try {
    const { doctor_id } = req.params;

    const [[totalAppointments]] = await db.query(
      "SELECT COUNT(*) AS count FROM appointments WHERE doctor_id = ?",
      [doctor_id]
    );

    const [[totalPatients]] = await db.query(
      "SELECT COUNT(DISTINCT patient_id) AS count FROM appointments WHERE doctor_id = ?",
      [doctor_id]
    );

    const [[todayAppointments]] = await db.query(
      `SELECT COUNT(*) AS count 
       FROM appointments 
       WHERE doctor_id = ? AND appointment_date = CURDATE()`,
      [doctor_id]
    );

    const [[inProgress]] = await db.query(
      `SELECT COUNT(*) AS count 
       FROM appointments 
       WHERE doctor_id = ? AND status = 'IN_PROGRESS'`,
      [doctor_id]
    );

    const [[completed]] = await db.query(
      `SELECT COUNT(*) AS count 
       FROM appointments 
       WHERE doctor_id = ? AND status = 'COMPLETED'`,
      [doctor_id]
    );

    const [[cancelled]] = await db.query(
      `SELECT COUNT(*) AS count 
       FROM appointments 
       WHERE doctor_id = ? AND status = 'CANCELLED'`,
      [doctor_id]
    );

    res.json({
      totalAppointments: totalAppointments.count,
      totalPatients: totalPatients.count,
      todayAppointments: todayAppointments.count,
      inProgress: inProgress.count,
      completed: completed.count,
      cancelled: cancelled.count
    });

  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
