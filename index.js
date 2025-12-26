const express = require("express");
const cors = require("cors");

const doctorRoutes = require("./routes/doctorRoute");
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const chatRoutes = require("./routes/chatRoute");
const doctorNotesRoutes = require("./routes/doctorNotesRoutes")

const app = express();

app.use(express.json());
app.use(cors());

// MAIN ROUTE MOUNTING
app.use("/api/doctor", doctorRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notes", doctorNotesRoutes)
app.listen(5005, () => console.log("🚀 Server running on port 5005"));
