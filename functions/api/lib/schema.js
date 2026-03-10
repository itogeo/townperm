// ==========================================================================
// DATABASE SCHEMA — All tables for Three Forks City Management Platform
// ==========================================================================

export const INIT_SQL = `
-- ===================== CORE TABLES =====================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'applicant',
  first_name TEXT, last_name TEXT, phone TEXT, title TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT DEFAULT 'permits',
  ref_id INTEGER,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  details TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ===================== PERMITS MODULE =====================
CREATE TABLE IF NOT EXISTS permit_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT,
  base_fee REAL DEFAULT 0, requires_inspection INTEGER DEFAULT 0,
  review_days INTEGER DEFAULT 14, is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS permits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  permit_number TEXT UNIQUE NOT NULL,
  permit_type_id INTEGER REFERENCES permit_types(id),
  parcel_id TEXT, address TEXT, zoning_district TEXT, flood_zone TEXT,
  latitude REAL, longitude REAL,
  applicant_name TEXT, applicant_email TEXT, applicant_phone TEXT,
  owner_name TEXT, owner_phone TEXT, owner_address TEXT,
  description TEXT, work_type TEXT, valuation REAL DEFAULT 0, square_footage INTEGER,
  status TEXT DEFAULT 'pending', priority TEXT DEFAULT 'normal',
  assigned_to INTEGER REFERENCES users(id),
  submitted_at TEXT, reviewed_at TEXT, review_notes TEXT, conditions TEXT,
  decision TEXT, decision_date TEXT, denial_reason TEXT, expires_at TEXT,
  fees_calculated REAL DEFAULT 0, fees_paid REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS parcels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parcel_id TEXT UNIQUE NOT NULL, address TEXT, owner_name TEXT,
  acres REAL, zoning TEXT, assessed_value REAL,
  geometry_json TEXT, centroid_lat REAL, centroid_lng REAL
);

CREATE TABLE IF NOT EXISTS inspections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  permit_id INTEGER REFERENCES permits(id) NOT NULL,
  inspection_type TEXT NOT NULL, status TEXT DEFAULT 'scheduled',
  scheduled_date TEXT, completed_date TEXT,
  inspector_id INTEGER REFERENCES users(id),
  result TEXT, notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT DEFAULT 'permits',
  ref_id INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id),
  author_name TEXT, comment TEXT NOT NULL,
  is_internal INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fee_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT DEFAULT 'permits',
  ref_id INTEGER NOT NULL,
  amount REAL NOT NULL, payment_method TEXT, reference_number TEXT,
  description TEXT, received_by INTEGER REFERENCES users(id),
  received_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT DEFAULT 'permits',
  ref_id INTEGER NOT NULL,
  filename TEXT NOT NULL, doc_type TEXT, file_size INTEGER,
  file_data TEXT, uploaded_by INTEGER REFERENCES users(id), notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deadlines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT DEFAULT 'permits',
  ref_id INTEGER,
  title TEXT NOT NULL, description TEXT, due_date TEXT NOT NULL,
  deadline_type TEXT DEFAULT 'other',
  is_completed INTEGER DEFAULT 0, completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ===================== BUSINESS LICENSES MODULE =====================
CREATE TABLE IF NOT EXISTS license_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT,
  annual_fee REAL DEFAULT 0, requires_inspection INTEGER DEFAULT 0,
  renewal_month INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS business_licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_number TEXT UNIQUE NOT NULL,
  license_type_id INTEGER REFERENCES license_types(id),
  business_name TEXT NOT NULL, dba_name TEXT,
  owner_name TEXT, owner_phone TEXT, owner_email TEXT,
  address TEXT, mailing_address TEXT,
  description TEXT, employee_count INTEGER,
  status TEXT DEFAULT 'pending',
  issued_date TEXT, expiration_date TEXT,
  annual_fee REAL DEFAULT 0, fees_paid REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ===================== PARK RESERVATIONS MODULE =====================
CREATE TABLE IF NOT EXISTS park_facilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, park_name TEXT NOT NULL,
  facility_type TEXT, capacity INTEGER,
  daily_rate REAL DEFAULT 0, hourly_rate REAL DEFAULT 0,
  amenities TEXT, rules TEXT,
  latitude REAL, longitude REAL,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS park_reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_number TEXT UNIQUE NOT NULL,
  facility_id INTEGER REFERENCES park_facilities(id),
  contact_name TEXT NOT NULL, contact_phone TEXT, contact_email TEXT,
  event_name TEXT, event_description TEXT,
  event_date TEXT NOT NULL, start_time TEXT, end_time TEXT,
  attendee_count INTEGER,
  status TEXT DEFAULT 'pending',
  total_fee REAL DEFAULT 0, fees_paid REAL DEFAULT 0,
  staff_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ===================== CITIZEN REQUESTS MODULE =====================
CREATE TABLE IF NOT EXISTS request_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  description TEXT, department TEXT DEFAULT 'Public Works',
  priority_default TEXT DEFAULT 'normal',
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS citizen_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_number TEXT UNIQUE NOT NULL,
  category_id INTEGER REFERENCES request_categories(id),
  reporter_name TEXT, reporter_phone TEXT, reporter_email TEXT,
  address TEXT, description TEXT NOT NULL,
  latitude REAL, longitude REAL,
  photo_data TEXT,
  status TEXT DEFAULT 'submitted',
  priority TEXT DEFAULT 'normal',
  assigned_to INTEGER REFERENCES users(id),
  resolution TEXT, resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ===================== EMAIL QUEUE =====================
CREATE TABLE IF NOT EXISTS email_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL, to_name TEXT,
  subject TEXT NOT NULL, body_text TEXT, body_html TEXT,
  module TEXT, ref_id INTEGER,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  sent_at TEXT, error TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ===================== INDEXES =====================
CREATE INDEX IF NOT EXISTS idx_permits_status ON permits(status);
CREATE INDEX IF NOT EXISTS idx_permits_number ON permits(permit_number);
CREATE INDEX IF NOT EXISTS idx_permits_submitted ON permits(submitted_at);
CREATE INDEX IF NOT EXISTS idx_permits_assigned ON permits(assigned_to);
CREATE INDEX IF NOT EXISTS idx_permits_parcel ON permits(parcel_id);
CREATE INDEX IF NOT EXISTS idx_inspections_permit ON inspections(permit_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_comments_module_ref ON comments(module, ref_id);
CREATE INDEX IF NOT EXISTS idx_payments_module_ref ON fee_payments(module, ref_id);
CREATE INDEX IF NOT EXISTS idx_documents_module_ref ON documents(module, ref_id);
CREATE INDEX IF NOT EXISTS idx_activity_module_ref ON activity_log(module, ref_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_deadlines_due ON deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_module_ref ON deadlines(module, ref_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON business_licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_number ON business_licenses(license_number);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON park_reservations(event_date);
CREATE INDEX IF NOT EXISTS idx_reservations_facility ON park_reservations(facility_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON citizen_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_number ON citizen_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_parcels_parcel_id ON parcels(parcel_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
`;

