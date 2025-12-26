const express = require("express");
const cors = require("cors");

const doctorRoutes = require("./routes/doctorRoute");
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");

const app = express();

app.use(express.json());
app.use(cors());

// MAIN ROUTE MOUNTING
app.use("/api/doctor", doctorRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointment", appointmentRoutes);

app.listen(5005, () => console.log("🚀 Server running on port 5005"));
