// const db = require("../dbOperation");

// exports.raiseBug = (req, res) => {
//   let { tester_id, project_id, title, description, assigned_to } = req.body;

//   if (!project_id) {
//     return res.status(400).json({ error: "Project is required" });
//   }

//   if (!assigned_to || assigned_to === "all") {
//     assigned_to = null;
//   }

//   const sql = `
//     INSERT INTO bugs (tester_id, project_id, title, description, assigned_to)
//     VALUES (?, ?, ?, ?, ?)
//   `;

//   db.query(
//     sql,
//     [tester_id, project_id, title, description, assigned_to],
//     (err, result) => {
//       if (err) {
//         return res.status(500).json({ message: "DB Insert Error", err });
//       }

//       // IMPORTANT: return bug_id
//       res.json({
//         message: "Bug raised successfully",
//         bug_id: result.insertId,
//       });
//     }
//   );
// };

// exports.getAllBugs = (req, res) => {
//     const devId = req.query.dev;
//     const filter = req.query.filter;

//     let sql = `
//         SELECT 
//             b.*,
//             u.name AS tester_name,
//             COALESCE(
//                 (
//                     SELECT is_read 
//                     FROM bug_reads r 
//                     WHERE r.bug_id = b.bug_id
//                     AND r.user_id = ?
//                     AND r.user_role = 'developer'
//                     LIMIT 1
//                 ), 1
//             ) AS is_read
//         FROM bugs b
//         JOIN users u ON u.id = b.tester_id
//         -- 🔐 PROJECT ACCESS CHECK
//         JOIN project_users pu 
//             ON pu.project_id = b.project_id
//             AND pu.user_id = ?
//             AND pu.role = 'developer'
//     `;

//     let params = [devId, devId];

//     if (filter === "assigned") {
//         sql += " WHERE b.assigned_to = ? ";
//         params.push(devId);
//     } else {
//         sql += " WHERE b.assigned_to IS NULL ";
//     }

//     sql += " ORDER BY is_read ASC, b.bug_id DESC";

//     db.query(sql, params, (err, data) => {
//         if (err) return res.status(500).json(err);
//         res.json(data);
//     });
// };



// exports.getTesterBugs = (req, res) => {
//     const testerId = req.query.tester;

//     const sql = `
//         SELECT 
//             b.*,
//             COALESCE(
//                 (
//                     SELECT is_read
//                     FROM bug_reads r 
//                     WHERE r.bug_id = b.bug_id 
//                     AND r.user_id = ?
//                     AND r.user_role = 'tester'
//                     LIMIT 1
//                 ), 1
//             ) AS is_read
//         FROM bugs b
//         WHERE b.tester_id = ?
//         ORDER BY is_read ASC, b.bug_id DESC
//     `;

//     db.query(sql, [testerId, testerId], (err, data) => {
//         if (err) return res.status(500).json(err);

//         res.json(data);
//     });
// };

// exports.updateBugStatus = (req, res) => {
//     const { status, developer_id } = req.body;
//     const { id } = req.params;

//     const sql = `UPDATE bugs SET status = ? WHERE bug_id = ?`;

//     db.query(sql, [status, id], (err) => {
//         if (err) return res.status(500).json({ error: "Update error", err });

//         const logSQL = `
//             INSERT INTO developer_actions (bug_id, developer_id, status)
//             VALUES (?, ?, ?)
//         `;

//         db.query(logSQL, [id, developer_id, status], () =>
//             res.json({ message: "Bug updated" })
//         );
//     });
// };

// exports.addComment = (req, res) => {
//     const { bug_id, sender_id, role, message } = req.body;

//     if (!bug_id || !sender_id || !role || !message) {
//         return res.status(400).json({ error: "Missing fields" });
//     }

//     const tester_id = role === "tester" ? sender_id : null;
//     const developer_id = role === "developer" ? sender_id : null;

//     const insertSQL = `
//         INSERT INTO bug_comments (bug_id, tester_id, developer_id, message)
//         VALUES (?, ?, ?, ?)
//     `;