// Migration SQL for existing DBs that only have the permits tables
export const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS license_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT,
  annual_fee REAL DEFAULT 0, requires_inspection INTEGER DEFAULT 0,
  renewal_month INTEGER DEFAULT 1, is_active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS business_licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_number TEXT UNIQUE NOT NULL,
  license_type_id INTEGER REFERENCES license_types(id),
  business_name TEXT NOT NULL, dba_name TEXT,
  owner_name TEXT, owner_phone TEXT, owner_email TEXT,
  address TEXT, mailing_address TEXT,
  description TEXT, employee_count INTEGER,
  status TEXT DEFAULT 'pending',
  issued_date TEXT, expiration_date TEXT,
  annual_fee REAL DEFAULT 0, fees_paid REAL DEFAULT 0, notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS park_facilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, park_name TEXT NOT NULL,
  facility_type TEXT, capacity INTEGER,
  daily_rate REAL DEFAULT 0, hourly_rate REAL DEFAULT 0,
  amenities TEXT, rules TEXT,
  latitude REAL, longitude REAL, is_active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS park_reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_number TEXT UNIQUE NOT NULL,
  facility_id INTEGER REFERENCES park_facilities(id),
  contact_name TEXT NOT NULL, contact_phone TEXT, contact_email TEXT,
  event_name TEXT, event_description TEXT,
  event_date TEXT NOT NULL, start_time TEXT, end_time TEXT,
  attendee_count INTEGER, status TEXT DEFAULT 'pending',
  total_fee REAL DEFAULT 0, fees_paid REAL DEFAULT 0, staff_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS request_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  description TEXT, department TEXT DEFAULT 'Public Works',
  priority_default TEXT DEFAULT 'normal', is_active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS citizen_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_number TEXT UNIQUE NOT NULL,
  category_id INTEGER REFERENCES request_categories(id),
  reporter_name TEXT, reporter_phone TEXT, reporter_email TEXT,
  address TEXT, description TEXT NOT NULL,
  latitude REAL, longitude REAL, photo_data TEXT,
  status TEXT DEFAULT 'submitted', priority TEXT DEFAULT 'normal',
  assigned_to INTEGER REFERENCES users(id),
  resolution TEXT, resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS email_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL, to_name TEXT,
  subject TEXT NOT NULL, body_text TEXT, body_html TEXT,
  module TEXT, ref_id INTEGER,
  status TEXT DEFAULT 'pending', attempts INTEGER DEFAULT 0,
  sent_at TEXT, error TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`;
