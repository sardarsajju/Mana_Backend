const mysql=require('mysql2/promise');
const pool = mysql.createPool({
    host: 'localhost',
    user: 'example_user',
    password: 'koti@8897',
    database: 'banking_project',
    port: 3306
});

module.exports = pool;