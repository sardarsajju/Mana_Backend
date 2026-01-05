// const express = require("express");
// const cors = require("cors");
// const path = require("path");

// const doctorRoutes = require("./routes/doctorRoute");
// const authRoutes = require("./routes/authRoutes");
// const appointmentRoutes = require("./routes/appointmentRoutes");
// const chatRoutes = require("./routes/chatRoute");
// const doctorNotesRoutes = require("./routes/doctorNotesRoutes");
// const fileRoutes = require("./routes/fileRoute");

// const app = express();

// app.use(express.json());
// app.use(cors());

// // API ROUTES
// app.use("/api/doctor", doctorRoutes);
// app.use("/api/auth", authRoutes);
// app.use("/api/appointment", appointmentRoutes);
// app.use("/api/chat", chatRoutes);
// app.use("/api/notes", doctorNotesRoutes);
// app.use("/api/files", fileRoutes);

// // ✅ SERVE UPLOADED FILES
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// app.listen(5005, () => console.log("🚀 Server running on port 5005"));


const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const doctorRoutes = require("./routes/doctorRoute");
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const chatRoutes = require("./routes/chatRoute");
const doctorNotesRoutes = require("./routes/doctorNotesRoutes");
const fileRoutes = require("./routes/fileRoute");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use(cors());

// API ROUTES
app.use("/api/doctor", doctorRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notes", doctorNotesRoutes);
app.use("/api/files", fileRoutes);

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔌 SOCKET.IO (SIGNALING)
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("join-call", ({ appointmentId }) => {
    socket.join(appointmentId);
    console.log(`📞 Joined call room: ${appointmentId}`);
  });

  socket.on("offer", ({ appointmentId, offer }) => {
    socket.to(appointmentId).emit("offer", offer);
  });

  socket.on("answer", ({ appointmentId, answer }) => {
    socket.to(appointmentId).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ appointmentId, candidate }) => {
    socket.to(appointmentId).emit("ice-candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

server.listen(5005, () =>
  console.log("🚀 Server + Socket.IO running on port 5005")
);
