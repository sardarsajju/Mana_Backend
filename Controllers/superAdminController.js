const db = require("../dbOperation");

exports.getSuperAdminDashboardData = (req, res) => {
  const orgSql = `
    SELECT 
      o.org_id,
      o.org_name AS name,
      COUNT(DISTINCT p.project_id) AS project_count,
      COUNT(DISTINCT u.user_id) AS user_count
    FROM organizations o
    LEFT JOIN projects p ON p.org_id = o.org_id
    LEFT JOIN users u 
      ON u.org_id = o.org_id 
      AND u.role IN ('tester', 'developer')
    GROUP BY o.org_id
    ORDER BY o.org_name
  `;

  const statsSql = `
    SELECT 
      (SELECT COUNT(*) FROM organizations) AS totalOrganizations,
      (SELECT COUNT(*) FROM projects) AS totalProjects,
      (SELECT COUNT(*) FROM bugs) AS totalBugs,
      (SELECT COUNT(*) FROM users WHERE role IN ('tester','developer')) AS totalUsers
  `;

  db.query(orgSql, (err, organizations) => {
    if (err) {
      console.error("Organization query error:", err);
      return res.status(500).json({ message: "DB error fetching organizations" });
    }

    db.query(statsSql, (err2, statsResult) => {
      if (err2) {
        console.error("Stats query error:", err2);
        return res.status(500).json({ message: "DB error fetching stats" });
      }

      res.json({
        organizations,
        stats: statsResult[0] || {
          totalOrganizations: 0,
          totalProjects: 0,
          totalBugs: 0,
          totalUsers: 0
        }
      });
    });
  });
};