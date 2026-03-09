// ==========================================================================
// SHARED HELPERS — auth, JSON response, DB init, email queue
// ==========================================================================

import { INIT_SQL, MIGRATION_SQL } from './schema.js';
import { SEED_SQL } from './seed.js';

export const CITY_CONFIG = {
  city_name: 'Three Forks',
  city_state: 'MT',
  map_center: [-111.5513, 45.8930],
  map_zoom: 14,
  mapbox_token: 'pk.eyJ1IjoiaXRvZ2VvIiwiYSI6ImNta3ByYnA1bzBsYW0zZG9mMnMxdWZwMjUifQ.Q7pwAuAEKdBHD_dqaVBhvw',
  county: 'Gallatin',
};

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
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

export async function ensureDB(db) {
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
  ];
  for (const sql of colMigrations) {
    try { await db.exec(sql); } catch {}
  }
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
