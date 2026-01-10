// const db = require('../dbOperation');
// const bcrypt = require('bcryptjs');

// exports.register = async (req, res) => {
//     const {name, email, password, role} = req.body;

//     const hashed = bcrypt.hashSync(password, 10);

//     const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';

//     db.query(sql, [name, email, hashed, role], (err, result) => {
//         if (err) {
//             return res.status(500).json({error: 'Database error'});
//         }
//         return res.status(200).json({message: 'User registered successfully'});
//     });
// }

// exports.login = (req, res) => {
//     const { email, password } = req.body;

//     const sql = 'SELECT * FROM users WHERE email = ?';

//     db.query(sql, [email], (err, results) => {
//         if (err) return res.status(500).json({ error: 'Database error' });

//         if (results.length === 0) {
//             return res.status(401).json({ error: 'Invalid email' });
//         }

//         const user = results[0];

//         const match = bcrypt.compareSync(password, user.password);
//         if (!match) {
//             return res.status(401).json({ error: 'Invalid password' });
//         }
//         res.json({
//             message: "Login successful",
//             role: user.role,
//             id: user.id
//         });
//     });
// };

// exports.getDevelopers = (req, res) => {
//     const sql = 'SELECT * FROM users WHERE role = "developer"';

//     db.query(sql, (err, results) => {
//         if (err) return res.status(500).json({ error: 'Database error' });
//         res.json(results);
//     });
// }
// exports.getTesterProfile = (req, res) => {
//   const userId = req.params.id;

//   const sql = `
//     SELECT 
//       users.name, 
//       users.created_at,
//       (SELECT COUNT(*) FROM bugs WHERE tester_id = ?) AS total_raised,
//       (SELECT COUNT(*) FROM bugs WHERE tester_id = ? AND status='resolved') AS resolved
//     FROM users 
//     WHERE id = ?
//   `;

//   db.query(sql, [userId, userId, userId], (err, rows) => {
//     if (err) return res.status(500).json({ message: "Error", err });
//     res.json(rows[0]);
//   });
// };

// exports.getDeveloperProfile = (req, res) => {
//   const devId = req.params.id;

//   const sql = `
//     SELECT 
//       users.name,
//       users.created_at,
//       (SELECT COUNT(*) FROM bugs WHERE assigned_to = ?) AS total_assigned,
//       (SELECT COUNT(*) FROM bugs WHERE assigned_to = ? AND status='open') AS open_count,
//       (SELECT COUNT(*) FROM bugs WHERE assigned_to = ? AND status='in-progress') AS in_progress_count,
//       (SELECT COUNT(*) FROM bugs WHERE assigned_to = ? AND status='resolved') AS resolved_count
//     FROM users
//     WHERE id = ?
//   `;

//   db.query(sql, [devId, devId, devId, devId, devId], (err, rows) => {
//     if (err) return res.status(500).json({ message: "Error", err });
//     res.json(rows[0]);
//   });
// };

// exports.getUsersByRole = (req, res) => {
//   const { role } = req.query;

//   db.query(
//     "SELECT id, name FROM users WHERE role=?",
//     [role],
//     (err, rows) => {
//       if (err) return res.status(500).json(err);
//       res.json(rows);
//     }
//   );
// };
// exports.getAllUsers = (req, res) => {
//   db.query(
//     "SELECT id, name, role FROM users WHERE role IN ('tester','developer')",
//     (err, rows) => {
//       if (err) return res.status(500).json(err);
//       res.json(rows);
//     }
//   );
// };

const db = require('../dbOperation');
const bcrypt = require('bcryptjs');




