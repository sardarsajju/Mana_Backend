const express = require("express");
const router = express.Router();

const {
  raiseBug,
  getAllBugs,
  getTesterBugs,
  updateBugStatus,
  addComment,
  getComments,
  getBugOverview,
  createOrganization,
  getOrganizationsByAdmin,
  markBugAsRead,
  getAllOrganizations,
  getAllOrganizationsForSuperAdmin,
  getOrganizationById,
  selectOrganization
} = require("../Controllers/bugController");

const { verifyUser } = require("../middleware/authMiddleware");

router.post("/raise", verifyUser, raiseBug);
router.get("/all", verifyUser, getAllBugs);
router.get("/tester", verifyUser, getTesterBugs);
router.put("/update/:id", verifyUser, updateBugStatus);
router.post("/comment", verifyUser, addComment);
router.get("/comments/:bug_id", verifyUser, getComments);
router.get("/overview/:bug_id", verifyUser, getBugOverview);
router.post("/mark-read", verifyUser, markBugAsRead);
router.get("/organizations",  getAllOrganizations);

router.get(
  "/organizations",
  // allowRoles("super_admin"),
  getAllOrganizationsForSuperAdmin
);

router.post("/select", selectOrganization);

router.get("/:org_id", getOrganizationById);
router.post("/organization/create", createOrganization);
router.get("/organization/admin/:admin_id", verifyUser, getOrganizationsByAdmin);

module.exports = router;