//     db.query(insertSQL, [bug_id, tester_id, developer_id, message], (err) => {
//         if (err) return res.status(500).json({ error: "DB Error", err });


//         const findBugSQL = `SELECT tester_id, assigned_to FROM bugs WHERE bug_id = ?`;

//         db.query(findBugSQL, [bug_id], (err2, bugRows) => {
//             if (err2) return res.status(500).json({ error: "DB Error", err2 });

//             const bug = bugRows[0];

//             let receivers = [];

//             if (role === "tester") {
//                 if (bug.assigned_to === null) {
//                     const allDevSQL = `SELECT id FROM users WHERE role = 'developer'`;

//                     db.query(allDevSQL, (err3, devs) => {
//                         if (err3) return res.status(500).json({ error: "DB Error", err3 });

//                         receivers = devs.map(d => ({ id: d.id, role: "developer" }));
//                         markUnreadForReceivers();
//                     });

//                     return;
//                 } else {
//                     receivers.push({ id: bug.assigned_to, role: "developer" });
//                 }

//             } else {
//                 // Developer → Tester
//                 receivers.push({ id: bug.tester_id, role: "tester" });
//             }

//             markUnreadForReceivers();

//             function markUnreadForReceivers() {
//                 const unreadSQL = `
//                     INSERT INTO bug_reads (bug_id, user_id, user_role, is_read)
//                     VALUES (?, ?, ?, 0)
//                     ON DUPLICATE KEY UPDATE is_read = 0, updated_at = CURRENT_TIMESTAMP
//                 `;

//                 receivers.forEach(r => {
//                     db.query(unreadSQL, [bug_id, r.id, r.role]);
//                 });

//                 res.json({ message: "Comment added & unread flags updated" });
//             }
//         });
//     });
// };


// exports.getComments = (req, res) => {
//     const { bug_id } = req.params;

//     const sql = `
//         SELECT 
//             c.comment_id,
//             c.message,
//             c.created_at,
//             COALESCE(t.name, d.name) AS sender_name,
//             CASE 
//                 WHEN c.tester_id IS NOT NULL THEN 'tester'
//                 ELSE 'developer'
//             END AS sender_role
//         FROM bug_comments c
//         LEFT JOIN users t ON t.id = c.tester_id
//         LEFT JOIN users d ON d.id = c.developer_id
//         WHERE c.bug_id = ?
//         ORDER BY c.created_at ASC
//     `;

//     db.query(sql, [bug_id], (err, rows) => {
//         if (err) return res.status(500).json({ error: "DB Error", err });
//         res.json(rows);
//     });
// };

// exports.markAsRead = (req, res) => {
//     const { bug_id, user_id, role } = req.body;

//     const sql = `
//         INSERT INTO bug_reads (bug_id, user_id, user_role, is_read)
//         VALUES (?, ?, ?, 1)
//         ON DUPLICATE KEY UPDATE is_read = 1, updated_at = CURRENT_TIMESTAMP
//     `;

//     db.query(sql, [bug_id, user_id, role], (err) => {
//         if (err) return res.status(500).json({ error: "DB Error", err });

//         res.json({ message: "Marked as read" });
//     });
// };

// exports.getBugOverview = (req, res) => {
//     const { bug_id } = req.params;
//     const { user_id, role } = req.query;

//     // 1️⃣ Fetch bug details
//     const bugSQL = `
//         SELECT 
//             b.*,
//             t.name AS tester_name,
//             d.name AS developer_name,
//             p.project_name
//         FROM bugs b
//         JOIN users t ON t.id = b.tester_id
//         LEFT JOIN users d ON d.id = b.assigned_to
//         LEFT JOIN projects p ON p.project_id = b.project_id
//         WHERE b.bug_id = ?
//     `;

//     db.query(bugSQL, [bug_id], (err, bugRows) => {
//         if (err) return res.status(500).json({ error: "Bug fetch error", err });
//         if (bugRows.length === 0) {
//             return res.status(404).json({ error: "Bug not found" });
//         }

//         const bug = bugRows[0];

//         // 2️⃣ Fetch attachments
//         const attachSQL = `
//             SELECT *
//             FROM bug_attachments
//             WHERE bug_id = ?
//             ORDER BY uploaded_at ASC
//         `;