exports.register = (req, res) => {
  console.log("📥 Register endpoint hit");
  console.log("📦 Request body:", req.body);

  const { name, email, password, role, org_id } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({ 
      message: "Name, email, and password are required" 
    });
  }

  // Convert org_id to number if it's a string
  const orgIdValue = org_id ? parseInt(org_id) : null;

  // First, check if email already exists
  const checkEmailSql = "SELECT user_id, email FROM users WHERE email = ?";
  
  db.query(checkEmailSql, [email], (checkErr, existingUsers) => {
    if (checkErr) {
      console.error("❌ Error checking email:", checkErr);
      return res.status(500).json({ 
        message: "Database error", 
        details: checkErr.message 
      });
    }

    // If email already exists, return error
    if (existingUsers.length > 0) {
      console.log("⚠️ Email already exists:", email);
      return res.status(409).json({ 
        message: "A user with this email already exists. Please use a different email address.",
        error: "DUPLICATE_EMAIL"
      });
    }

    // Email doesn't exist, proceed with registration
    const hashed = bcrypt.hashSync(password, 10);

    const sql = `
      INSERT INTO users (name, email, password, role, org_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [name, email, hashed, role, orgIdValue];
    console.log("📤 SQL values:", values);

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("❌ Database error:", err);
        
        // Handle MySQL duplicate entry error (as a fallback)
        if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
          return res.status(409).json({ 
            message: "A user with this email already exists. Please use a different email address.",
            error: "DUPLICATE_EMAIL"
          });
        }
        
        return res.status(500).json({ 
          message: "Failed to create user", 
          details: err.message 
        });
      }
      
      console.log("✅ User registered successfully:", result);
      res.status(201).json({ 
        message: "User registered successfully", 
        user_id: result.insertId 
      });
    });
  });
};

exports.login = (req, res) => {
  console.log("=== LOGIN API HIT ===");
  console.log("BODY:", req.body);
  
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = `SELECT * FROM users WHERE email = ?`;

  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("❌ Database error (users query):", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (results.length === 0) {
      console.log("❌ No user found with email:", email);
      return res.status(401).json({ error: "Invalid email" });
    }

    const user = results[0];
    console.log("✅ User found:", user.name, "| Role:", user.role);

    // Check password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      console.log("❌ Invalid password for user:", email);
      return res.status(401).json({ error: "Invalid password" });
    }

    console.log("✅ Password valid");

    // If admin, get org_id from organization table
    if (user.role === 'admin') {
      console.log("👤 Admin user - fetching org_id from organization table");
      
      const orgSql = `SELECT org_id FROM organization WHERE user_id = ?`;
      
      db.query(orgSql, [user.user_id], (orgErr, orgResult) => {
        if (orgErr) {
          console.error("❌ Error fetching org:", orgErr);
          // Don't fail login, just return null org_id
          return res.json({
            message: "Login successful",
            user_id: user.user_id,
            role: user.role,
            name: user.name,
            email: user.email,
            org_id: null
          });
        }

        const orgId = (orgResult && orgResult.length > 0) ? orgResult[0].org_id : null;
        console.log("✅ Admin org_id:", orgId);

        return res.json({
          message: "Login successful",
          user_id: user.user_id,
          role: user.role,
          name: user.name,
          email: user.email,
          org_id: orgId
        });
      });
    } else {
      // For tester/developer, org_id is in users table
      console.log("👤 Non-admin user - org_id from users table:", user.org_id);
      
      return res.json({
        message: "Login successful",
        user_id: user.user_id,
        role: user.role,
        name: user.name,
        email: user.email,
        org_id: user.org_id
      });
    }
  });
};

/* =========================
   GET DEVELOPERS
========================= */
exports.getDevelopers = (req, res) => {
  db.query(
    "SELECT user_id, name FROM users WHERE role='developer'",
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
};

exports.getTesterProfile = (req, res) => {
  const userId = req.params.id;

  const sql = `
    SELECT 
      u.name,
      u.created_at,
      (SELECT COUNT(*) FROM bugs WHERE created_by = ?) AS total_raised,
      (SELECT COUNT(*) FROM bugs WHERE created_by = ? AND status='resolved') AS resolved
    FROM users u
    WHERE u.user_id = ?
  `;

  db.query(sql, [userId, userId, userId], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows[0]);
  });
};

exports.getDeveloperProfile = (req, res) => {
  const devId = req.params.id;

  const sql = `
    SELECT 
      u.name,
      u.created_at,
      (SELECT COUNT(*) FROM bugs WHERE assigned_to = ?) AS total_assigned,
      (SELECT COUNT(*) FROM bugs WHERE assigned_to = ? AND status='open') AS open_count,
      (SELECT COUNT(*) FROM bugs WHERE assigned_to = ? AND status='in-progress') AS in_progress_count,
      (SELECT COUNT(*) FROM bugs WHERE assigned_to = ? AND status='resolved') AS resolved_count
    FROM users u
    WHERE u.user_id = ?
  `;

  db.query(sql, [devId, devId, devId, devId, devId], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows[0]);
  });
};


/* =========================
   GET ADMIN PROFILE
========================= */
exports.getAdminProfile = (req, res) => {
  const userId = req.params.id;

  console.log("📥 Getting admin profile for user_id:", userId);

  const sql = `
    SELECT 
      user_id,
      name,
      email,
      role,
      created_at
    FROM users
    WHERE user_id = ? AND role = 'admin'
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching admin profile:", err);
      return res.status(500).json({ message: "Server error", error: err.message });
    }
    
    if (rows.length === 0) {
      console.log("❌ Admin not found for user_id:", userId);
      return res.status(404).json({ message: "Admin not found" });
    }

    const userProfile = rows[0];

    // ✅ Changed from 'organization' to 'organizations'
    const orgSql = `SELECT org_id, org_name FROM organizations WHERE user_id = ?`;
    
    db.query(orgSql, [userId], (orgErr, orgRows) => {
      if (orgErr) {
        console.error("❌ Error fetching org:", orgErr);
        return res.json(userProfile);
      }

      if (orgRows.length > 0) {
        userProfile.org_id = orgRows[0].org_id;
        userProfile.org_name = orgRows[0].org_name;
      }

      console.log("✅ Admin profile:", userProfile);
      res.json(userProfile);
    });
  });
};

