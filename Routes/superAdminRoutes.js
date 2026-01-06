const express = require("express");
const router = express.Router();
const { getSuperAdminDashboardData } = require("../Controllers/superAdminController");

router.get(
  "/organizations",  
  getSuperAdminDashboardData
);

module.exports = router;