// projectRoutes.js
const express = require("express");
const router = express.Router();
const { 
  createProject, 
  assignProject, 
  getTesterProjects, 
  getProjectDevelopers, 
  getAllProjects, 
  getProjectsByOrg, 
  autoAssignProject, 
  getProjectUsers, 
  unassignUser,
  getProjectById  // NEW - Add this controller
} = require("../Controllers/projectController");
const { verifyUser } = require("../middleware/authMiddleware");

router.post("/create", verifyUser, createProject);
router.post("/assign", verifyUser, assignProject);
router.post("/auto-assign", autoAssignProject);
router.post("/unassign", unassignUser);

router.get("/tester", verifyUser, getTesterProjects);
router.get("/org/:org_id", getProjectsByOrg);
router.get("/:project_id/developers", verifyUser, getProjectDevelopers);
router.get("/:project_id/users", getProjectUsers);

// NEW - Get single project by ID (must be before the "/" route or use specific matching)
router.get("/details/:project_id", getProjectById); // Changed to /details to avoid conflict

router.get("/", verifyUser, getAllProjects);

module.exports = router;