//         db.query(attachSQL, [bug_id], (err2, attachments) => {
//             if (err2) return res.status(500).json({ error: "Attachment error", err2 });

//             const images = attachments.filter(a => a.file_type === "image");
//             const files  = attachments.filter(a => a.file_type === "file");

//             // 3️⃣ Mark as read
//             const readSQL = `
//                 INSERT INTO bug_reads (bug_id, user_id, user_role, is_read)
//                 VALUES (?, ?, ?, 1)
//                 ON DUPLICATE KEY UPDATE is_read = 1, updated_at = CURRENT_TIMESTAMP
//             `;

//             db.query(readSQL, [bug_id, user_id, role]);

//             // 4️⃣ Final response
//             res.json({
//                 bug,
//                 images,
//                 files
//             });
//         });
//     });
// };


// exports.createOrganization = (req, res) => {
//     const { org_name, admin_id } = req.body;

//     if (!org_name || !admin_id) {
//         return res.status(400).json({
//             message: "org_name and admin_id are required"
//         });
//     }

//     const sql = `
//         INSERT INTO organizations (org_name, created_by)
//         VALUES (?, ?)
//     `;

//     db.query(sql, [org_name, admin_id], (err, result) => {
//         if (err) {
//             console.error("Create org error:", err);
//             return res.status(500).json({ error: "DB Error", err });
//         }

//         res.json({
//             message: "Organization created",
//             org_id: result.insertId
//         });
//     });
// };

// exports.getOrganizationsByAdmin = (req, res) => {
//     const { admin_id } = req.params;

//     const sql = `
//         SELECT org_id, org_name, created_at
//         FROM organizations
//         WHERE created_by = ?
//         ORDER BY created_at DESC
//     `;

//     db.query(sql, [admin_id], (err, rows) => {
//         if (err) {
//             console.error("Fetch orgs error:", err);
//             return res.status(500).json({ error: "DB Error", err });
//         }

//         res.json(rows);
//     });
// };



const db = require("../dbOperation");

