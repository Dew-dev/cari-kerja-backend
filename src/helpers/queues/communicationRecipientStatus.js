const config = require("../../config/global_config");
const DB = require("../databases/postgresql/db");

let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = new DB(config.get("/postgresqlUrl"));
  }
  return dbInstance;
}

async function markRecipientSent(recipientId) {
  if (!recipientId) return;
  const db = getDb();
  await db.executeQuery(
    `UPDATE communication_recipients
     SET status = 'sent', sent_at = NOW()
     WHERE id = $1 AND status = 'queued'`,
    [recipientId],
  );
  await db.executeQuery(
    `UPDATE communication_campaigns c
     SET sent = sent + 1,
         status = CASE
           WHEN sent + failed + skipped + 1 >= total THEN
             CASE WHEN failed > 0 THEN 'partial' ELSE 'completed' END
           ELSE status
         END,
         updated_at = NOW()
     WHERE id = (
       SELECT campaign_id FROM communication_recipients WHERE id = $1
     )`,
    [recipientId],
  );
}

async function markRecipientFailed(recipientId, errorMessage) {
  if (!recipientId) return;
  const db = getDb();
  await db.executeQuery(
    `UPDATE communication_recipients
     SET status = 'failed', error = $2
     WHERE id = $1 AND status = 'queued'`,
    [recipientId, errorMessage?.slice(0, 1000) ?? "Send failed"],
  );
  await db.executeQuery(
    `UPDATE communication_campaigns c
     SET failed = failed + 1,
         status = CASE
           WHEN sent + failed + skipped + 1 >= total THEN
             CASE WHEN sent > 0 THEN 'partial' ELSE 'failed' END
           ELSE status
         END,
         updated_at = NOW()
     WHERE id = (
       SELECT campaign_id FROM communication_recipients WHERE id = $1
     )`,
    [recipientId],
  );
}

module.exports = { markRecipientSent, markRecipientFailed };
