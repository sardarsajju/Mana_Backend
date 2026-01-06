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

/* =========================
   REGISTER (Updated to accept org_id)
========================= */
exports.register = (req, res) => {
  console.log("📥 Register endpoint hit");
  console.log("📦 Request body:", req.body);

  const { name, email, password, role, org_id } = req.body;

  console.log("🔍 Extracted values:");
  console.log("  - name:", name);
  console.log("  - email:", email);
  console.log("  - role:", role);
  console.log("  - org_id:", org_id);
  console.log("  - org_id type:", typeof org_id);

  const hashed = bcrypt.hashSync(password, 10);

  // Convert org_id to number if it's a string
  const orgIdValue = org_id ? parseInt(org_id) : null;

  console.log("  - org_id after parsing:", orgIdValue);

  const sql = `
    INSERT INTO users (name, email, password, role, org_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [name, email, hashed, role, orgIdValue];
  console.log("📤 SQL values:", values);

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).json({ error: "Database error", details: err.message });
    }
    console.log("✅ User registered successfully:", result);
    res.json({ message: "User registered successfully", user_id: result.insertId });
  });
};
/* =========================
   LOGIN (Updated to return org_id)
========================= */
exports.login = (req, res) => {
  console.log("LOGIN API HIT");
  console.log("BODY 👉", req.body);
  const { email, password } = req.body;

  const sql = `SELECT * FROM users WHERE email = ?`;

  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid email" });
    }

    const user = results[0];

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // ✅ Return org_id and email in response
    res.json({
      message: "Login successful",
      user_id: user.user_id,
      role: user.role,
      name: user.name,
      email: user.email,      // ✅ Added
      org_id: user.org_id     // ✅ Added
    });
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

/* =========================
   TESTER PROFILE
========================= */
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

/* =========================
   DEVELOPER PROFILE
========================= */
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
   USERS BY ROLE
========================= */
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

/* =========================
   ALL USERS (TESTER + DEV)
========================= */
exports.getAllUsers = (req, res) => {
  db.query(
    "SELECT user_id, name, role FROM users WHERE role IN ('tester','developer')",
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
};

/* =========================
   GET USERS FOR ORG ACCESS MANAGEMENT
   (Updated to filter by org)
========================= */
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


/* =========================
   REVOKE ACCESS FROM USER
========================= */
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