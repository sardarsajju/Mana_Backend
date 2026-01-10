

const db = require("../dbOperation");


exports.createProject = (req, res) => {
  const { project_name, org_id } = req.body;

  // Validation
  if (!project_name || !org_id) {
    return res.status(400).json({
      message: "project_name and org_id are required",
    });
  }

  console.log("Creating project:", project_name, "for org:", org_id);

  const sql = `
    INSERT INTO projects (project_name, org_id)
    VALUES (?, ?)
  `;

  db.query(sql, [project_name, org_id], (err, result) => {
    if (err) {
      console.error("Database Error:", err);

      return res.status(500).json({
        message: "Failed to create project",
        error: err.sqlMessage,
      });
    }

    res.status(201).json({
      message: "Project created successfully",
      project_id: result.insertId,
    });
  });
};

exports.assignProject = (req, res) => {
  const { project_id, users } = req.body;

  // ✅ Add validation
  if (!project_id || !users || users.length === 0) {
    return res.status(400).json({ message: "project_id and users are required" });
  }

  // ✅ Debug: Log the incoming data
  console.log("Received project_id:", project_id);
  console.log("Received users:", users);

  const values = users.map(u => [
    project_id,
    u.user_id,
    u.role
  ]);

  // ✅ Debug: Log the values array
  console.log("Values to insert:", values);

  const sql = `
    INSERT INTO project_users (project_id, user_id, role)
    VALUES ?
    ON DUPLICATE KEY UPDATE role = VALUES(role)
  `;

  db.query(sql, [values], (err, result) => {
    if (err) {
      // ✅ Better error logging
      console.error("Database error:", err);
      return res.status(500).json({ 
        message: "Failed to assign project",
        error: err.sqlMessage,
        code: err.code 
      });
    }
    
    console.log("Insert result:", result);
    res.json({ message: "Project assigned successfully" });
  });
};

/* =========================
   AUTO ASSIGN PROJECT TO ORG USERS
========================= */
exports.autoAssignProject = async (req, res) => {
  const { project_id, org_id } = req.body;

  try {
    // Get all users who have access to this organization
    const getUsersSql = `
      SELECT user_id, role 
      FROM users 
      WHERE org_id = ? AND role IN ('tester', 'developer')
    `;

    db.query(getUsersSql, [org_id], (err, users) => {
      if (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (users.length === 0) {
        return res.status(400).json({ 
          error: "No users have access to this organization yet" 
        });
      }

      // Insert assignments for each user
      const insertSql = `
        INSERT INTO project_assignments (project_id, user_id, role)
        VALUES ?
        ON DUPLICATE KEY UPDATE role = VALUES(role)
      `;

      const values = users.map(user => [
        project_id,
        user.user_id,
        user.role
      ]);

      db.query(insertSql, [values], (err) => {
        if (err) {
          console.error("Error assigning project:", err);
          return res.status(500).json({ error: "Failed to assign project" });
        }

        res.json({ 
          message: "Project assigned successfully",
          assigned_count: users.length,
          users: users
        });
      });
    });
  } catch (error) {
    console.error("Auto-assign error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


exports.getTesterProjects = (req, res) => {
  const testerId = req.query.tester;

  const sql = `
    SELECT p.project_id, p.project_name
    FROM projects p
    JOIN project_users pu ON pu.project_id = p.project_id
    WHERE pu.user_id = ? AND pu.role='tester'
  `;

  db.query(sql, [testerId], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

exports.getProjectDevelopers = (req, res) => {
  const { project_id } = req.params;

  // ✅ FIXED: Use user_id (not id)
  const sql = `
    SELECT u.user_id as id, u.name
    FROM users u
    JOIN project_users pu ON pu.user_id = u.user_id
    WHERE pu.project_id = ? AND pu.role='developer'
  `;

  db.query(sql, [project_id], (err, rows) => {
    if (err) {
      console.error("Get developers error:", err);
      return res.status(500).json({ 
        message: "Failed to load developers", 
        error: err.sqlMessage 
      });
    }
    
    console.log(`Found ${rows.length} developers for project ${project_id}`);
    res.json(rows);
  });
};
exports.getAllProjects = (req, res) => {
  db.query("SELECT * FROM projects", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

exports.getProjectsByOrg = (req, res) => {
  const { org_id } = req.params;

  if (!org_id) {
    return res.status(400).json({ message: "org_id is required" });
  }

  const sql = `
    SELECT project_id, project_name
    FROM projects
    WHERE org_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [org_id], (err, rows) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ message: "DB Error", error: err });
    }

    res.json(rows); 
  });
};

// GET users assigned to a project
exports.getProjectUsers = (req, res) => {
  const { project_id } = req.params;

  const sql = `
    SELECT u.user_id, u.name, u.email, u.role, pu.role as project_role
    FROM project_users pu
    JOIN users u ON pu.user_id = u.user_id
    WHERE pu.project_id = ?
  `;

  db.query(sql, [project_id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
};

// Unassign user from project
exports.unassignUser = (req, res) => {
  const { project_id, user_id } = req.body;

  const sql = `
    DELETE FROM project_users
    WHERE project_id = ? AND user_id = ?
  `;

  db.query(sql, [project_id, user_id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "User removed from project successfully" });
  });
};

/* =========================
   GET SINGLE PROJECT BY ID
========================= */
exports.getProjectById = (req, res) => {
  const { project_id } = req.params;

  const sql = `
    SELECT 
      p.*, 
      o.org_name,
      o.org_id
    FROM projects p
    JOIN organizations o ON o.org_id = p.org_id
    WHERE p.project_id = ?
  `;

  db.query(sql, [project_id], (err, rows) => {
    if (err) {
      console.error("Error fetching project:", err);
      return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    }
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.json(rows[0]);
  });
};