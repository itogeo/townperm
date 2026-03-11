// ==========================================================================
// SHARED HELPERS — auth, JSON response, DB init, email queue
// ==========================================================================

import { INIT_SQL, MIGRATION_SQL } from './schema.js';
import { SEED_SQL } from './seed.js';

export function getCityConfig(env) {
  return {
    city_name: 'Three Forks',
    city_state: 'MT',
    map_center: [-111.5513, 45.8930],
    map_zoom: 14,
    mapbox_token: env?.MAPBOX_TOKEN || '',
    county: 'Gallatin',
  };
}

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff', ...CORS, ...extraHeaders },
  });
}

// Auth guard — returns user or 401/403 Response
export async function requireAuth(request, db, requiredRole = null) {
  const user = await getUser(request, db);
  if (!user) return { error: json({ error: 'Authentication required' }, 401) };
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') return { error: json({ error: 'Insufficient permissions' }, 403) };
  return { user };
}

// Validate status against allowed values
export const VALID_STATUSES = {
  permits: ['pending', 'under_review', 'approved', 'denied', 'completed', 'cancelled'],
  licenses: ['pending', 'under_review', 'active', 'denied', 'suspended', 'expired', 'cancelled'],
  parks: ['pending', 'approved', 'denied', 'cancelled'],
  requests: ['submitted', 'in_progress', 'resolved', 'closed', 'cancelled'],
};

// Safe JSON parse with size limit (default 2MB)
export async function parseBody(request, maxBytes = 2 * 1024 * 1024) {
  const contentLength = parseInt(request.headers.get('content-length') || '0');
  if (contentLength > maxBytes) return { error: json({ error: `Request body too large (max ${Math.round(maxBytes/1024/1024)}MB)` }, 413) };
  try {
    return { data: await request.json() };
  } catch {
    return { error: json({ error: 'Invalid JSON in request body' }, 400) };
  }
}

// Sanitize text input — trim, limit length
export function sanitize(val, maxLen = 5000) {
  if (val === null || val === undefined) return null;
  if (typeof val !== 'string') return val;
  return val.trim().slice(0, maxLen);
}

// Input validation helpers
export function validateEmail(e) { return !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
export function validatePhone(p) { return !p || /^[\d\s\-\(\)\+\.]{7,20}$/.test(p); }
export function validateInput(data, rules) {
  for (const [field, c] of Object.entries(rules)) {
    const v = data[field];
    if (c.required && (!v || !String(v).trim())) return `${c.label||field} is required`;
    if (v && c.email && !validateEmail(v)) return `Invalid email for ${c.label||field}`;
    if (v && c.phone && !validatePhone(v)) return `Invalid phone for ${c.label||field}`;
    if (v && c.maxLen && String(v).length > c.maxLen) return `${c.label||field} too long (max ${c.maxLen} chars)`;
  }
  return null;
}

// Password hashing via Web Crypto API (PBKDF2, available in Cloudflare Workers)
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  const saltHex = [...salt].map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash || !password) return false;
  // Demo fallback: accept any non-empty password for seeded demo users
  if (storedHash === 'demo_hash') return password.length > 0;
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  const derived = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  return derived === hashHex;
}

// D1-based rate limiting (CF Workers are stateless, no in-memory counters)
export async function checkRateLimit(db, request, endpoint, maxReqs = 10, windowMin = 1) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const w = new Date(); w.setSeconds(0, 0); w.setMinutes(Math.floor(w.getMinutes() / windowMin) * windowMin);
  const wk = w.toISOString().slice(0, 16);
  try {
    const row = await db.prepare('SELECT request_count FROM rate_limits WHERE ip = ? AND endpoint = ? AND window_start = ?').bind(ip, endpoint, wk).first();
    if (row && row.request_count >= maxReqs) return json({ error: 'Too many requests. Please try again later.' }, 429);
    await db.prepare('INSERT INTO rate_limits (ip, endpoint, window_start, request_count) VALUES (?, ?, ?, 1) ON CONFLICT(ip, endpoint, window_start) DO UPDATE SET request_count = request_count + 1').bind(ip, endpoint, wk).run();
  } catch {}
  return null;
}

