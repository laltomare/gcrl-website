-- D1 Database Schema for Golden Compasses Research Lodge
-- Create tables for documents, membership requests, and security logs

-- Documents table (library resources)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  filename TEXT NOT NULL,
  file_size INTEGER,
  upload_date TEXT NOT NULL,
  uploaded_by TEXT
);

-- Index for document queries
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date);

-- Membership requests table
CREATE TABLE IF NOT EXISTS membership_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  submitted_date TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_membership_requests_status ON membership_requests(status);
CREATE INDEX IF NOT EXISTS idx_membership_requests_date ON membership_requests(submitted_date);

-- Security logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  ip TEXT NOT NULL,
  event TEXT NOT NULL,
  details TEXT
);

CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON security_logs(ip);
CREATE INDEX IF NOT EXISTS idx_security_logs_event ON security_logs(event);
