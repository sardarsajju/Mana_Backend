const db = require("../db");

exports.getDoctorDetails = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM doctor`);

        return res.status(200).json({
            message: "Doctor details retrieved successfully",
            data: rows
        });

    } catch (error) {
        console.error("Error fetching doctor details:", error);

        return res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};



exports.getAvailableDoctors = async (req, res) => {
  try {
    const { appointment_date, specialization } = req.body;

    if (!appointment_date || !specialization) {
      return res.status(400).json({
        message: "appointment_date and specialization are required"
      });
    }

    // 1️⃣ Get weekday from date
    const day_of_week = new Date(appointment_date)
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();

    // 2️⃣ Get doctors who:
    //    - match specialization
    //    - have schedule on that weekday
    const [doctors] = await db.query(
      `
      SELECT d.doctor_id, d.name, d.specialization,
             ds.start_time, ds.end_time
      FROM doctor d
      JOIN doctor_schedule ds ON d.doctor_id = ds.doctor_id
      WHERE d.specialization = ?
        AND ds.day_of_week = ?
      `,
      [specialization, day_of_week]
    );

    return res.json(doctors);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};




exports.getDoctorSlots = async (req, res) => {
  try {
    const { doctor_id, date } = req.params;

    const day = new Date(date)
      .toLocaleString("en-US", { weekday: "long" })
      .toLowerCase();

    const [schedule] = await db.query(
      "SELECT start_time, end_time FROM doctor_schedule WHERE doctor_id = ? AND day_of_week = ?",
      [doctor_id, day]
    );

    if (schedule.length === 0) {
      return res.json({
        availableSlots: [],
        bookedSlots: []
      });
    }

    const { start_time, end_time } = schedule[0];

    const slots = [];
    let current = start_time.slice(0, 5);

    while (current < end_time.slice(0, 5)) {
      slots.push(current);

      const [h, m] = current.split(":");
      const dateObj = new Date();
      dateObj.setHours(h, m);
      dateObj.setMinutes(dateObj.getMinutes() + 30);

      current = dateObj.toTimeString().slice(0, 5);
    }

    const [booked] = await db.query(
      "SELECT appointment_time FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status IN ('BOOKED', 'INPROGRESS')",
      [doctor_id, date]
    );

    const bookedSlots = booked.map(b =>
      b.appointment_time.slice(0, 5)
    );

    const availableSlots = slots.filter(
      slot => !bookedSlots.includes(slot)
    );

    res.json({ availableSlots, bookedSlots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




exports.getDoctorAppointments = async (req, res) => {
    try {
        const { doctor_id } = req.params;

        const [appointments] = await db.query(
            `SELECT 
                a.appointment_id,
                a.appointment_date,
                a.appointment_time,
                a.status,
                a.reason,
                p.name AS patient_name,
                p.mobile
             FROM appointments a
             JOIN patient p ON a.patient_id = p.patient_id
             WHERE a.doctor_id = ?
             ORDER BY a.appointment_date, a.appointment_time`,
            [doctor_id]
        );

        res.json(appointments);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



exports.getSpecializations = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT DISTINCT specialization from doctor"
        );

        res.json(rows.map(r => r.specialization));
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};




exports.getDoctorById = async (req, res) => {
  try {
    const { doctor_id } = req.params;

    const [rows] = await db.query(
      "SELECT doctor_id, name, specialization FROM doctor WHERE doctor_id = ?",
      [doctor_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(rows[0]); // 👈 return single doctor object
  } catch (error) {
    console.error("Error fetching doctor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getDoctorsBySpecialization = async (req, res) => {
  try {
    const { specialization } = req.params;

    const [rows] = await db.query(
      "SELECT doctor_id, name, specialization, experience FROM doctor WHERE specialization = ?",
      [specialization]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error fetching doctors by specialization:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
