const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.POSTGRESQL_URL,
});

async function migrate() {
    console.log("Starting Admin Migration...");
    try {
        await pool.query(`INSERT INTO roles (name) VALUES ('super_admin'), ('admin'), ('moderator') ON CONFLICT (name) DO NOTHING;`);
        console.log("Roles inserted");
        
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;`);
        console.log("Added is_suspended to users");
        
        await pool.query(`ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;`);
        console.log("Added is_verified to recruiters");
        
        await pool.query(`INSERT INTO job_post_statuses (name) VALUES ('PENDING'), ('REJECTED'), ('ARCHIVED') ON CONFLICT (name) DO NOTHING;`);
        console.log("Job Post statuses inserted");
        
        console.log("Migration completed successfully!");
    } catch(err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}
migrate();
