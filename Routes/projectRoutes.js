const express = require("express");
const router = express.Router();
const { createProject, assignProject, getTesterProjects, getProjectDevelopers, getAllProjects, getProjectsByOrg, autoAssignProject, getProjectUsers, unassignUser } = require("../Controllers/projectController");
const { verifyUser } = require("../middleware/authMiddleware");


router.post("/create", verifyUser, createProject);
router.post("/assign", verifyUser, assignProject);
router.post("/auto-assign", autoAssignProject);
router.get("/tester", verifyUser, getTesterProjects);
router.get("/:project_id/developers", verifyUser, getProjectDevelopers);
router.get("/", verifyUser, getAllProjects);
router.get("/org/:org_id", getProjectsByOrg);
router.get("/:project_id/users", getProjectUsers);
router.post("/unassign", unassignUser);
module.exports = router;