/* =========================
   RAISE BUG
========================= */
exports.raiseBug = (req, res) => {
  let { created_by, project_id, title, description, assigned_to } = req.body;

  // ✅ Better validation with specific messages
  console.log("Received bug data:", req.body);  // Debug

  if (!created_by) {
    return res.status(400).json({ error: "Missing created_by (user ID)" });
  }

  if (!project_id) {
    return res.status(400).json({ error: "Missing project_id" });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Missing or empty title" });
  }

  if (!assigned_to || assigned_to === "all") {
    assigned_to = null;
  }

  const sql = `
    INSERT INTO bugs (created_by, project_id, title, description, assigned_to)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [created_by, project_id, title.trim(), description, assigned_to],
    (err, result) => {
      if (err) {
        console.error("DB Insert Error:", err);
        return res.status(500).json({ 
          message: "DB Insert Error", 
          error: err.sqlMessage 
        });
      }

      console.log("Bug created successfully:", result.insertId);

      res.json({
        message: "Bug raised successfully",
        bug_id: result.insertId,
      });
    }
  );
};


exports.getAllBugs = (req, res) => {
  const devId = req.query.dev;
  const orgId = req.query.org;
  const filter = req.query.filter;

  console.log("Getting bugs for developer:", devId, "filter:", filter, "org:", orgId);

  // Base query to get all bugs for projects where this developer is assigned
  let sql = `
    SELECT 
      b.*, 
      u.name AS tester_name, 
      p.project_name, 
      o.org_name,
      COALESCE(br.is_read, 0) AS is_read,
      CASE 
        WHEN b.assigned_to IS NULL THEN 'All Developers'
        ELSE (SELECT name FROM users WHERE user_id = b.assigned_to)
      END AS assigned_to_name
    FROM bugs b 
    JOIN users u ON u.user_id = b.created_by 
    JOIN projects p ON p.project_id = b.project_id 
    JOIN organizations o ON o.org_id = p.org_id 
    JOIN project_users pu ON pu.project_id = p.project_id 
                          AND pu.user_id = ? 
                          AND pu.role = 'developer' 
    LEFT JOIN bug_reads br ON br.bug_id = b.bug_id AND br.user_id = ?
  `;

  let params = [devId, devId];
  let whereConditions = [];

  // Filter by organization if provided
  if (orgId) {
    whereConditions.push("p.org_id = ?");
    params.push(orgId);
  }

  // Filter bugs based on assignment
  if (filter === "assigned") {
    // Show only bugs specifically assigned to this developer
    whereConditions.push("b.assigned_to = ?");
    params.push(devId);
  } else if (filter === "all" || !filter) {
    // Show bugs assigned to this developer OR assigned to all developers (NULL)
    whereConditions.push("(b.assigned_to = ? OR b.assigned_to IS NULL)");
    params.push(devId);
  }

  // Add WHERE clause if there are conditions
  if (whereConditions.length > 0) {
    sql += " WHERE " + whereConditions.join(" AND ");
  }

  sql += " ORDER BY b.bug_id DESC";

  console.log("Executing SQL:", sql);
  console.log("With params:", params);

  db.query(sql, params, (err, data) => {
    if (err) {
      console.error("Error fetching bugs:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }

    console.log(`Found ${data.length} bugs for developer ${devId}`);
    
    // Debug: Log assignment info
    data.forEach(bug => {
      console.log(`Bug #${bug.bug_id}: ${bug.title}`);
      console.log(`  Assigned to: ${bug.assigned_to || 'ALL DEVELOPERS'}`);
      console.log(`  Assigned to name: ${bug.assigned_to_name}`);
    });

    res.json(data);
  });
};
/* =========================
   GET TESTER BUGS
========================= */
exports.getTesterBugs = (req, res) => {
  const testerId = req.query.tester;
  const orgId = req.query.org;

  let sql = `
    SELECT 
      b.*,
      p.project_name,
      o.org_name
    FROM bugs b
    JOIN projects p ON p.project_id = b.project_id
    JOIN organizations o ON o.org_id = p.org_id
    WHERE b.created_by = ?
  `;

  let params = [testerId];

  if (orgId) {
    sql += " AND p.org_id = ? ";
    params.push(orgId);
  }

  sql += " ORDER BY b.bug_id DESC";

  db.query(sql, params, (err, data) => {
    if (err) return res.status(500).json(err);
    res.json(data);
  });
};

/* =========================
   UPDATE BUG STATUS
========================= */
exports.updateBugStatus = (req, res) => {
  const { status, developer_id } = req.body;
  const { id } = req.params;

  const sql = `
    UPDATE bugs 
    SET status = ?, assigned_to = ?
    WHERE bug_id = ?
  `;

  db.query(sql, [status, developer_id, id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Bug updated successfully" });
  });
};

/* =========================
   COMMENTS
========================= */
exports.addComment = (req, res) => {
  const { bug_id, sender_id, role, message } = req.body;

  const tester_id = role === "tester" ? sender_id : null;
  const developer_id = role === "developer" ? sender_id : null;

  const sql = `
    INSERT INTO bug_comments (bug_id, tester_id, developer_id, message)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [bug_id, tester_id, developer_id, message], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Comment added" });
  });
};

exports.getComments = (req, res) => {
  const { bug_id } = req.params;

  const sql = `
    SELECT 
      c.comment_id,          
      c.message,
      c.created_at,
      COALESCE(t.name, d.name) AS sender_name,
      CASE 
        WHEN c.tester_id IS NOT NULL THEN 'tester'
        ELSE 'developer'
      END AS sender_role
    FROM bug_comments c
    LEFT JOIN users t ON t.user_id = c.tester_id
    LEFT JOIN users d ON d.user_id = c.developer_id
    WHERE c.bug_id = ?
    ORDER BY c.created_at
  `;

  db.query(sql, [bug_id], (err, rows) => {
    if (err) {
      console.error("Get comments error:", err);
      return res.status(500).json({ message: "DB Error", error: err.sqlMessage });
    }
    res.json(rows);
  });
};

/* =========================
   BUG OVERVIEW
========================= */
exports.getBugOverview = (req, res) => {
  const { bug_id } = req.params;

  const sql = `
    SELECT 
      b.*,
      u.name AS tester_name,
      p.project_name,
      o.org_name
    FROM bugs b
    JOIN users u ON u.user_id = b.created_by
    JOIN projects p ON p.project_id = b.project_id
    JOIN organizations o ON o.org_id = p.org_id
    WHERE b.bug_id = ?
  `;

  db.query(sql, [bug_id], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows[0]);
  });
};

/* =========================
   ORGANIZATION APIs (USED)
========================= */
// Controllers/bugController.js (or wherever it is)


// Controllers/bugController.js

exports.getOrganizationsByAdmin = (req, res) => {
  // The adminId is passed in the URL parameters
  const { admin_id } = req.params;

  if (!admin_id) {
    return res.status(400).json({ error: "Admin ID is required in URL" });
  }

  // ✅ Use 'user_id' to match your database column
  const sql = `
    SELECT org_id, org_name, created_at
    FROM organizations
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [admin_id], (err, rows) => {
    if (err) {
      console.error("❌ Database error fetching orgs:", err);
      return res.status(500).json({ error: "Failed to fetch organizations" });
    }
    
    // rows will be an empty array if the user has no orgs, which is fine.
    res.json(rows);
  });
};


