// ==========================================================================
// BUSINESS LICENSES MODULE
// ==========================================================================

import { json, getUser, logActivity, queueEmail, nextNumber, requireAuth, parseBody, sanitize, validateInput, checkRateLimit, VALID_STATUSES } from './helpers.js';

export async function handleLicenses(method, path, url, request, db) {

  // GET /licenses
  if (method === 'GET' && path === '/licenses') {
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search') || '';

    let query = `SELECT bl.*, lt.code as type_code, lt.name as type_name
      FROM business_licenses bl JOIN license_types lt ON bl.license_type_id = lt.id WHERE 1=1`;
    const b = [];

    if (status) { query += ' AND bl.status = ?'; b.push(status); }
    if (search) {
      query += ' AND (bl.business_name LIKE ? OR bl.license_number LIKE ? OR bl.owner_name LIKE ? OR bl.address LIKE ?)';
      b.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY bl.created_at DESC';

    const stmt = db.prepare(query);
    const results = b.length > 0 ? await stmt.bind(...b).all() : await stmt.all();
    return json(results.results);
  }

  // POST /licenses — public
  if (method === 'POST' && path === '/licenses') {
    const rl = await checkRateLimit(db, request, '/licenses', 5, 1); if (rl) return rl;
    const { data, error: bodyErr } = await parseBody(request);
    if (bodyErr) return bodyErr;
    if (!data.business_name?.trim()) return json({ error: 'Business name required' }, 400);
    const valErr = validateInput(data, { owner_email: { email: true, label: 'Owner email' }, owner_phone: { phone: true, label: 'Phone' }, business_name: { maxLen: 300, label: 'Business name' } });
    if (valErr) return json({ error: valErr }, 400);
    const licType = await db.prepare('SELECT * FROM license_types WHERE id = ? OR code = ?')
      .bind(data.license_type_id || 0, data.license_type_code || '').first();
    if (!licType) return json({ error: 'Invalid license type' }, 400);

    const licNum = await nextNumber(db, 'business_licenses', 'license_number', 'BL');

    const result = await db.prepare(`
      INSERT INTO business_licenses (license_number, license_type_id, business_name, dba_name,
        owner_name, owner_phone, owner_email, address, mailing_address,
        description, employee_count, status, annual_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      licNum, licType.id, data.business_name, data.dba_name || null,
      data.owner_name || null, data.owner_phone || null, data.owner_email || null,
      data.address || null, data.mailing_address || null,
      data.description || null, data.employee_count || null,
      licType.annual_fee
    ).run();

    const licId = result.meta.last_row_id;
    await logActivity(db, 'licenses', licId, null, 'License application submitted', `${licType.name} for ${data.business_name}`);

    await queueEmail(db, {
      to_email: 'cturner@threeforksmt.gov', to_name: 'Crystal Turner',
      subject: `New Business License Application: ${licNum}`,
      body_text: `New ${licType.name} application from ${data.business_name} at ${data.address || 'N/A'}`,
      module: 'licenses', ref_id: licId,
    });

    return json({ id: licId, license_number: licNum, annual_fee: licType.annual_fee }, 201);
  }

  // GET /licenses/:id
  const idMatch = path.match(/^\/licenses\/(\d+)$/);
  if (method === 'GET' && idMatch) {
    const licId = parseInt(idMatch[1]);
    const lic = await db.prepare(`
      SELECT bl.*, lt.code as type_code, lt.name as type_name, lt.requires_inspection
      FROM business_licenses bl JOIN license_types lt ON bl.license_type_id = lt.id WHERE bl.id = ?
    `).bind(licId).first();
    if (!lic) return json({ error: 'License not found' }, 404);

    const [activity, comments, payments, documents] = await Promise.all([
      db.prepare("SELECT al.*, u.first_name, u.last_name FROM activity_log al LEFT JOIN users u ON al.user_id = u.id WHERE al.module = 'licenses' AND al.ref_id = ? ORDER BY al.created_at DESC").bind(licId).all(),
      db.prepare("SELECT c.*, u.first_name, u.last_name FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.module = 'licenses' AND c.ref_id = ? ORDER BY c.created_at DESC").bind(licId).all(),
      db.prepare("SELECT fp.* FROM fee_payments fp WHERE fp.module = 'licenses' AND fp.ref_id = ? ORDER BY fp.received_at DESC").bind(licId).all(),
      db.prepare("SELECT id, filename, doc_type, file_size, notes, created_at FROM documents WHERE module = 'licenses' AND ref_id = ? ORDER BY created_at DESC").bind(licId).all(),
    ]);

    return json({ ...lic, activity: activity.results, comments: comments.results, payments: payments.results, documents: documents.results });
  }

  // PUT /licenses/:id — staff only
  if (method === 'PUT' && idMatch) {
    const auth = await requireAuth(request, db);
    if (auth.error) return auth.error;
    const licId = parseInt(idMatch[1]);
    const { data, error: bodyErr } = await parseBody(request);
    if (bodyErr) return bodyErr;
    if (data.status && !VALID_STATUSES.licenses.includes(data.status)) return json({ error: `Invalid status` }, 400);
    const user = auth.user;

    const updates = [], bindings = [];
    const allowed = ['status', 'business_name', 'dba_name', 'owner_name', 'owner_phone', 'owner_email', 'address', 'mailing_address', 'description', 'employee_count', 'notes', 'fees_paid', 'issued_date', 'expiration_date'];
    for (const f of allowed) {
      if (f in data) { updates.push(`${f} = ?`); bindings.push(data[f]); }
    }

    if (data.status === 'active' && !data.issued_date) {
      updates.push("issued_date = date('now')");
      updates.push("expiration_date = date('now', '+1 year')");
    }
    updates.push("updated_at = datetime('now')");
    bindings.push(licId);

    await db.prepare(`UPDATE business_licenses SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
    await logActivity(db, 'licenses', licId, user?.id, data.status ? `Status: ${data.status}` : 'License updated', JSON.stringify(data));

    // Create renewal deadline on activation
    if (data.status === 'active') {
      const lic = await db.prepare('SELECT license_number, expiration_date FROM business_licenses WHERE id = ?').bind(licId).first();
      if (lic?.expiration_date) {
        await db.prepare("INSERT INTO deadlines (module, ref_id, title, due_date, deadline_type, description) VALUES ('licenses', ?, ?, ?, 'renewal', 'Annual license renewal due')")
          .bind(licId, `Renewal - ${lic.license_number}`, lic.expiration_date).run();
      }
    }

    return json({ success: true });
  }

  // GET /license-types
  if (method === 'GET' && path === '/license-types') {
    const types = await db.prepare('SELECT * FROM license_types WHERE is_active = 1 ORDER BY name').all();
    return json(types.results);
  }

  // POST /licenses/:id/comments — staff only
  const commentMatch = path.match(/^\/licenses\/(\d+)\/comments$/);
  if (commentMatch) {
    const licId = parseInt(commentMatch[1]);
    if (method === 'POST') {
      const auth = await requireAuth(request, db);
      if (auth.error) return auth.error;
      const { data, error: bodyErr } = await parseBody(request);
      if (bodyErr) return bodyErr;
      if (!data.comment?.trim()) return json({ error: 'Comment required' }, 400);
      const user = auth.user;
      const result = await db.prepare("INSERT INTO comments (module, ref_id, user_id, author_name, comment, is_internal) VALUES ('licenses', ?, ?, ?, ?, 1)")
        .bind(licId, user.id, `${user.first_name} ${user.last_name}`, sanitize(data.comment, 10000)).run();
      return json({ id: result.meta.last_row_id }, 201);
    }
    const r = await db.prepare("SELECT c.*, u.first_name, u.last_name FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.module = 'licenses' AND c.ref_id = ? ORDER BY c.created_at DESC").bind(licId).all();
    return json(r.results);
  }

  // POST /licenses/:id/payments — staff only
  const payMatch = path.match(/^\/licenses\/(\d+)\/payments$/);
  if (payMatch) {
    const licId = parseInt(payMatch[1]);
    if (method === 'POST') {
      const auth = await requireAuth(request, db);
      if (auth.error) return auth.error;
      const { data, error: bodyErr } = await parseBody(request);
      if (bodyErr) return bodyErr;
      if (!data.amount || isNaN(data.amount) || data.amount <= 0) return json({ error: 'Valid positive amount required' }, 400);
      const user = auth.user;
      const result = await db.prepare("INSERT INTO fee_payments (module, ref_id, amount, payment_method, reference_number, description, received_by) VALUES ('licenses', ?, ?, ?, ?, ?, ?)")
        .bind(licId, data.amount, data.payment_method || 'other', data.reference_number || null, data.description || null, user?.id || null).run();
      const totalPaid = await db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fee_payments WHERE module = 'licenses' AND ref_id = ?").bind(licId).first();
      await db.prepare('UPDATE business_licenses SET fees_paid = ?, updated_at = datetime("now") WHERE id = ?').bind(totalPaid.total, licId).run();
      await logActivity(db, 'licenses', licId, user?.id, 'Payment received', `$${data.amount}`);
      return json({ id: result.meta.last_row_id, total_paid: totalPaid.total }, 201);
    }
    const r = await db.prepare("SELECT * FROM fee_payments WHERE module = 'licenses' AND ref_id = ? ORDER BY received_at DESC").bind(licId).all();
    return json(r.results);
  }

  // GET /licenses/renewals — upcoming renewals for the fee calendar
  if (method === 'GET' && path === '/licenses/renewals') {
    const months = parseInt(url.searchParams.get('months') || '3');
    const results = await db.prepare(`
      SELECT bl.*, lt.name as type_name, lt.code as type_code
      FROM business_licenses bl JOIN license_types lt ON bl.license_type_id = lt.id
      WHERE bl.status = 'active' AND bl.expiration_date <= date('now', '+' || ? || ' months')
      ORDER BY bl.expiration_date
    `).bind(months).all();
    return json(results.results);
  }

  return null;
}