/* =========================
   GET SYSTEM STATS (FILTERED BY ORG)
========================= */
exports.getSystemStats = (req, res) => {
  const { org_id } = req.query;

  console.log("📊 Getting system stats for org_id:", org_id);

  if (!org_id) {
    return res.status(400).json({ message: "Organization ID is required" });
  }

  const userStatsSql = `
    SELECT 
      COUNT(*) AS total_users,
      SUM(CASE WHEN role = 'tester' THEN 1 ELSE 0 END) AS total_testers,
      SUM(CASE WHEN role = 'developer' THEN 1 ELSE 0 END) AS total_developers
    FROM users 
    WHERE org_id = ? AND role != 'admin'
  `;

  db.query(userStatsSql, [org_id], (err, userRows) => {
    if (err) {
      console.error("❌ Error fetching user stats:", err);
      return res.status(500).json({ message: "Server error", error: err.message });
    }

    const stats = {
      total_users: Number(userRows[0]?.total_users) || 0,
      total_testers: Number(userRows[0]?.total_testers) || 0,
      total_developers: Number(userRows[0]?.total_developers) || 0
    };

    const projectSql = `SELECT COUNT(*) AS total_projects FROM projects WHERE org_id = ?`;
    
    db.query(projectSql, [org_id], (projErr, projRows) => {
      if (projErr) {
        console.error("❌ Error fetching project stats:", projErr);
        stats.total_projects = 0;
      } else {
        stats.total_projects = Number(projRows[0]?.total_projects) || 0;
      }

      const bugSql = `
        SELECT 
          COUNT(*) AS total_bugs,
          SUM(CASE WHEN b.status = 'open' THEN 1 ELSE 0 END) AS open_bugs,
          SUM(CASE WHEN b.status = 'in-progress' THEN 1 ELSE 0 END) AS in_progress_bugs,
          SUM(CASE WHEN b.status = 'resolved' THEN 1 ELSE 0 END) AS resolved_bugs
        FROM bugs b
        INNER JOIN projects p ON b.project_id = p.project_id
        WHERE p.org_id = ?
      `;

      db.query(bugSql, [org_id], (bugErr, bugRows) => {
        if (bugErr) {
          console.error("❌ Error fetching bug stats:", bugErr);
          stats.total_bugs = 0;
          stats.open_bugs = 0;
          stats.in_progress_bugs = 0;
          stats.resolved_bugs = 0;
        } else {
          stats.total_bugs = Number(bugRows[0]?.total_bugs) || 0;
          stats.open_bugs = Number(bugRows[0]?.open_bugs) || 0;
          stats.in_progress_bugs = Number(bugRows[0]?.in_progress_bugs) || 0;
          stats.resolved_bugs = Number(bugRows[0]?.resolved_bugs) || 0;
        }

        console.log("✅ Stats:", stats);
        res.json(stats);
      });
    });
  });
};

