-- Alter user and worker sensitive columns to accept longer encrypted strings (Base64)
ALTER TABLE users ALTER COLUMN username TYPE VARCHAR(512);
ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(512);
ALTER TABLE workers ALTER COLUMN telephone TYPE VARCHAR(512);
ALTER TABLE workers ALTER COLUMN name TYPE VARCHAR(512);
ALTER TABLE workers ALTER COLUMN address TYPE VARCHAR(512);
