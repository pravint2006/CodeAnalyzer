-- Create scan_results table
CREATE TABLE IF NOT EXISTS scan_results (
  id SERIAL PRIMARY KEY,
  repo_url TEXT NOT NULL,
  status scan_status NOT NULL DEFAULT 'queued',
  start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  settings JSONB NOT NULL,
  summary JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create vulnerabilities table
CREATE TABLE IF NOT EXISTS vulnerabilities (
  id SERIAL PRIMARY KEY,
  scan_id INTEGER REFERENCES scan_results(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity severity NOT NULL,
  description TEXT NOT NULL,
  file TEXT NOT NULL,
  line INTEGER NOT NULL,
  code_snippet TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  cwe TEXT,
  cve TEXT,
  status vulnerability_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scan_results_status ON scan_results(status);
CREATE INDEX IF NOT EXISTS idx_scan_results_created_at ON scan_results(created_at);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_scan_id ON vulnerabilities(scan_id);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_status ON vulnerabilities(status);