/* =========================
   GET PROJECT STATS BY ORG
========================= */
exports.getProjectStatsByOrg = (req, res) => {
  const { org_id } = req.query;

  console.log("📊 Getting project stats for org_id:", org_id);

  if (!org_id) {
    return res.status(400).json({ message: "Organization ID is required" });
  }

  // ✅ Changed 'name' to 'project_name'
  const projectsSql = `SELECT project_id, project_name, created_at FROM projects WHERE org_id = ?`;

  db.query(projectsSql, [org_id], (err, projects) => {
    if (err) {
      console.error("❌ Error fetching projects:", err);
      return res.status(500).json({ message: "Server error", error: err.message });
    }

    console.log(`✅ Found ${projects.length} projects`);

    if (projects.length === 0) {
      return res.json([]);
    }

    const projectIds = projects.map(p => p.project_id);
    
    const bugStatsSql = `
      SELECT 
        project_id,
        COUNT(*) AS total_bugs,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_bugs,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) AS in_progress_bugs,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_bugs
      FROM bugs
      WHERE project_id IN (?)
      GROUP BY project_id
    `;

    db.query(bugStatsSql, [projectIds], (bugErr, bugStats) => {
      if (bugErr) {
        console.error("❌ Error fetching bug stats:", bugErr);
        const result = projects.map(p => ({
          project_id: p.project_id,
          project_name: p.project_name,  // ✅ Changed from p.name
          created_at: p.created_at,
          total_bugs: 0,
          open_bugs: 0,
          in_progress_bugs: 0,
          resolved_bugs: 0
        }));
        return res.json(result);
      }

      const result = projects.map(project => {
        const stats = bugStats.find(b => b.project_id === project.project_id) || {
          total_bugs: 0,
          open_bugs: 0,
          in_progress_bugs: 0,
          resolved_bugs: 0
        };

        return {
          project_id: project.project_id,
          project_name: project.project_name,  // ✅ Changed from project.name
          created_at: project.created_at,
          total_bugs: Number(stats.total_bugs) || 0,
          open_bugs: Number(stats.open_bugs) || 0,
          in_progress_bugs: Number(stats.in_progress_bugs) || 0,
          resolved_bugs: Number(stats.resolved_bugs) || 0
        };
      });

      console.log("✅ Project stats:", result);
      res.json(result);
    });
  });
};

/* =========================
   LOGIN (Fix organization table name)
========================= */
exports.login = (req, res) => {
  console.log("=== LOGIN API HIT ===");
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = `SELECT * FROM users WHERE email = ?`;

  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid email" });
    }

    const user = results[0];

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // If admin, get org_id from organizations table
    if (user.role === 'admin') {
      // ✅ Changed from 'organization' to 'organizations'
      const orgSql = `SELECT org_id FROM organizations WHERE user_id = ?`;
      
      db.query(orgSql, [user.user_id], (orgErr, orgResult) => {
        if (orgErr) {
          console.error("❌ Error fetching org:", orgErr);
          return res.json({
            message: "Login successful",
            user_id: user.user_id,
            role: user.role,
            name: user.name,
            email: user.email,
            org_id: null
          });
        }

        const orgId = (orgResult && orgResult.length > 0) ? orgResult[0].org_id : null;
        console.log("✅ Admin login - org_id:", orgId);

        return res.json({
          message: "Login successful",
          user_id: user.user_id,
          role: user.role,
          name: user.name,
          email: user.email,
          org_id: orgId
        });
      });
    } else {
      console.log("✅ User login - org_id:", user.org_id);
      
      return res.json({
        message: "Login successful",
        user_id: user.user_id,
        role: user.role,
        name: user.name,
        email: user.email,
        org_id: user.org_id
      });
    }
  });
};

