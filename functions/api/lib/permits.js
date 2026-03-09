// ==========================================================================
// PERMITS MODULE — all permit-related API routes
// ==========================================================================

import { json, getUser, logActivity, queueEmail, nextNumber } from './helpers.js';

export async function handlePermits(method, path, url, request, db) {

  // GET /permits
  if (method === 'GET' && path === '/permits') {
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search') || '';
    const priority = url.searchParams.get('priority');
    const assigned = url.searchParams.get('assigned_to');

    let query = `SELECT p.*, pt.code as type_code, pt.name as type_name,
      u.first_name as assigned_first, u.last_name as assigned_last
      FROM permits p JOIN permit_types pt ON p.permit_type_id = pt.id
      LEFT JOIN users u ON p.assigned_to = u.id WHERE 1=1`;
    const b = [];

    if (status) { query += ' AND p.status = ?'; b.push(status); }
    if (type) { query += ' AND pt.code = ?'; b.push(type); }
    if (priority) { query += ' AND p.priority = ?'; b.push(priority); }
    if (assigned) { query += ' AND p.assigned_to = ?'; b.push(parseInt(assigned)); }
    if (search) {
      query += ' AND (p.address LIKE ? OR p.permit_number LIKE ? OR p.applicant_name LIKE ?)';
      b.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY p.submitted_at DESC';

    const stmt = db.prepare(query);
    const results = b.length > 0 ? await stmt.bind(...b).all() : await stmt.all();
    return json(results.results);
  }

  // POST /permits
  if (method === 'POST' && path === '/permits') {
    const data = await request.json();
    const permitType = await db.prepare('SELECT * FROM permit_types WHERE code = ?').bind(data.permit_type_code || 'ZP').first();
    if (!permitType) return json({ error: 'Invalid permit type' }, 400);

    const permitNumber = await nextNumber(db, 'permits', 'permit_number', permitType.code);
    let lat = data.latitude || null, lng = data.longitude || null;

    if (data.parcel_id) {
      const parcel = await db.prepare('SELECT centroid_lat, centroid_lng FROM parcels WHERE parcel_id = ?').bind(data.parcel_id).first();
      if (parcel) { lat = lat || parcel.centroid_lat; lng = lng || parcel.centroid_lng; }
    }

    const admin = await db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").first();

    const result = await db.prepare(`
      INSERT INTO permits (permit_number, permit_type_id, parcel_id, address,
        applicant_name, applicant_email, applicant_phone, owner_name, owner_phone, owner_address,
        description, work_type, valuation, square_footage,
        status, submitted_at, zoning_district, flood_zone,
        latitude, longitude, fees_calculated, assigned_to, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), ?, ?, ?, ?, ?, ?, 'normal')
    `).bind(
      permitNumber, permitType.id, data.parcel_id || null, data.address || null,
      data.applicant_name || null, data.applicant_email || null,
      data.applicant_phone || null, data.owner_name || null,
      data.owner_phone || null, data.owner_address || null,
      data.description || null, data.work_type || null,
      data.valuation || 0, data.square_footage || null,
      data.zoning_district || null, data.flood_zone || null,
      lat, lng, permitType.base_fee, admin?.id || null
    ).run();

    const permitId = result.meta.last_row_id;
    await logActivity(db, 'permits', permitId, null, 'Permit submitted', `${permitType.name} application received`);

    // Create review deadline
    await db.prepare(
      "INSERT INTO deadlines (module, ref_id, title, due_date, deadline_type, description) VALUES ('permits', ?, ?, date('now', '+' || ? || ' days'), 'review', ?)"
    ).bind(permitId, `Review deadline - ${permitNumber}`, permitType.review_days, `Must review within ${permitType.review_days} days`).run();

    // Save attached files
    if (data.files && Array.isArray(data.files)) {
      for (const f of data.files) {
        await db.prepare(
          "INSERT INTO documents (module, ref_id, filename, doc_type, file_size, file_data, notes) VALUES ('permits', ?, ?, ?, ?, ?, ?)"
        ).bind(permitId, f.filename, f.doc_type || 'site_plan', f.file_size || 0, f.file_data || null, f.notes || null).run();
      }
    }

    // Queue notification email to staff
    await queueEmail(db, {
      to_email: 'ksmith@threeforksmt.gov', to_name: 'Kelly Smith',
      subject: `New Permit Application: ${permitNumber}`,
      body_text: `New ${permitType.name} application from ${data.applicant_name || 'unknown'} at ${data.address || 'N/A'}`,
      module: 'permits', ref_id: permitId,
    });

    return json({ id: permitId, permit_number: permitNumber, fees: permitType.base_fee, documents: data.files?.length || 0 }, 201);
  }

  // GET /permits/:id
  const idMatch = path.match(/^\/permits\/(\d+)$/);
  const numMatch = path.match(/^\/permits\/([A-Z][\w-]+)$/);
  if (method === 'GET' && (idMatch || numMatch)) {
    const ref = (idMatch || numMatch)[1];
    const permit = await db.prepare(`
      SELECT p.*, pt.code as type_code, pt.name as type_name, pt.base_fee, pt.requires_inspection,
        u.first_name as assigned_first, u.last_name as assigned_last, u.title as assigned_title
      FROM permits p JOIN permit_types pt ON p.permit_type_id = pt.id
      LEFT JOIN users u ON p.assigned_to = u.id WHERE p.id = ? OR p.permit_number = ?
    `).bind(ref, ref).first();
    if (!permit) return json({ error: 'Permit not found' }, 404);

    const [parcel, activity, inspections, comments, payments, documents, deadlines] = await Promise.all([
      permit.parcel_id ? db.prepare('SELECT * FROM parcels WHERE parcel_id = ?').bind(permit.parcel_id).first() : null,
      db.prepare("SELECT al.*, u.first_name, u.last_name FROM activity_log al LEFT JOIN users u ON al.user_id = u.id WHERE al.module = 'permits' AND al.ref_id = ? ORDER BY al.created_at DESC").bind(permit.id).all(),
      db.prepare('SELECT i.*, u.first_name as inspector_first, u.last_name as inspector_last FROM inspections i LEFT JOIN users u ON i.inspector_id = u.id WHERE i.permit_id = ? ORDER BY i.scheduled_date').bind(permit.id).all(),
      db.prepare("SELECT c.*, u.first_name, u.last_name FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.module = 'permits' AND c.ref_id = ? ORDER BY c.created_at DESC").bind(permit.id).all(),
      db.prepare("SELECT fp.*, u.first_name as received_first, u.last_name as received_last FROM fee_payments fp LEFT JOIN users u ON fp.received_by = u.id WHERE fp.module = 'permits' AND fp.ref_id = ? ORDER BY fp.received_at DESC").bind(permit.id).all(),
      db.prepare("SELECT id, module, ref_id, filename, doc_type, file_size, uploaded_by, notes, created_at FROM documents WHERE module = 'permits' AND ref_id = ? ORDER BY created_at DESC").bind(permit.id).all(),
      db.prepare("SELECT * FROM deadlines WHERE module = 'permits' AND ref_id = ? ORDER BY due_date").bind(permit.id).all(),
    ]);

    return json({ ...permit, parcel, activity: activity.results, inspections: inspections.results, comments: comments.results, payments: payments.results, documents: documents.results, deadlines: deadlines.results });
  }

  // PUT /permits/:id
  const updateMatch = path.match(/^\/permits\/(\d+)$/);
  if (method === 'PUT' && updateMatch) {
    const permitId = parseInt(updateMatch[1]);
    const data = await request.json();
    const user = await getUser(request, db);
    const permit = await db.prepare('SELECT * FROM permits WHERE id = ?').bind(permitId).first();
    if (!permit) return json({ error: 'Permit not found' }, 404);

    const updates = [], bindings = [];
    const allowed = ['status', 'review_notes', 'conditions', 'denial_reason', 'fees_paid', 'priority', 'assigned_to', 'address', 'description', 'applicant_name', 'applicant_email', 'applicant_phone', 'owner_name', 'valuation', 'square_footage', 'zoning_district'];
    for (const f of allowed) {
      if (f in data) { updates.push(`${f} = ?`); bindings.push(data[f]); }
    }
    if (data.status === 'approved' || data.status === 'denied') {
      updates.push('decision = ?'); bindings.push(data.status);
      updates.push("decision_date = datetime('now')");
      if (data.status === 'approved') updates.push("expires_at = datetime('now', '+1 year')");
    }
    if (data.status === 'under_review') updates.push("reviewed_at = datetime('now')");
    updates.push("updated_at = datetime('now')");
    bindings.push(permitId);

    await db.prepare(`UPDATE permits SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
    await logActivity(db, 'permits', permitId, user?.id, data.status ? `Status: ${data.status}` : 'Permit updated', JSON.stringify(data));

    if (data.status === 'approved') {
      await db.prepare("INSERT INTO deadlines (module, ref_id, title, due_date, deadline_type, description) VALUES ('permits', ?, ?, date('now', '+1 year'), 'expiration', 'Expires one year from approval')")
        .bind(permitId, `Expiration - ${permit.permit_number}`).run();
    }

    // Email applicant on status change
    if (data.status && permit.applicant_email) {
      await queueEmail(db, {
        to_email: permit.applicant_email, to_name: permit.applicant_name,
        subject: `Permit ${permit.permit_number} — ${data.status.replace('_', ' ').toUpperCase()}`,
        body_text: `Your permit ${permit.permit_number} has been updated to: ${data.status.replace('_', ' ')}`,
        module: 'permits', ref_id: permitId,
      });
    }

    return json({ success: true });
  }

  // POST /permits/:id/inspections
  const inspMatch = path.match(/^\/permits\/(\d+)\/inspections$/);
  if (inspMatch) {
    const permitId = parseInt(inspMatch[1]);
    if (method === 'POST') {
      const data = await request.json();
      const user = await getUser(request, db);
      const result = await db.prepare(
        "INSERT INTO inspections (permit_id, inspection_type, status, scheduled_date, inspector_id, notes) VALUES (?, ?, 'scheduled', ?, ?, ?)"
      ).bind(permitId, data.inspection_type, data.scheduled_date, user?.id || null, data.notes || null).run();
      await logActivity(db, 'permits', permitId, user?.id, 'Inspection scheduled', `${data.inspection_type} on ${data.scheduled_date}`);
      const permit = await db.prepare('SELECT permit_number FROM permits WHERE id = ?').bind(permitId).first();
      await db.prepare("INSERT INTO deadlines (module, ref_id, title, due_date, deadline_type) VALUES ('permits', ?, ?, ?, 'inspection')")
        .bind(permitId, `${data.inspection_type} - ${permit?.permit_number || ''}`, data.scheduled_date).run();
      return json({ id: result.meta.last_row_id }, 201);
    }
    if (method === 'GET') {
      const r = await db.prepare('SELECT i.*, u.first_name as inspector_first, u.last_name as inspector_last FROM inspections i LEFT JOIN users u ON i.inspector_id = u.id WHERE i.permit_id = ? ORDER BY i.scheduled_date').bind(permitId).all();
      return json(r.results);
    }
  }

  // PUT /inspections/:id
  const inspUpdateMatch = path.match(/^\/inspections\/(\d+)$/);
  if (method === 'PUT' && inspUpdateMatch) {
    const inspId = parseInt(inspUpdateMatch[1]);
    const data = await request.json();
    const user = await getUser(request, db);
    const updates = [], b = [];
    if (data.status) { updates.push('status = ?'); b.push(data.status); }
    if (data.result) { updates.push('result = ?'); b.push(data.result); }
    if (data.notes !== undefined) { updates.push('notes = ?'); b.push(data.notes); }
    if (data.scheduled_date) { updates.push('scheduled_date = ?'); b.push(data.scheduled_date); }
    if (data.status === 'passed' || data.status === 'failed') updates.push("completed_date = datetime('now')");
    updates.push("updated_at = datetime('now')");
    b.push(inspId);
    await db.prepare(`UPDATE inspections SET ${updates.join(', ')} WHERE id = ?`).bind(...b).run();
    const insp = await db.prepare('SELECT permit_id, inspection_type FROM inspections WHERE id = ?').bind(inspId).first();
    if (insp) await logActivity(db, 'permits', insp.permit_id, user?.id, data.result === 'pass' ? 'Inspection passed' : 'Inspection updated', insp.inspection_type);
    return json({ success: true });
  }

  // POST/GET /permits/:id/comments
  const commentMatch = path.match(/^\/permits\/(\d+)\/comments$/);
  if (commentMatch) {
    const permitId = parseInt(commentMatch[1]);
    if (method === 'POST') {
      const data = await request.json();
      const user = await getUser(request, db);
      const authorName = user ? `${user.first_name} ${user.last_name}` : (data.author_name || 'Staff');
      const result = await db.prepare("INSERT INTO comments (module, ref_id, user_id, author_name, comment, is_internal) VALUES ('permits', ?, ?, ?, ?, ?)")
        .bind(permitId, user?.id || null, authorName, data.comment, data.is_internal !== false ? 1 : 0).run();
      await logActivity(db, 'permits', permitId, user?.id, 'Comment added', data.comment.substring(0, 100));
      return json({ id: result.meta.last_row_id }, 201);
    }
    const r = await db.prepare("SELECT c.*, u.first_name, u.last_name FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.module = 'permits' AND c.ref_id = ? ORDER BY c.created_at DESC").bind(permitId).all();
    return json(r.results);
  }

  // POST/GET /permits/:id/payments
  const payMatch = path.match(/^\/permits\/(\d+)\/payments$/);
  if (payMatch) {
    const permitId = parseInt(payMatch[1]);
    if (method === 'POST') {
      const data = await request.json();
      const user = await getUser(request, db);
      const result = await db.prepare("INSERT INTO fee_payments (module, ref_id, amount, payment_method, reference_number, description, received_by) VALUES ('permits', ?, ?, ?, ?, ?, ?)")
        .bind(permitId, data.amount, data.payment_method || 'other', data.reference_number || null, data.description || null, user?.id || null).run();
      const totalPaid = await db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM fee_payments WHERE module = 'permits' AND ref_id = ?").bind(permitId).first();
      await db.prepare('UPDATE permits SET fees_paid = ?, updated_at = datetime("now") WHERE id = ?').bind(totalPaid.total, permitId).run();
      await logActivity(db, 'permits', permitId, user?.id, 'Payment received', `$${data.amount} via ${data.payment_method || 'other'}`);
      return json({ id: result.meta.last_row_id, total_paid: totalPaid.total }, 201);
    }
    const r = await db.prepare("SELECT fp.*, u.first_name as received_first, u.last_name as received_last FROM fee_payments fp LEFT JOIN users u ON fp.received_by = u.id WHERE fp.module = 'permits' AND fp.ref_id = ? ORDER BY fp.received_at DESC").bind(permitId).all();
    return json(r.results);
  }

  // POST/GET /permits/:id/documents
  const docMatch = path.match(/^\/permits\/(\d+)\/documents$/);
  if (docMatch) {
    const permitId = parseInt(docMatch[1]);
    if (method === 'POST') {
      const data = await request.json();
      const user = await getUser(request, db);
      const result = await db.prepare("INSERT INTO documents (module, ref_id, filename, doc_type, file_size, file_data, uploaded_by, notes) VALUES ('permits', ?, ?, ?, ?, ?, ?, ?)")
        .bind(permitId, data.filename, data.doc_type || 'other', data.file_size || 0, data.file_data || null, user?.id || null, data.notes || null).run();
      await logActivity(db, 'permits', permitId, user?.id, 'Document added', data.filename);
      return json({ id: result.meta.last_row_id }, 201);
    }
    const r = await db.prepare("SELECT id, module, ref_id, filename, doc_type, file_size, uploaded_by, notes, created_at FROM documents WHERE module = 'permits' AND ref_id = ? ORDER BY created_at DESC").bind(permitId).all();
    return json(r.results);
  }

  return null; // not handled
}
