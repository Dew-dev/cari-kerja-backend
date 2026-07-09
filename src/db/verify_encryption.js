const { Client } = require("pg");
require("dotenv").config();
const DB = require("../helpers/databases/postgresql/db");
const config = require("../config/global_config");
const { decrypt } = require("../helpers/utils/crypto_helper");

async function verify() {
  const pgConfig = config.get("/postgresqlUrl");
  console.log("Database URL:", pgConfig);
  const db = new DB(pgConfig);

  // 1. Get raw postgres client to inspect raw database content
  console.log("\n--- [Step 1] Querying database RAW (no intercepts) ---");
  const rawClient = new Client({ connectionString: pgConfig });
  await rawClient.connect();
  const rawRes = await rawClient.query("SELECT id, name, telephone, address FROM workers LIMIT 1");
  if (rawRes.rows.length === 0) {
    console.log("No workers found in database to verify.");
    await rawClient.end();
    return;
  }
  const rawRow = rawRes.rows[0];
  console.log("Raw row from DB (should be encrypted ciphertext):", rawRow);
  
  // Try decrypting manually to see if it is encrypted
  console.log("Manually Decrypted Name:", decrypt(rawRow.name));
  console.log("Manually Decrypted Telephone:", decrypt(rawRow.telephone));
  await rawClient.end();

  // 2. Query using the transparent DB helper findOne method
  console.log("\n--- [Step 2] Querying using transparent DB wrapper (findOne) ---");
  const plainName = decrypt(rawRow.name);
  console.log("Searching using decrypted name:", plainName);
  
  const queryRes = await db.findOne({ name: plainName }, { id: 1, name: 1, telephone: 1, address: 1 }, "workers");
  console.log("Returned row from transparent findOne (should be decrypted plain text):", queryRes.data);

  if (queryRes.data) {
    if (queryRes.data.name === plainName) {
      console.log("\n✅ SUCCESS: Transparent encryption and decryption is working perfectly!");
    } else {
      console.log("\n❌ FAILURE: Decrypted name does not match plain name.");
    }
  } else {
    console.log("\n❌ FAILURE: Worker search returned no data.");
  }
}

verify().catch((err) => {
  console.error("Verification failed:", err);
});
