const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.POSTGRESQL_URL,
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    const defaultSettings = [
      { key: "platform_name", value: "Cari Kerja" },
      { key: "support_email", value: "support@carikerja.co.id" },
      { key: "maintenance_mode", value: "false" },
      { key: "max_upload_size_mb", value: "5" },
      { key: "allow_employer_registration", value: "true" }
    ];

    for (const item of defaultSettings) {
      await pool.query(
        "INSERT INTO system_settings (setting_key, setting_value) VALUES ($1, $2) ON CONFLICT (setting_key) DO NOTHING;",
        [item.key, item.value]
      );
    }
    
    console.log("System settings table created and seeded.");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