exports.getAllOrganizations = (req, res) => {
  const sql = `
    SELECT org_id, org_name
    FROM organizations
    ORDER BY org_name
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
};

/* =========================
   MARK BUG AS READ
========================= */
exports.markBugAsRead = (req, res) => {
  const { bug_id, user_id, role } = req.body;

  if (!bug_id || !user_id || !role) {
    return res.status(400).json({ message: "bug_id, user_id, and role are required" });
  }

  // Check if record exists
  const checkSql = `
    SELECT * FROM bug_reads 
    WHERE bug_id = ? AND user_id = ?
  `;

  db.query(checkSql, [bug_id, user_id], (err, rows) => {
    if (err) {
      console.error("Check read error:", err);
      return res.status(500).json({ message: "DB Error", error: err.sqlMessage });
    }

    if (rows.length > 0) {
      // Update existing record
      const updateSql = `
        UPDATE bug_reads 
        SET is_read = 1, updated_at = NOW()
        WHERE bug_id = ? AND user_id = ?
      `;

      db.query(updateSql, [bug_id, user_id], (err) => {
        if (err) {
          console.error("Update read error:", err);
          return res.status(500).json({ message: "DB Error", error: err.sqlMessage });
        }
        res.json({ message: "Bug marked as read" });
      });
    } else {
      // Insert new record
      const insertSql = `
        INSERT INTO bug_reads (bug_id, user_id, user_role, is_read, updated_at)
        VALUES (?, ?, ?, 1, NOW())
      `;

      db.query(insertSql, [bug_id, user_id, role], (err) => {
        if (err) {
          console.error("Insert read error:", err);
          return res.status(500).json({ message: "DB Error", error: err.sqlMessage });
        }
        res.json({ message: "Bug marked as read" });
      });
    }
  });
};

// Controllers/organizationController.js



/* =========================
   CREATE ORGANIZATION
========================= */
exports.createOrganization = (req, res) => {
  const { org_name, user_id } = req.body;

  if (!org_name || !user_id) {
    return res.status(400).json({ error: "org_name and user_id are required" });
  }

  const sql = `
    INSERT INTO organizations (org_name, user_id)
    VALUES (?, ?)
  `;

  db.query(sql, [org_name, user_id], (err, result) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Failed to create organization" });
    }

    res.status(201).json({
      message: "Organization created successfully",
      org_id: result.insertId,
      org_name: org_name
    });
  });
};

/* =========================
   GET ALL ORGANIZATIONS BY ADMIN ID
========================= */
exports.getOrganizationsByAdmin = (req, res) => {
  const adminId = req.params.admin_id;

  const sql = `
    SELECT org_id, org_name, created_at 
    FROM organizations 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [adminId], (err, rows) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
};

