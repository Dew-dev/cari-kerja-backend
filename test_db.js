require('dotenv').config({ path: 'C:\\Users\\Hakim\\Documents\\Freelance\\job-portal\\cari-kerja-backend\\.env' });
const DB = require('C:\\Users\\Hakim\\Documents\\Freelance\\job-portal\\cari-kerja-backend\\src\\helpers\\databases\\postgresql\\db.js');
const config = require('C:\\Users\\Hakim\\Documents\\Freelance\\job-portal\\cari-kerja-backend\\src\\config\\global_config.js');
const wrapper = require('C:\\Users\\Hakim\\Documents\\Freelance\\job-portal\\cari-kerja-backend\\src\\helpers\\utils\\wrapper.js');

(async () => {
  const db = new DB(config.get("/pgDbUrl"));
  let whereQuery = "WHERE deleted_at IS NULL";
  const rawQuery = `
    SELECT id, username, email, login_provider, role_id, is_suspended, created_at
    FROM users
    ${whereQuery}
    ORDER BY created_at DESC
    LIMIT 10 OFFSET 0
  `;
  try {
    const result = await db.executeQuery(rawQuery, []);
    console.log("ExecuteQuery Result Count:", result?.rows?.length);
    console.log("ExecuteQuery First Row:", result?.rows?.[0]);
    
    const countQuery = `SELECT COUNT(*) FROM users ${whereQuery}`;
    const countResult = await db.executeQuery(countQuery, []);
    console.log("CountResult First Row:", countResult?.rows?.[0]);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
})();
