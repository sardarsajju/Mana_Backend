const express = require("express");
const {
  register,
  login,
  getDevelopers,
  getTesterProfile,
  getDeveloperProfile,
  getUsersByRole,
  getAllUsers,
  getUsersForAccess,
  grantAccess,
  revokeAccess,
  getUsersWithStats,
  getAdminProfile,
  getSystemStats,
  getProjectStatsByOrg,  // ✅ Add this
  updateUser,
  deleteUser,
} = require("../Controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/admin/users", getAllUsers);
router.get("/admin/profile/:id", getAdminProfile);
router.get("/admin/system-stats", getSystemStats);
router.get("/admin/project-stats", getProjectStatsByOrg);  // ✅ Add this
router.put("/admin/users/:id", updateUser);
router.delete("/admin/users/:id", deleteUser);

router.get("/users/by-role", getUsersByRole);
router.get("/users/access", getUsersForAccess);
router.get("/developers", getDevelopers);

router.post("/users/grant-access", grantAccess);
router.post("/users/revoke-access", revokeAccess);

router.get("/tester/profile/:id", getTesterProfile);
router.get("/developer/profile/:id", getDeveloperProfile);
router.get("/users/stats", getUsersWithStats);

module.exports = router;