/* =========================
   GET ORGANIZATION BY ID
   (Used by Register page to show org name)
========================= */
exports.getOrganizationById = (req, res) => {
  const orgId = req.params.org_id;

  console.log("📥 Fetching organization with ID:", orgId);

  const sql = `
    SELECT org_id, org_name, user_id, created_at 
    FROM organizations 
    WHERE org_id = ?
  `;

  db.query(sql, [orgId], (err, rows) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (rows.length === 0) {
      console.warn("⚠️ Organization not found:", orgId);
      return res.status(404).json({ error: "Organization not found" });
    }
    
    console.log("✅ Organization found:", rows[0]);
    res.json(rows[0]); // Return single organization object
  });
};

/* =========================
   SELECT ORGANIZATION (User choosing org)
========================= */
exports.selectOrganization = (req, res) => {
  const { org_id } = req.body;
  const user_id = req.user.user_id;

  if (!org_id) {
    return res.status(400).json({ message: "org_id required" });
  }

  const sql = `
    INSERT INTO user_organizations (user_id, org_id)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE org_id = org_id
  `;

  db.query(sql, [user_id, org_id], (err) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json(err);
    }
    res.json({ message: "Organization selected" });
  });
};

/* =========================
   GET ALL ORGANIZATIONS (For Super Admin)
========================= */
exports.getAllOrganizationsForSuperAdmin = (req, res) => {
  const sql = `
    SELECT 
      o.org_id,
      o.org_name AS name,
      o.created_at,
      COUNT(DISTINCT p.project_id) AS project_count,
      COUNT(DISTINCT u.user_id) AS user_count
    FROM organizations o
    LEFT JOIN projects p ON p.org_id = o.org_id
    LEFT JOIN users u ON u.org_id = o.org_id
    GROUP BY o.org_id, o.org_name, o.created_at
    ORDER BY o.org_name
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json(err);
    }

    const stats = {
      totalOrganizations: rows.length,
      totalProjects: rows.reduce((sum, r) => sum + r.project_count, 0),
      totalUsers: rows.reduce((sum, r) => sum + r.user_count, 0),
      totalBugs: 0 // can add later if needed
    };

    res.json({
      organizations: rows,
      stats
    });
  });
};


/* =========================
   GET SINGLE BUG BY ID (FOR ADMIN)
========================= */
exports.getBugById = (req, res) => {
  const { bug_id } = req.params;

  const sql = `
    SELECT 
      b.*,
      u.name AS tester_name,
      u.email AS tester_email,
      p.project_name,
      p.project_id,
      o.org_name,
      o.org_id,
      dev.name AS developer_name,
      dev.email AS developer_email
    FROM bugs b
    JOIN users u ON u.user_id = b.created_by
    JOIN projects p ON p.project_id = b.project_id
    JOIN organizations o ON o.org_id = p.org_id
    LEFT JOIN users dev ON dev.user_id = b.assigned_to
    WHERE b.bug_id = ?
  `;

  db.query(sql, [bug_id], (err, rows) => {
    if (err) {
      console.error("Error fetching bug:", err);
      return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    }
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Bug not found" });
    }
    
    res.json(rows[0]);
  });
};

/* =========================
   GET BUGS BY PROJECT (FOR ADMIN)
========================= */
exports.getBugsByProject = (req, res) => {
  const { orgId, projectId } = req.params;

  const sql = `
    SELECT 
      b.*,
      u.name AS tester_name,
      u.email AS tester_email,
      p.project_name,
      o.org_name,
      dev.name AS developer_name,
      dev.email AS developer_email
    FROM bugs b
    JOIN users u ON u.user_id = b.created_by
    JOIN projects p ON p.project_id = b.project_id
    JOIN organizations o ON o.org_id = p.org_id
    LEFT JOIN users dev ON dev.user_id = b.assigned_to
    WHERE p.org_id = ? AND p.project_id = ?
    ORDER BY b.created_at DESC
  `;

  db.query(sql, [orgId, projectId], (err, rows) => {
    if (err) {
      console.error("Error fetching bugs:", err);
      return res.status(500).json({ error: "Database error", details: err.sqlMessage });
    }
    
    res.json(rows);
  });
};