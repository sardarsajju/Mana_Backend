const express = require("express");
const {
  register,
  login,
  getDevelopers,
  getTesterProfile,
  getDeveloperProfile,
  getUsersByRole,
  getAllUsers,
  getUsersForAccess,  // ✅ NEW
  grantAccess,        // ✅ NEW
  revokeAccess,
  getUsersWithStats,       // ✅ NEW
} = require("../Controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/users", getAllUsers);
router.get("/users/by-role", getUsersByRole);
router.get("/users/access", getUsersForAccess);  // ✅ NEW
router.get("/developers", getDevelopers);

router.post("/users/grant-access", grantAccess);   // ✅ NEW
router.post("/users/revoke-access", revokeAccess); // ✅ NEW

router.get("/tester/profile/:id", getTesterProfile);
router.get("/developer/profile/:id", getDeveloperProfile);
router.get("/users/stats",getUsersWithStats);

module.exports = router;