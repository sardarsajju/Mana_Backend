// bugRoutes.js
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
  selectOrganization,
  getBugById,
  getBugsByProject
} = require("../Controllers/bugController");

const { verifyUser } = require("../middleware/authMiddleware");

// ========================
// POST Routes
// ========================
router.post("/raise", verifyUser, raiseBug);
router.post("/comment", verifyUser, addComment);
router.post("/mark-read", verifyUser, markBugAsRead);
router.post("/organization/create", createOrganization);
router.post("/select", selectOrganization);

// ========================
// GET Routes - SPECIFIC ROUTES FIRST
// ========================

// Bug specific routes
router.get("/all", verifyUser, getAllBugs);
router.get("/tester", verifyUser, getTesterBugs);
router.get("/admin/project/:orgId/:projectId", getBugsByProject);
router.get("/comments/:bug_id", verifyUser, getComments);
router.get("/overview/:bug_id", verifyUser, getBugOverview);

// Organization routes - ✅ MUST come before /:bug_id
router.get("/organizations", getAllOrganizations);
router.get("/organizations/super-admin", getAllOrganizationsForSuperAdmin);
router.get("/organization/admin/:admin_id", verifyUser, getOrganizationsByAdmin);
router.get("/organization/:org_id", getOrganizationById);

// ========================
// PUT Routes
// ========================
router.put("/update/:id", verifyUser, updateBugStatus);

// ========================
// ⚠️ CATCH-ALL PARAMETERIZED ROUTE - MUST BE LAST
// ========================
router.get("/:bug_id", getBugById);

module.exports = router;