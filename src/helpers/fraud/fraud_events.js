const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");
const wrapper = require("../utils/wrapper");

const ctx = "Fraud-Events";

/**
 * Insert fraud_events row. Fail-open: logging only jika insert gagal
 * (jangan blokir create job hanya karena queue insert error).
 * @param {{ executeQuery: Function }} db
 * @param {object} event
 */
const recordFraudEvent = async (db, event) => {
  const id = event.id || uuidv4();
  const {
    entity_type,
    entity_id,
    source = "job_content_heuristics",
    risk_score = 0,
    status = "open",
    flags = [],
    summary = null,
    metadata = {},
  } = event;

  try {
    const result = await db.executeQuery(
      `
      INSERT INTO fraud_events (
        id, entity_type, entity_id, source, risk_score, status,
        flags, summary, metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7::jsonb, $8, $9::jsonb
      )
      RETURNING *
      `,
      [
        id,
        entity_type,
        entity_id,
        source,
        risk_score,
        status,
        JSON.stringify(flags),
        summary,
        JSON.stringify(metadata || {}),
      ]
    );
    return wrapper.data(result.rows[0]);
  } catch (err) {
    logger.error(ctx, "recordFraudEvent", "Failed to insert fraud_events", err);
    return wrapper.error(err);
  }
};

/**
 * Avoid duplicate open events for same entity+source (refresh score instead).
 */
const upsertOpenFraudEvent = async (db, event) => {
  try {
    const existing = await db.executeQuery(
      `
      SELECT id FROM fraud_events
      WHERE entity_type = $1
        AND entity_id = $2
        AND source = $3
        AND status IN ('open', 'reviewing')
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [event.entity_type, event.entity_id, event.source || "job_content_heuristics"]
    );

    if (existing?.rows?.length) {
      const id = existing.rows[0].id;
      const updated = await db.executeQuery(
        `
        UPDATE fraud_events SET
          risk_score = $2,
          flags = $3::jsonb,
          summary = $4,
          metadata = $5::jsonb,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          event.risk_score || 0,
          JSON.stringify(event.flags || []),
          event.summary || null,
          JSON.stringify(event.metadata || {}),
        ]
      );
      return wrapper.data(updated.rows[0]);
    }
  } catch (err) {
    logger.error(ctx, "upsertOpenFraudEvent", "lookup/update failed", err);
  }

  return recordFraudEvent(db, event);
};

module.exports = {
  recordFraudEvent,
  upsertOpenFraudEvent,
};
