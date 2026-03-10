// ==========================================================================
// PARK RESERVATIONS MODULE
// ==========================================================================

import { json, getUser, logActivity, queueEmail, nextNumber, requireAuth, parseBody, sanitize, validateInput, checkRateLimit, VALID_STATUSES } from './helpers.js';

export async function handleParks(method, path, url, request, db) {

  // GET /parks/facilities
  if (method === 'GET' && path === '/parks/facilities') {
    const results = await db.prepare('SELECT * FROM park_facilities WHERE is_active = 1 ORDER BY park_name, name').all();
    return json(results.results);
  }

  // GET /parks/reservations
  if (method === 'GET' && path === '/parks/reservations') {
    const status = url.searchParams.get('status');
    const facility = url.searchParams.get('facility_id');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    let query = `SELECT pr.*, pf.name as facility_name, pf.park_name
      FROM park_reservations pr JOIN park_facilities pf ON pr.facility_id = pf.id WHERE 1=1`;
    const b = [];

    if (status) { query += ' AND pr.status = ?'; b.push(status); }
    if (facility) { query += ' AND pr.facility_id = ?'; b.push(parseInt(facility)); }
    if (from) { query += ' AND pr.event_date >= ?'; b.push(from); }
    if (to) { query += ' AND pr.event_date <= ?'; b.push(to); }
    query += ' ORDER BY pr.event_date';

    const stmt = db.prepare(query);
    const results = b.length > 0 ? await stmt.bind(...b).all() : await stmt.all();
    return json(results.results);
  }

  // POST /parks/reservations — public
  if (method === 'POST' && path === '/parks/reservations') {
    const rl = await checkRateLimit(db, request, '/parks', 5, 1); if (rl) return rl;
    const { data, error: bodyErr } = await parseBody(request);
    if (bodyErr) return bodyErr;
    if (!data.facility_id || !data.event_date || !data.contact_name) return json({ error: 'facility_id, event_date, and contact_name required' }, 400);
    const valErr = validateInput(data, { contact_email: { email: true, label: 'Contact email' }, contact_phone: { phone: true, label: 'Phone' }, contact_name: { maxLen: 200, label: 'Contact name' }, event_name: { maxLen: 300, label: 'Event name' } });
    if (valErr) return json({ error: valErr }, 400);
    const facility = await db.prepare('SELECT * FROM park_facilities WHERE id = ?').bind(data.facility_id).first();
    if (!facility) return json({ error: 'Invalid facility' }, 400);

    // Check for conflicts on same date + facility
    const conflict = await db.prepare(
      "SELECT id FROM park_reservations WHERE facility_id = ? AND event_date = ? AND status != 'denied' AND status != 'cancelled'"
    ).bind(data.facility_id, data.event_date).first();
    if (conflict) return json({ error: 'This facility is already reserved on that date' }, 409);

    const resNum = await nextNumber(db, 'park_reservations', 'reservation_number', 'PR');
    const totalFee = facility.daily_rate || (facility.hourly_rate * (parseFloat(data.hours) || 1));

    const result = await db.prepare(`
      INSERT INTO park_reservations (reservation_number, facility_id, contact_name, contact_phone, contact_email,
        event_name, event_description, event_date, start_time, end_time,
        attendee_count, status, total_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      resNum, data.facility_id, data.contact_name, data.contact_phone || null, data.contact_email || null,
      data.event_name || null, data.event_description || null,
      data.event_date, data.start_time || null, data.end_time || null,
      data.attendee_count || null, totalFee
    ).run();

    const resId = result.meta.last_row_id;
    await logActivity(db, 'parks', resId, null, 'Reservation submitted', `${facility.name} on ${data.event_date}`);

    // Add to deadlines/calendar
    await db.prepare("INSERT INTO deadlines (module, ref_id, title, due_date, deadline_type, description) VALUES ('parks', ?, ?, ?, 'event', ?)")
      .bind(resId, `${data.event_name || 'Park Reservation'} - ${facility.name}`, data.event_date, `${data.contact_name} - ${data.attendee_count || '?'} guests`).run();

    await queueEmail(db, {
      to_email: 'cturner@threeforksmt.gov', to_name: 'Crystal Turner',
      subject: `New Park Reservation: ${resNum}`,
      body_text: `${data.contact_name} requested ${facility.name} on ${data.event_date} for "${data.event_name || 'event'}"`,
      module: 'parks', ref_id: resId,
    });

    return json({ id: resId, reservation_number: resNum, total_fee: totalFee }, 201);
  }

  // GET /parks/reservations/:id
  const idMatch = path.match(/^\/parks\/reservations\/(\d+)$/);
  if (method === 'GET' && idMatch) {
    const resId = parseInt(idMatch[1]);
    const res = await db.prepare(`
      SELECT pr.*, pf.name as facility_name, pf.park_name, pf.amenities, pf.rules
      FROM park_reservations pr JOIN park_facilities pf ON pr.facility_id = pf.id WHERE pr.id = ?
    `).bind(resId).first();
    if (!res) return json({ error: 'Reservation not found' }, 404);

    const [activity, payments] = await Promise.all([
      db.prepare("SELECT al.*, u.first_name, u.last_name FROM activity_log al LEFT JOIN users u ON al.user_id = u.id WHERE al.module = 'parks' AND al.ref_id = ? ORDER BY al.created_at DESC").bind(resId).all(),
      db.prepare("SELECT * FROM fee_payments WHERE module = 'parks' AND ref_id = ? ORDER BY received_at DESC").bind(resId).all(),
    ]);

    return json({ ...res, activity: activity.results, payments: payments.results });
  }

  // PUT /parks/reservations/:id — staff only
  if (method === 'PUT' && idMatch) {
    const auth = await requireAuth(request, db);
    if (auth.error) return auth.error;
    const resId = parseInt(idMatch[1]);
    const { data, error: bodyErr } = await parseBody(request);
    if (bodyErr) return bodyErr;
    if (data.status && !VALID_STATUSES.parks.includes(data.status)) return json({ error: 'Invalid status' }, 400);
    const user = auth.user;

    const updates = [], bindings = [];
    const allowed = ['status', 'contact_name', 'contact_phone', 'contact_email', 'event_name', 'event_description', 'event_date', 'start_time', 'end_time', 'attendee_count', 'staff_notes', 'fees_paid'];
    for (const f of allowed) {
      if (f in data) { updates.push(`${f} = ?`); bindings.push(data[f]); }
    }
    updates.push("updated_at = datetime('now')");
    bindings.push(resId);

    await db.prepare(`UPDATE park_reservations SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
    await logActivity(db, 'parks', resId, user?.id, data.status ? `Status: ${data.status}` : 'Reservation updated', null);

    // Email contact on status change
    if (data.status) {
      const res = await db.prepare('SELECT contact_email, contact_name, reservation_number FROM park_reservations WHERE id = ?').bind(resId).first();
      if (res?.contact_email) {
        await queueEmail(db, {
          to_email: res.contact_email, to_name: res.contact_name,
          subject: `Park Reservation ${res.reservation_number} — ${data.status.toUpperCase()}`,
          body_text: `Your park reservation ${res.reservation_number} has been ${data.status}.`,
          module: 'parks', ref_id: resId,
        });
      }
    }

    return json({ success: true });
  }

  // POST /parks/reservations/:id/payments
  const payMatch = path.match(/^\/parks\/reservations\/(\d+)\/payments$/);
  if (payMatch) {
    const resId = parseInt(payMatch[1]);
    if (method === 'POST') {
      const data = await request.json();
      const user = await getUser(request, db);
      await db.prepare("INSERT INTO fee_payments (module, ref_id, amount, payment_method, reference_number, received_by) VALUES ('parks', ?, ?, ?, ?, ?)")
        .bind(resId, data.amount, data.payment_method || 'other', data.reference_number || null, user?.id || null).run();
      const totalPaid = await db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fee_payments WHERE module = 'parks' AND ref_id = ?").bind(resId).first();
      await db.prepare('UPDATE park_reservations SET fees_paid = ?, updated_at = datetime("now") WHERE id = ?').bind(totalPaid.total, resId).run();
      return json({ total_paid: totalPaid.total }, 201);
    }
  }

  // GET /parks/availability?facility_id=X&month=2026-06
  if (method === 'GET' && path === '/parks/availability') {
    const facilityId = url.searchParams.get('facility_id');
    const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);

    const reservations = await db.prepare(`
      SELECT event_date, status, event_name, start_time, end_time
      FROM park_reservations
      WHERE facility_id = ? AND event_date LIKE ? AND status != 'denied' AND status != 'cancelled'
      ORDER BY event_date
    `).bind(facilityId, `${month}%`).all();

    return json(reservations.results);
  }

  return null;
}
