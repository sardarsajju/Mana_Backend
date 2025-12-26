const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "alialiali",
    database: "Hospital",
});

module.exports = db;
