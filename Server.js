const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", require("./Routes/authRoutes"));
app.use("/api/organizations", require("./Routes/bugRoutes"));
app.use("/api/projects", require("./Routes/projectRoutes"));
app.use("/api/bugs", require("./Routes/bugRoutes"));
app.use("/api/upload", require("./Routes/uploadRoutes"));
app.use("/api/super-admin", require("./Routes/superAdminRoutes"));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});