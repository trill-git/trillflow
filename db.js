const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.query("SELECT NOW()")
    .then(result => {
        console.log("✅ PostgreSQL connected:", result.rows[0]);
    })
    .catch(error => {
        console.error("❌ PostgreSQL connection error:", error.message);
    });

module.exports = pool;