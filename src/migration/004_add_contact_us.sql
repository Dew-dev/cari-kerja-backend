-- Create contact_us table
CREATE TABLE IF NOT EXISTS contact_us (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index untuk search by email
CREATE INDEX IF NOT EXISTS idx_contact_us_email ON contact_us(email);

-- Create index untuk sorting by created_at
CREATE INDEX IF NOT EXISTS idx_contact_us_created_at ON contact_us(created_at DESC);
