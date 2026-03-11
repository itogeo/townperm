// ==========================================================================
// Three Forks City Management Platform — Main API Router
// Cloudflare Pages Functions catch-all for /api/* routes
// ==========================================================================

import { getCityConfig, json, getCookie, getUser, ensureDB, logActivity, requireAuth, parseBody, verifyPassword, checkRateLimit, VALID_STATUSES } from './lib/helpers.js';
import { handlePermits } from './lib/permits.js';
import { handleLicenses } from './lib/licenses.js';
import { handleParks } from './lib/parks.js';
import { handleRequests } from './lib/requests.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = '/' + (params.path?.join('/') || '');
  const method = request.method;
  const db = env.DB;

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
  }

  try {
    await ensureDB(db);

    // ==================================================================
    // CONFIG
    // ==================================================================
    if (method === 'GET' && path === '/config') {
      return json(getCityConfig(env));
    }

    // ==================================================================
    // AUTH
    // ==================================================================
    if (method === 'POST' && path === '/auth/login') {
      const rl = await checkRateLimit(db, request, '/auth/login', 5, 1); if (rl) return rl;
      const data = await request.json();
      if (!data.password) return json({ error: 'Password required' }, 401);
      const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(data.email || '').first();
      if (!user || !(await verifyPassword(data.password, user.password_hash))) return json({ error: 'Invalid credentials' }, 401);

      const token = crypto.randomUUID();
      await db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").bind(token, user.id).run();
      await db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").bind(user.id).run();

      return new Response(JSON.stringify({
        id: user.id, email: user.email, role: user.role,
        first_name: user.first_name, last_name: user.last_name, title: user.title,
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session=${token}; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`,
        },
      });
    }

    if (method === 'POST' && path === '/auth/logout') {
      const token = getCookie(request, 'session');
      if (token) await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'session=; HttpOnly; Path=/; Max-Age=0' },
      });
    }

    if (method === 'GET' && path === '/auth/me') {
      return json(await getUser(request, db));
    }

    // ==================================================================
    // PERMITS MODULE — /permits/*, /inspections/*, /permit-types
    // ==================================================================
    if (path.startsWith('/permits') || path.startsWith('/inspections') || path === '/permit-types') {
      if (path === '/permit-types' && method === 'GET') {
        const types = await db.prepare('SELECT * FROM permit_types WHERE is_active = 1 ORDER BY code').all();
        return json(types.results);
      }
      const result = await handlePermits(method, path, url, request, db);
      if (result) return result;
    }

    // ==================================================================
    // BUSINESS LICENSES MODULE — /licenses/*, /license-types
    // ==================================================================
    if (path.startsWith('/licenses') || path === '/license-types') {
      if (path === '/license-types') {
        const types = await db.prepare('SELECT * FROM license_types WHERE is_active = 1 ORDER BY name').all();
        return json(types.results);
      }
      const result = await handleLicenses(method, path, url, request, db);
      if (result) return result;
    }

    // ==================================================================
    // PARKS MODULE — /parks/*
    // ==================================================================
    if (path.startsWith('/parks')) {
      const result = await handleParks(method, path, url, request, db);
      if (result) return result;
    }

    // ==================================================================
    // CITIZEN REQUESTS MODULE — /requests/*, /request-categories
    // ==================================================================
    if (path.startsWith('/requests') || path === '/request-categories') {
      if (path === '/request-categories') {
        const cats = await db.prepare('SELECT * FROM request_categories WHERE is_active = 1 ORDER BY name').all();
        return json(cats.results);
      }
      const result = await handleRequests(method, path, url, request, db);
      if (result) return result;
    }

    // ==================================================================
    // GENERIC FORMS — /forms (dog, chicken, board, traffic, security, etc.)
    // ==================================================================
    if (path.startsWith('/forms')) {
      if (method === 'POST' && path === '/forms') {
        const rl = await checkRateLimit(db, request, '/forms', 10, 1); if (rl) return rl;
        const body = await request.json();
        if (!body.form_type || !body.data) return json({ error: 'form_type and data required' }, 400);
        if (JSON.stringify(body.data).length > 50000) return json({ error: 'Form data too large' }, 400);
        const num = 'GF-' + Date.now().toString(36).toUpperCase();
        await db.prepare('INSERT INTO form_submissions (submission_number, form_type, form_name, data, submitted_at) VALUES (?, ?, ?, ?, datetime("now"))').bind(num, body.form_type, body.form_name || body.form_type, JSON.stringify(body.data)).run();
        return json({ submission_number: num, message: 'Form submitted successfully' }, 201);
      }
      if (method === 'GET' && path === '/forms/map') {
        const user = await getUser(request, db);
        if (!user) return json({ error: 'Unauthorized' }, 401);
        const q = await db.prepare("SELECT id, submission_number, form_type, form_name, status, submitted_at, data FROM form_submissions WHERE form_type IN ('DOG','CHK') ORDER BY submitted_at DESC").all();
        const items = q.results.map(r => {
          const d = JSON.parse(r.data || '{}');
          return { id: r.id, number: r.submission_number, type: r.form_type, name: r.form_name, status: r.status, submitted: r.submitted_at, address: d.address || '', owner: d.owner_name || d.applicant_name || '', latitude: d.latitude || null, longitude: d.longitude || null, extra: r.form_type === 'DOG' ? `${d.dog_name || ''} — ${d.breed || ''}` : `${d.num_chickens || '?'} chickens` };
        }).filter(r => r.latitude && r.longitude);
        return json(items);
      }
      if (method === 'GET' && path === '/forms') {
        const user = await getUser(request, db);
        if (!user) return json({ error: 'Unauthorized' }, 401);
        const type = url.searchParams.get('type');
        const q = type ? await db.prepare('SELECT * FROM form_submissions WHERE form_type = ? ORDER BY submitted_at DESC').bind(type).all()
          : await db.prepare('SELECT * FROM form_submissions ORDER BY submitted_at DESC LIMIT 200').all();
        return json(q.results.map(r => ({ ...r, data: JSON.parse(r.data || '{}') })));
      }
      const formIdMatch = path.match(/^\/forms\/(\d+)$/);
      if (method === 'PUT' && formIdMatch) {
        const auth = await requireAuth(request, db);
        if (auth.error) return auth.error;
        const id = parseInt(formIdMatch[1]);
        const body = await request.json();
        const sets = [], vals = [];
        if (body.status) { sets.push('status = ?'); vals.push(body.status); }
        if (body.staff_notes !== undefined) { sets.push('staff_notes = ?'); vals.push(body.staff_notes); }
        if (body.status === 'reviewed') { sets.push("reviewed_at = datetime('now')"); sets.push('reviewed_by = ?'); vals.push(auth.user.id); }
        if (!sets.length) return json({ error: 'No updates' }, 400);
        vals.push(id);
        await db.prepare(`UPDATE form_submissions SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
        await logActivity(db, 'forms', id, `Form ${body.status || 'updated'}`, null, auth.user.id);
        return json({ success: true });
      }
    }

    // ==================================================================
    // PUBLIC LOOKUP — check application status by tracking number
    // ==================================================================
    if (method === 'GET' && path === '/lookup') {
      const number = (url.searchParams.get('number') || '').trim().toUpperCase();
      const email = (url.searchParams.get('email') || '').trim().toLowerCase();
      if (!number) return json({ error: 'Tracking number required' }, 400);

      let result = null, type = null;

      // Detect type from prefix and search appropriate table
      if (number.startsWith('ZP-') || number.startsWith('FP-') || number.startsWith('CUP-') || number.startsWith('VAR-') || number.startsWith('SUB-') || number.startsWith('WSC-') || number.startsWith('ZCA-') || number.startsWith('FPV-') || number.startsWith('PPL-') || number.startsWith('FPL-') || number.startsWith('ANX-') || number.startsWith('VAC-')) {
        const row = await db.prepare(`SELECT p.permit_number, p.status, p.address, p.applicant_name, p.applicant_email, p.submitted_at, p.decision_date, p.conditions, p.denial_reason, p.fees_calculated, p.fees_paid, pt.name as type_name FROM permits p JOIN permit_types pt ON p.permit_type_id = pt.id WHERE UPPER(p.permit_number) = ?`).bind(number).first();
        if (row) { result = row; type = 'permit'; }
      } else if (number.startsWith('BL-')) {
        const row = await db.prepare(`SELECT bl.license_number, bl.status, bl.business_name, bl.owner_name, bl.owner_email, bl.created_at, bl.issued_date, bl.expiration_date, bl.annual_fee, bl.fees_paid, lt.name as type_name FROM business_licenses bl JOIN license_types lt ON bl.license_type_id = lt.id WHERE UPPER(bl.license_number) = ?`).bind(number).first();
        if (row) { result = row; type = 'license'; }
      } else if (number.startsWith('PR-')) {
        const row = await db.prepare(`SELECT pr.reservation_number, pr.status, pr.event_name, pr.event_date, pr.start_time, pr.end_time, pr.contact_name, pr.contact_email, pr.total_fee, pr.fees_paid, pf.name as facility_name, pf.park_name FROM park_reservations pr JOIN park_facilities pf ON pr.facility_id = pf.id WHERE UPPER(pr.reservation_number) = ?`).bind(number).first();
        if (row) { result = row; type = 'reservation'; }
      } else if (number.startsWith('CR-')) {
        const row = await db.prepare(`SELECT cr.request_number, cr.status, cr.address, cr.description, cr.reporter_name, cr.reporter_email, cr.created_at, cr.resolved_at, cr.resolution, rc.name as category_name FROM citizen_requests cr JOIN request_categories rc ON cr.category_id = rc.id WHERE UPPER(cr.request_number) = ?`).bind(number).first();
        if (row) { result = row; type = 'request'; }
      } else if (number.startsWith('GF-')) {
        const row = await db.prepare(`SELECT submission_number, form_type, form_name, status, submitted_at, reviewed_at, staff_notes FROM form_submissions WHERE UPPER(submission_number) = ?`).bind(number).first();
        if (row) { result = row; type = 'form'; }
      }

      if (!result) return json({ error: 'No application found with that tracking number' }, 404);

      // Verify email if provided (privacy check)
      const storedEmail = result.applicant_email || result.owner_email || result.contact_email || result.reporter_email || '';
      if (email && storedEmail.toLowerCase() !== email) return json({ error: 'Email does not match our records for this application' }, 403);

      // Get activity timeline (public-safe: no user names, no internal notes)
      const emailCol = type === 'permit' ? 'permits' : type === 'license' ? 'licenses' : type === 'reservation' ? 'parks' : 'requests';
      const refId = await db.prepare(`SELECT id FROM ${type === 'permit' ? 'permits' : type === 'license' ? 'business_licenses' : type === 'reservation' ? 'park_reservations' : 'citizen_requests'} WHERE ${type === 'permit' ? 'permit_number' : type === 'license' ? 'license_number' : type === 'reservation' ? 'reservation_number' : 'request_number'} = ?`).bind(number).first();
      const activity = refId ? await db.prepare("SELECT action, created_at FROM activity_log WHERE module = ? AND ref_id = ? ORDER BY created_at DESC LIMIT 10").bind(emailCol, refId.id).all() : { results: [] };

      // Strip email fields from response for privacy
      delete result.applicant_email; delete result.owner_email; delete result.contact_email; delete result.reporter_email;

      return json({ type, ...result, timeline: activity.results });
    }

    // ==================================================================
    // DOCUMENTS DOWNLOAD
    // ==================================================================
    const dlMatch = path.match(/^\/documents\/(\d+)\/download$/);
    if (method === 'GET' && dlMatch) {
      const auth = await requireAuth(request, db);
      if (auth.error) return auth.error;
      const doc = await db.prepare('SELECT filename, doc_type, file_data FROM documents WHERE id = ?').bind(parseInt(dlMatch[1])).first();
      if (!doc) return json({ error: 'Not found' }, 404);
      if (!doc.file_data) return json({ error: 'No file data stored' }, 404);
      return json({ filename: doc.filename, doc_type: doc.doc_type, file_data: doc.file_data });
    }

    // ==================================================================
    // UNIFIED CALENDAR — events from all modules
    // ==================================================================
    if (method === 'GET' && path === '/calendar') {
      const auth = await requireAuth(request, db);
      if (auth.error) return auth.error;
      const start = url.searchParams.get('start') || new Date().toISOString().split('T')[0];
      const end = url.searchParams.get('end') || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

      const [inspections, deadlines, reservations] = await Promise.all([
        db.prepare(`
          SELECT i.*, p.permit_number, p.address, p.applicant_name,
            u.first_name as inspector_first, u.last_name as inspector_last
          FROM inspections i JOIN permits p ON i.permit_id = p.id
          LEFT JOIN users u ON i.inspector_id = u.id
          WHERE i.scheduled_date BETWEEN ? AND ? AND i.status != 'cancelled'
          ORDER BY i.scheduled_date
        `).bind(start, end).all(),
        db.prepare(`
          SELECT d.* FROM deadlines d
          WHERE d.due_date BETWEEN ? AND ? AND d.is_completed = 0
          ORDER BY d.due_date
        `).bind(start, end).all(),
        db.prepare(`
          SELECT pr.*, pf.name as facility_name, pf.park_name
          FROM park_reservations pr JOIN park_facilities pf ON pr.facility_id = pf.id
          WHERE pr.event_date BETWEEN ? AND ? AND pr.status != 'denied' AND pr.status != 'cancelled'
          ORDER BY pr.event_date
        `).bind(start, end).all(),
      ]);

      const events = [
        ...inspections.results.map(i => ({
          id: `insp-${i.id}`, type: 'inspection', module: 'permits',
          title: `${i.inspection_type} - ${i.permit_number}`,
          date: i.scheduled_date, status: i.status,
          address: i.address, applicant: i.applicant_name,
          inspector: i.inspector_first ? `${i.inspector_first} ${i.inspector_last}` : null,
        })),
        ...deadlines.results.map(d => ({
          id: `dl-${d.id}`, type: d.deadline_type, module: d.module || 'permits',
          title: d.title, date: d.due_date, description: d.description,
        })),
        ...reservations.results.map(r => ({
          id: `res-${r.id}`, type: 'reservation', module: 'parks',
          title: `${r.event_name || 'Reservation'} - ${r.facility_name}`,
          date: r.event_date, status: r.status,
          address: r.park_name, applicant: r.contact_name,
        })),
      ].sort((a, b) => a.date.localeCompare(b.date));

      return json(events);
    }

    // ==================================================================
    // UNIFIED ACTIVITY FEED
    // ==================================================================
    if (method === 'GET' && path === '/activity') {
      const auth = await requireAuth(request, db);
      if (auth.error) return auth.error;
      const limit = parseInt(url.searchParams.get('limit') || '30');
      const module = url.searchParams.get('module');
      let query = `SELECT al.*, u.first_name, u.last_name FROM activity_log al
        LEFT JOIN users u ON al.user_id = u.id`;
      const b = [];
      if (module) { query += ' WHERE al.module = ?'; b.push(module); }
      query += ' ORDER BY al.created_at DESC LIMIT ?';
      b.push(limit);
      const results = await db.prepare(query).bind(...b).all();
      return json(results.results);
    }

    // ==================================================================
    // DEADLINES
    // ==================================================================
    if (method === 'POST' && path === '/deadlines') {
      const auth = await requireAuth(request, db);
      if (auth.error) return auth.error;
      const { data, error: bodyErr } = await parseBody(request);
      if (bodyErr) return bodyErr;
      const result = await db.prepare(
        'INSERT INTO deadlines (module, ref_id, title, due_date, deadline_type, description) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(data.module || 'permits', data.ref_id || null, data.title, data.due_date, data.deadline_type || 'other', data.description || null).run();
      return json({ id: result.meta.last_row_id }, 201);
    }

    const dlUpdateMatch = path.match(/^\/deadlines\/(\d+)$/);
    if (method === 'PUT' && dlUpdateMatch) {
      const auth = await requireAuth(request, db);
      if (auth.error) return auth.error;
      const dlId = parseInt(dlUpdateMatch[1]);
      const { data, error: bodyErr } = await parseBody(request);
      if (bodyErr) return bodyErr;
      if (data.is_completed) await db.prepare("UPDATE deadlines SET is_completed = 1, completed_at = datetime('now') WHERE id = ?").bind(dlId).run();
      if (data.due_date) await db.prepare('UPDATE deadlines SET due_date = ? WHERE id = ?').bind(data.due_date, dlId).run();
      return json({ success: true });
    }

    // ==================================================================
    // PARCELS
    // ==================================================================
    if (method === 'GET' && path === '/parcels') {
      const bbox = url.searchParams.get('bbox');
      let query = 'SELECT * FROM parcels';
      const b = [];
      if (bbox) {
        const [west, south, east, north] = bbox.split(',').map(Number);
        query += ' WHERE centroid_lng BETWEEN ? AND ? AND centroid_lat BETWEEN ? AND ?';
        b.push(west, east, south, north);
      }
      const parcels = b.length > 0 ? await db.prepare(query).bind(...b).all() : await db.prepare(query).all();
      const features = parcels.results.map(p => ({
        type: 'Feature',
        properties: { parcel_id: p.parcel_id, address: p.address, owner: p.owner_name, acres: p.acres, zoning: p.zoning, assessed_value: p.assessed_value },
        geometry: p.geometry_json ? JSON.parse(p.geometry_json) : null,
      }));
      return json({ type: 'FeatureCollection', features });
    }

    const parcelIdMatch = path.match(/^\/parcels\/([^/]+)$/);
    if (method === 'GET' && parcelIdMatch) {
      const parcel = await db.prepare('SELECT * FROM parcels WHERE parcel_id = ?').bind(parcelIdMatch[1]).first();
      if (!parcel) return json({ error: 'Parcel not found' }, 404);
      const permits = await db.prepare('SELECT p.*, pt.name as type_name, pt.code as type_code FROM permits p JOIN permit_types pt ON p.permit_type_id = pt.id WHERE p.parcel_id = ? ORDER BY p.submitted_at DESC').bind(parcelIdMatch[1]).all();
      return json({ ...parcel, geometry: parcel.geometry_json ? JSON.parse(parcel.geometry_json) : null, permits: permits.results });
    }

    // ==================================================================
    // MAP ENDPOINTS
    // ==================================================================
    if (method === 'GET' && path === '/map/permits') {
      const statusFilter = url.searchParams.get('status') || 'active';
      const clause = statusFilter === 'active' ? "p.status IN ('pending', 'under_review', 'approved')" : '1=1';
      const permits = await db.prepare(`SELECT p.*, pt.code as type_code, pt.name as type_name FROM permits p JOIN permit_types pt ON p.permit_type_id = pt.id WHERE ${clause} AND p.latitude IS NOT NULL`).all();
      const features = permits.results.map(p => ({
        type: 'Feature',
        properties: { id: p.permit_number, type: p.type_name, typeCode: p.type_code, address: p.address, applicant: p.applicant_name, status: p.status, valuation: p.valuation, submitted: p.submitted_at },
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
      }));
      return json({ type: 'FeatureCollection', features });
    }

    // ==================================================================
    // UNIFIED STATS — all modules
    // ==================================================================
    if (method === 'GET' && path === '/stats') {
      const auth = await requireAuth(request, db);
      if (auth.error) return auth.error;
      const [pTotal, pPending, pReview, pApproved, pDenied, pVal, pFeesDue, pFeesCollected] = await Promise.all([
        db.prepare('SELECT COUNT(*) as c FROM permits').first(),
        db.prepare("SELECT COUNT(*) as c FROM permits WHERE status = 'pending'").first(),
        db.prepare("SELECT COUNT(*) as c FROM permits WHERE status = 'under_review'").first(),
        db.prepare("SELECT COUNT(*) as c FROM permits WHERE status = 'approved'").first(),
        db.prepare("SELECT COUNT(*) as c FROM permits WHERE status = 'denied'").first(),
        db.prepare('SELECT COALESCE(SUM(valuation), 0) as v FROM permits').first(),
        db.prepare('SELECT COALESCE(SUM(fees_calculated), 0) as v FROM permits').first(),
        db.prepare("SELECT COALESCE(SUM(amount), 0) as v FROM fee_payments WHERE module = 'permits'").first(),
      ]);

      const [byType, avgProc, upInsp, overdueDeadlines] = await Promise.all([
        db.prepare('SELECT pt.name, pt.code, COUNT(*) as count, SUM(p.valuation) as total_value FROM permits p JOIN permit_types pt ON p.permit_type_id = pt.id GROUP BY pt.id ORDER BY count DESC').all(),
        db.prepare('SELECT AVG(julianday(decision_date) - julianday(submitted_at)) as avg_days FROM permits WHERE decision_date IS NOT NULL').first(),
        db.prepare("SELECT COUNT(*) as c FROM inspections WHERE status = 'scheduled' AND scheduled_date >= date('now')").first(),
        db.prepare("SELECT COUNT(*) as c FROM deadlines WHERE is_completed = 0 AND due_date < date('now')").first(),
      ]);

      // License stats
      const [lTotal, lActive, lPending] = await Promise.all([
        db.prepare('SELECT COUNT(*) as c FROM business_licenses').first(),
        db.prepare("SELECT COUNT(*) as c FROM business_licenses WHERE status = 'active'").first(),
        db.prepare("SELECT COUNT(*) as c FROM business_licenses WHERE status = 'pending'").first(),
      ]);

      // Request stats
      const [rTotal, rOpen, rResolved] = await Promise.all([
        db.prepare('SELECT COUNT(*) as c FROM citizen_requests').first(),
        db.prepare("SELECT COUNT(*) as c FROM citizen_requests WHERE status IN ('submitted', 'in_progress')").first(),
        db.prepare("SELECT COUNT(*) as c FROM citizen_requests WHERE status = 'resolved'").first(),
      ]);

      // Park stats
      const [parkTotal, parkUpcoming] = await Promise.all([
        db.prepare('SELECT COUNT(*) as c FROM park_reservations').first(),
        db.prepare("SELECT COUNT(*) as c FROM park_reservations WHERE event_date >= date('now') AND status = 'approved'").first(),
      ]);

      return json({
        permits: {
          total: pTotal.c, pending: pPending.c, under_review: pReview.c,
          approved: pApproved.c, denied: pDenied.c,
          total_valuation: pVal.v, fees_due: pFeesDue.v, fees_collected: pFeesCollected.v,
          fees_outstanding: pFeesDue.v - pFeesCollected.v,
          avg_processing_days: avgProc?.avg_days ? Math.round(avgProc.avg_days) : null,
          upcoming_inspections: upInsp.c, overdue_deadlines: overdueDeadlines.c,
          by_type: byType.results.map(r => ({ name: r.name, code: r.code, count: r.count, value: r.total_value })),
        },
        licenses: { total: lTotal.c, active: lActive.c, pending: lPending.c },
        requests: { total: rTotal.c, open: rOpen.c, resolved: rResolved.c },
        parks: { total: parkTotal.c, upcoming: parkUpcoming.c },
        // Backwards-compatible flat fields for existing frontend
        total: pTotal.c, pending: pPending.c, under_review: pReview.c,
        approved: pApproved.c, denied: pDenied.c,
        total_valuation: pVal.v, fees_due: pFeesDue.v,
        fees_collected: pFeesCollected.v, fees_outstanding: pFeesDue.v - pFeesCollected.v,
        avg_processing_days: avgProc?.avg_days ? Math.round(avgProc.avg_days) : null,
        upcoming_inspections: upInsp.c, overdue_deadlines: overdueDeadlines.c,
        by_type: byType.results.map(r => ({ name: r.name, code: r.code, count: r.count, value: r.total_value })),
      });
    }

    // ==================================================================
    // STAFF
    // ==================================================================
    if (method === 'GET' && path === '/staff') {
      const auth = await requireAuth(request, db);
      if (auth.error) return auth.error;
      const staff = await db.prepare("SELECT id, email, first_name, last_name, title, role, phone FROM users WHERE role IN ('admin', 'staff') AND is_active = 1").all();
      return json(staff.results);
    }

    // ==================================================================
    // EMAIL QUEUE — check pending emails (for future worker integration)
    // ==================================================================
    if (method === 'GET' && path === '/emails/pending') {
      const user = await getUser(request, db);
      if (!user || user.role !== 'admin') return json({ error: 'Unauthorized' }, 403);
      const emails = await db.prepare("SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at LIMIT 50").all();
      return json(emails.results);
    }

    // ==================================================================
    // DEBUG — public DB counts (remove after testing)
    // ==================================================================
    if (method === 'GET' && path === '/debug/counts') {
      const [p, l, r, f, cr] = await Promise.all([
        db.prepare('SELECT COUNT(*) as c FROM permits').first(),
        db.prepare('SELECT COUNT(*) as c FROM business_licenses').first(),
        db.prepare('SELECT COUNT(*) as c FROM park_reservations').first(),
        db.prepare('SELECT COUNT(*) as c FROM form_submissions').first(),
        db.prepare('SELECT COUNT(*) as c FROM citizen_requests').first(),
      ]);
      return json({ permits: p.c, licenses: l.c, reservations: r.c, form_submissions: f.c, citizen_requests: cr.c });
    }

    // 404
    return json({ error: 'Not found', path }, 404);

  } catch (error) {
    console.error('API Error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}