export function getCookie(request, name) {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

export async function getUser(request, db) {
  const token = getCookie(request, 'session');
  if (!token) return null;
  const sess = await db.prepare(
    "SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')"
  ).bind(token).first();
  if (!sess) return null;
  return db.prepare(
    'SELECT id, email, role, first_name, last_name, title FROM users WHERE id = ?'
  ).bind(sess.user_id).first();
}

let _dbReady = false;
export async function ensureDB(db) {
  if (_dbReady) return;
  const check = await db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='permits'"
  ).first();

  if (!check) {
    // Fresh DB — create all tables + seed
    const flat = INIT_SQL.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    await db.exec(flat);
    const seedFlat = SEED_SQL.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    await db.exec(seedFlat);
    return;
  }

  // Existing DB — run migrations for new modules
  const hasLicenseTypes = await db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='license_types'"
  ).first();
  if (!hasLicenseTypes) {
    const flat = MIGRATION_SQL.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    await db.exec(flat);
    // Seed new module data
    const seedParts = SEED_SQL.split('-- Sample permits')[0]; // only seed reference data
    // Insert license types, park facilities, request categories, public works user
    const refSeeds = [
      "INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name, phone, title) VALUES ('maintenance@threeforksmt.gov', 'demo_hash', 'staff', 'Tom', 'Bradley', '406-285-3431', 'Public Works')",
      ...extractInserts(SEED_SQL, 'license_types'),
      ...extractInserts(SEED_SQL, 'park_facilities'),
      ...extractInserts(SEED_SQL, 'request_categories'),
    ];
    for (const stmt of refSeeds) {
      try { await db.exec(stmt); } catch {}
    }
  }

  // Column migrations for existing tables
  const colMigrations = [
    "ALTER TABLE permits ADD COLUMN priority TEXT DEFAULT 'normal'",
    "ALTER TABLE permits ADD COLUMN assigned_to INTEGER",
    "ALTER TABLE permits ADD COLUMN expires_at TEXT",
    "ALTER TABLE permits ADD COLUMN owner_phone TEXT",
    "ALTER TABLE permits ADD COLUMN owner_address TEXT",
    "ALTER TABLE users ADD COLUMN title TEXT",
    "ALTER TABLE documents ADD COLUMN file_data TEXT",
    "ALTER TABLE documents ADD COLUMN module TEXT DEFAULT 'permits'",
    "ALTER TABLE comments ADD COLUMN module TEXT DEFAULT 'permits'",
    "ALTER TABLE fee_payments ADD COLUMN module TEXT DEFAULT 'permits'",
    "ALTER TABLE deadlines ADD COLUMN module TEXT DEFAULT 'permits'",
    "ALTER TABLE activity_log ADD COLUMN module TEXT DEFAULT 'permits'",
    // Full form field parity with PDF applications
    "ALTER TABLE permits ADD COLUMN applicant_address TEXT",
    "ALTER TABLE permits ADD COLUMN owner_email TEXT",
    "ALTER TABLE permits ADD COLUMN owner_city TEXT",
    "ALTER TABLE permits ADD COLUMN owner_state TEXT",
    "ALTER TABLE permits ADD COLUMN owner_zip TEXT",
    "ALTER TABLE permits ADD COLUMN lot TEXT",
    "ALTER TABLE permits ADD COLUMN block TEXT",
    "ALTER TABLE permits ADD COLUMN subdivision TEXT",
    "ALTER TABLE permits ADD COLUMN land_area TEXT",
    "ALTER TABLE permits ADD COLUMN builder_name TEXT",
    "ALTER TABLE permits ADD COLUMN builder_phone TEXT",
    "ALTER TABLE permits ADD COLUMN builder_email TEXT",
    "ALTER TABLE permits ADD COLUMN builder_license TEXT",
    "ALTER TABLE permits ADD COLUMN builder_address TEXT",
    "ALTER TABLE permits ADD COLUMN builder_city TEXT",
    "ALTER TABLE permits ADD COLUMN builder_state TEXT",
    "ALTER TABLE permits ADD COLUMN builder_zip TEXT",
    "ALTER TABLE permits ADD COLUMN construction_start TEXT",
    "ALTER TABLE permits ADD COLUMN corner_pins TEXT",
    "ALTER TABLE permits ADD COLUMN after_the_fact INTEGER DEFAULT 0",
    "ALTER TABLE permits ADD COLUMN project_name TEXT",
    "ALTER TABLE permits ADD COLUMN developer_name TEXT",
    "ALTER TABLE permits ADD COLUMN developer_phone TEXT",
    "ALTER TABLE permits ADD COLUMN variance_regulation TEXT",
    "ALTER TABLE permits ADD COLUMN variance_hardship TEXT",
    "ALTER TABLE permits ADD COLUMN variance_public_interest TEXT",
    "ALTER TABLE permits ADD COLUMN floodplain_permit_num TEXT",
    "ALTER TABLE permits ADD COLUMN elevation_cert TEXT",
    "ALTER TABLE permits ADD COLUMN foundation_type TEXT",
    "ALTER TABLE permits ADD COLUMN building_height_residential TEXT",
    "ALTER TABLE permits ADD COLUMN building_height_commercial TEXT",
    "ALTER TABLE permits ADD COLUMN building_height_accessory TEXT",
    "ALTER TABLE permits ADD COLUMN connection_type TEXT",
    "ALTER TABLE permits ADD COLUMN structure_type TEXT",
    "ALTER TABLE permits ADD COLUMN connect_date TEXT",
    "ALTER TABLE permits ADD COLUMN line_size TEXT",
    "ALTER TABLE permits ADD COLUMN line_length TEXT",
    "ALTER TABLE permits ADD COLUMN sewer_grade TEXT",
    "ALTER TABLE permits ADD COLUMN contractor_insurance TEXT",
  ];
  for (const sql of colMigrations) {
    try { await db.exec(sql); } catch {}
  }
  // Ensure form_submissions table exists
  try {
    await db.exec("CREATE TABLE IF NOT EXISTS form_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, submission_number TEXT UNIQUE NOT NULL, form_type TEXT NOT NULL, form_name TEXT, data TEXT, status TEXT DEFAULT 'received', staff_notes TEXT, submitted_at TEXT DEFAULT (datetime('now')), reviewed_at TEXT, reviewed_by INTEGER REFERENCES users(id))");
  } catch {}
  // Add new permit columns for subdivision/annexation/zone change fields
  const extraCols = [
    "ALTER TABLE permits ADD COLUMN proposed_zoning TEXT",
    "ALTER TABLE permits ADD COLUMN zone_change_reason TEXT",
    "ALTER TABLE permits ADD COLUMN proposed_use TEXT",
    "ALTER TABLE permits ADD COLUMN base_flood_elevation TEXT",
    "ALTER TABLE permits ADD COLUMN proposed_development TEXT",
    "ALTER TABLE permits ADD COLUMN variance_reason TEXT",
    "ALTER TABLE permits ADD COLUMN num_lots TEXT",
    "ALTER TABLE permits ADD COLUMN min_lot_size TEXT",
    "ALTER TABLE permits ADD COLUMN water_supply_type TEXT",
    "ALTER TABLE permits ADD COLUMN wastewater_type TEXT",
    "ALTER TABLE permits ADD COLUMN current_land_use TEXT",
    "ALTER TABLE permits ADD COLUMN groundwater_depth TEXT",
    "ALTER TABLE permits ADD COLUMN bedrock_depth TEXT",
    "ALTER TABLE permits ADD COLUMN preliminary_plat_date TEXT",
    "ALTER TABLE permits ADD COLUMN improvements_installed TEXT",
    "ALTER TABLE permits ADD COLUMN materials_submitted TEXT",
    "ALTER TABLE permits ADD COLUMN occupation TEXT",
    "ALTER TABLE permits ADD COLUMN parcel_history TEXT",
    "ALTER TABLE permits ADD COLUMN exemption_type TEXT",
    "ALTER TABLE permits ADD COLUMN exemption_reason TEXT",
    "ALTER TABLE permits ADD COLUMN intended_use TEXT",
    "ALTER TABLE permits ADD COLUMN contiguous TEXT",
    "ALTER TABLE permits ADD COLUMN include_rows TEXT",
    "ALTER TABLE permits ADD COLUMN existing_structures TEXT",
    "ALTER TABLE permits ADD COLUMN abutting_owners TEXT",
    "ALTER TABLE permits ADD COLUMN all_consent TEXT",
    "ALTER TABLE permits ADD COLUMN abandonment_reason TEXT",
    "ALTER TABLE permits ADD COLUMN public_access TEXT",
    "ALTER TABLE permits ADD COLUMN utilities_present TEXT",
  ];
  for (const sql of extraCols) { try { await db.exec(sql); } catch {} }
  // Ensure rate_limits table exists
  try { await db.exec("CREATE TABLE IF NOT EXISTS rate_limits (ip TEXT NOT NULL, endpoint TEXT NOT NULL, window_start TEXT NOT NULL, request_count INTEGER DEFAULT 1, PRIMARY KEY (ip, endpoint, window_start))"); } catch {}
  // Re-apply seed data if new records are missing — run each statement individually for reliability
  const hasNewData = await db.prepare("SELECT 1 FROM permits WHERE permit_number = 'ZP-R-2026-002'").first();
  if (!hasNewData) {
    // Split on semicolons and run each INSERT statement separately so one failure doesn't abort the rest
    const stmts = SEED_SQL.split(/;\s*\n/).map(s => s.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()).filter(s => s.toLowerCase().startsWith('insert'));
    for (const stmt of stmts) {
      try { await db.exec(stmt + ';'); } catch {}
    }
  }
  // Seed new permit types
  const newTypes = [
    "INSERT OR IGNORE INTO permit_types (code, name, description, base_fee, requires_inspection, review_days) VALUES ('ZCA', 'Zone Change / Amend Zoning Code', 'Application to amend zoning code or change zone', 350.00, 0, 30)",
    "INSERT OR IGNORE INTO permit_types (code, name, description, base_fee, requires_inspection, review_days) VALUES ('FPV', 'Floodplain Variance', 'Variance from floodplain regulations', 350.00, 0, 30)",
    "INSERT OR IGNORE INTO permit_types (code, name, description, base_fee, requires_inspection, review_days) VALUES ('PPL', 'Preliminary Plat Application', 'Subdivision preliminary plat review', 500.00, 0, 60)",
    "INSERT OR IGNORE INTO permit_types (code, name, description, base_fee, requires_inspection, review_days) VALUES ('FPL', 'Final Plat Application', 'Subdivision final plat approval', 300.00, 0, 30)",
    "INSERT OR IGNORE INTO permit_types (code, name, description, base_fee, requires_inspection, review_days) VALUES ('ANX', 'Annexation Application', 'Petition for annexation into city limits', 500.00, 0, 60)",
    "INSERT OR IGNORE INTO permit_types (code, name, description, base_fee, requires_inspection, review_days) VALUES ('VAC', 'Petition to Vacate/Abandon', 'Petition to vacate or abandon street or alley', 250.00, 0, 30)",
  ];
  for (const sql of newTypes) { try { await db.exec(sql); } catch {} }
  // Clean up expired sessions (fire and forget)
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run().catch(() => {});
  db.prepare("DELETE FROM rate_limits WHERE window_start < datetime('now', '-1 hour')").run().catch(() => {});
  _dbReady = true;
}

