-- Rollback 022_fraud_events
DROP INDEX IF EXISTS idx_fraud_events_risk_score;
DROP INDEX IF EXISTS idx_fraud_events_entity;
DROP INDEX IF EXISTS idx_fraud_events_status_created;
DROP TABLE IF EXISTS fraud_events;