/* =========================
   ALL USERS (FILTERED BY ORG)
========================= */
exports.getAllUsers = (req, res) => {
  const { org_id } = req.query;

  console.log("📥 Getting users for org_id:", org_id);

  if (!org_id) {
    return res.status(400).json({ message: "Organization ID is required" });
  }

  const sql = `
    SELECT user_id, name, email, role, created_at, org_id, access_active 
    FROM users 
    WHERE org_id = ? AND role != 'admin'
    ORDER BY created_at DESC
  `;

  db.query(sql, [org_id], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching users:", err);
      return res.status(500).json({ message: "Server error" });
    }
    console.log(`✅ Found ${rows.length} users`);
    res.json(rows);
  });
};


exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const { name, email, password, role } = req.body;

  let sql;
  let params;

  if (password) {
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);
    sql = `UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE user_id = ?`;
    params = [name, email, hashedPassword, role, userId];
  } else {
    sql = `UPDATE users SET name = ?, email = ?, role = ? WHERE user_id = ?`;
    params = [name, email, role, userId];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error updating user:", err);
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Email already exists" });
      }
      return res.status(500).json({ message: "Server error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User updated successfully" });
  });
};

exports.deleteUser = (req, res) => {
  const userId = req.params.id;

  console.log("🗑️ Attempting to delete user:", userId);

  // STEP 0 — Check if user exists
  const checkSql = `SELECT * FROM users WHERE user_id = ?`;

  db.query(checkSql, [userId], (err, rows) => {
    if (err) {
      console.error("❌ Error checking user:", err.sqlMessage);
      return res.status(500).json({ message: "Server error", error: err.sqlMessage });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User found:", rows[0].name);

    // STEP 1 — Clear bugs.assigned_to
    const q1 = `UPDATE bugs SET assigned_to = NULL WHERE assigned_to = ?`;

    db.query(q1, [userId], (err1) => {
      if (err1) {
        console.error("❌ assigned_to error:", err1.sqlMessage);
        return res.status(500).json({ message: "Error clearing assigned_to", error: err1.sqlMessage });
      }

      console.log("✔ cleared: bugs.assigned_to");

      // STEP 2 — Clear bugs.created_by
      const q2 = `UPDATE bugs SET created_by = NULL WHERE created_by = ?`;

      db.query(q2, [userId], (err2) => {
        if (err2) {
          console.error("❌ created_by error:", err2.sqlMessage);
          return res.status(500).json({ message: "Error clearing created_by", error: err2.sqlMessage });
        }

        console.log("✔ cleared: bugs.created_by");

        // STEP 3 — Clear bug_comments (tester_id)
        const q3 = `UPDATE bug_comments SET tester_id = NULL WHERE tester_id = ?`;

        db.query(q3, [userId], (err3) => {
          if (err3) {
            console.error("❌ tester_id error (bug_comments):", err3.sqlMessage);
            return res.status(500).json({ message: "Error clearing tester_id", error: err3.sqlMessage });
          }

          console.log("✔ cleared: bug_comments.tester_id");

          // STEP 3b — Clear bug_comments (developer_id)
          const q3b = `UPDATE bug_comments SET developer_id = NULL WHERE developer_id = ?`;

          db.query(q3b, [userId], (err3b) => {
            if (err3b) {
              console.error("❌ developer_id error (bug_comments):", err3b.sqlMessage);
              return res.status(500).json({ message: "Error clearing developer_id", error: err3b.sqlMessage });
            }

            console.log("✔ cleared: bug_comments.developer_id");

            // STEP 4 — Clear bug_reads (if exists)
            const q4 = `UPDATE bug_reads SET user_id = NULL WHERE user_id = ?`;

            db.query(q4, [userId], (err4) => {
              if (err4) {
                console.error("⚠️ bug_reads may not use user_id:", err4.sqlMessage);
                // Not critical — continue
              } else {
                console.log("✔ cleared: bug_reads.user_id");
              }

              // STEP 5 — Clear bug_attachments
              const q5 = `UPDATE bug_attachments SET user_id = NULL WHERE user_id = ?`;

              db.query(q5, [userId], (err5) => {
                if (err5) {
                  console.error("⚠️ bug_attachments may not use user_id:", err5.sqlMessage);
                  // Not critical — continue
                } else {
                  console.log("✔ cleared: bug_attachments.user_id");
                }

                // STEP 6 — Delete from project_users
                const q6 = `DELETE FROM project_users WHERE user_id = ?`;

                db.query(q6, [userId], (err6) => {
                  if (err6) {
                    console.warn("⚠️ project_users delete error:", err6.sqlMessage);
                  } else {
                    console.log("✔ removed: project_users entry");
                  }

                  // FINAL STEP — DELETE USER
                  const q7 = `DELETE FROM users WHERE user_id = ?`;

                  db.query(q7, [userId], (err7, result) => {
                    if (err7) {
                      console.error("❌ Final user delete error:", err7.sqlMessage);
                      return res.status(500).json({
                        message: "Failed to delete user",
                        error: err7.sqlMessage
                      });
                    }

                    console.log("🎉 User deleted successfully!");
                    return res.json({ message: "User deleted successfully" });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};


exports.getUsersByRole = (req, res) => {
  const { role } = req.query;

  db.query(
    "SELECT user_id, name FROM users WHERE role=?",
    [role],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
};

exports.getAllUsers = (req, res) => {
  const { org_id } = req.query;

  console.log("📥 Getting users for org_id:", org_id);

  if (!org_id) {
    return res.status(400).json({ message: "Organization ID is required" });
  }

  // Get all users belonging to this organization (excluding admins)
  const sql = `
    SELECT user_id, name, email, role, created_at, org_id, access_active 
    FROM users 
    WHERE org_id = ? AND role != 'admin'
    ORDER BY created_at DESC
  `;

  db.query(sql, [org_id], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching users:", err);
      return res.status(500).json({ message: "Server error" });
    }
    console.log("✅ Found users:", rows.length);
    res.json(rows);
  });
};

exports.getUsersForAccess = (req, res) => {
  const { org_id } = req.query;

  const sql = `
    SELECT
      user_id,
      name,
      email,
      role,
      org_id,
      access_active AS has_access
    FROM users
    WHERE role IN ('tester', 'developer')
      AND org_id = ?
    ORDER BY name ASC
  `;

  db.query(sql, [org_id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
};


/* =========================
   GRANT ACCESS TO USER
========================= */
exports.grantAccess = (req, res) => {
  const { user_id } = req.body;

  const sql = `
    UPDATE users
    SET access_active = 1
    WHERE user_id = ?
  `;

  db.query(sql, [user_id], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "Access granted successfully" });
  });
};
exports.revokeAccess = (req, res) => {
  const { user_id } = req.body;

  const sql = `
    UPDATE users
    SET access_active = 0
    WHERE user_id = ?
  `;

  db.query(sql, [user_id], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "Access revoked successfully" });
  });
};


exports.getUsersWithStats = (req, res) => {
  const { org_id } = req.query;

  const sql = `
    SELECT 
      u.user_id,
      u.name,
      u.email,
      u.role,
      u.org_id,
      u.access_active AS has_access,
      
      -- Projects assigned
      GROUP_CONCAT(DISTINCT p.project_name SEPARATOR ', ') as assigned_projects,
      COUNT(DISTINCT pu.project_id) as project_count,
      
      -- Bug statistics for testers (created_by)
      COALESCE(
        (SELECT COUNT(*) 
         FROM bugs b 
         WHERE b.created_by = u.user_id), 0
      ) as bugs_raised,
      
      -- Bug statistics for developers (assigned_to)
      COALESCE(
        (SELECT COUNT(*) 
         FROM bugs b 
         WHERE b.assigned_to = u.user_id AND b.status = 'resolved'), 0
      ) as bugs_resolved,
      
      COALESCE(
        (SELECT COUNT(*) 
         FROM bugs b 
         WHERE b.assigned_to = u.user_id), 0
      ) as total_assigned_bugs
      
    FROM users u
    LEFT JOIN project_users pu ON u.user_id = pu.user_id
    LEFT JOIN projects p ON pu.project_id = p.project_id
    WHERE u.role IN ('tester', 'developer')
      AND u.org_id = ?
    GROUP BY u.user_id, u.name, u.email, u.role, u.org_id, u.access_active
    ORDER BY u.name ASC
  `;

  db.query(sql, [org_id], (err, rows) => {
    if (err) {
      console.error("Error fetching users with stats:", err);
      return res.status(500).json({ 
        error: "Database error", 
        details: err.message 
      });
    }
    res.json(rows);
  });
};