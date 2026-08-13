const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.POSTGRESQL_URL,
});

async function run() {
  try {
    console.log("Adding deleted_at to users, workers, recruiters, job_posts...");
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`);
    await pool.query(`ALTER TABLE workers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`);
    await pool.query(`ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`);
    await pool.query(`ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;`);

    console.log("Creating audit_logs table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        action VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT fk_audit_user
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    console.log("Migration successful.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

run();