// Extract INSERT statements for a specific table from seed SQL
function extractInserts(sql, tableName) {
  const regex = new RegExp(`INSERT OR IGNORE INTO ${tableName}[^;]+;`, 'g');
  const matches = sql.match(regex) || [];
  return matches.map(s => s.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());
}

// Log an activity across any module
export async function logActivity(db, module, refId, userId, action, details) {
  await db.prepare(
    'INSERT INTO activity_log (module, ref_id, user_id, action, details) VALUES (?, ?, ?, ?, ?)'
  ).bind(module, refId, userId, action, details || null).run();
}

// Queue an email notification
export async function queueEmail(db, { to_email, to_name, subject, body_text, body_html, module, ref_id }) {
  await db.prepare(
    'INSERT INTO email_queue (to_email, to_name, subject, body_text, body_html, module, ref_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(to_email, to_name || null, subject, body_text || null, body_html || null, module || null, ref_id || null).run();
}

// Generate sequential number: PREFIX-YEAR-NNN
export async function nextNumber(db, table, column, prefix) {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;
  const last = await db.prepare(
    `SELECT ${column} FROM ${table} WHERE ${column} LIKE ? ORDER BY ${column} DESC LIMIT 1`
  ).bind(pattern).first();
  const lastNum = last ? parseInt(last[column].split('-').pop()) : 0;
  return `${prefix}-${year}-${String(lastNum + 1).padStart(3, '0')}`;
}
