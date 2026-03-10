// ==========================================================================
// CITIZEN REQUESTS MODULE — map-based issue reporting
// ==========================================================================

import { json, getUser, logActivity, queueEmail, nextNumber, requireAuth, parseBody, sanitize, VALID_STATUSES } from './helpers.js';

export async function handleRequests(method, path, url, request, db) {

  // GET /requests
  if (method === 'GET' && path === '/requests') {
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const priority = url.searchParams.get('priority');
    const search = url.searchParams.get('search') || '';

    let query = `SELECT cr.*, rc.code as category_code, rc.name as category_name, rc.department,
      u.first_name as assigned_first, u.last_name as assigned_last
      FROM citizen_requests cr
      JOIN request_categories rc ON cr.category_id = rc.id
      LEFT JOIN users u ON cr.assigned_to = u.id WHERE 1=1`;
    const b = [];

    if (status) { query += ' AND cr.status = ?'; b.push(status); }
    if (category) { query += ' AND rc.code = ?'; b.push(category); }
    if (priority) { query += ' AND cr.priority = ?'; b.push(priority); }
    if (search) {
      query += ' AND (cr.address LIKE ? OR cr.description LIKE ? OR cr.reporter_name LIKE ? OR cr.request_number LIKE ?)';
      b.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY cr.created_at DESC';

    const stmt = db.prepare(query);
    const results = b.length > 0 ? await stmt.bind(...b).all() : await stmt.all();
    return json(results.results);
  }

  // POST /requests — public
  if (method === 'POST' && path === '/requests') {
    const { data, error: bodyErr } = await parseBody(request, 5 * 1024 * 1024);
    if (bodyErr) return bodyErr;
    if (!data.description?.trim()) return json({ error: 'Description required' }, 400);

    const category = await db.prepare('SELECT * FROM request_categories WHERE id = ? OR code = ?')
      .bind(data.category_id || 0, data.category_code || '').first();
    if (!category) return json({ error: 'Invalid category' }, 400);

    const reqNum = await nextNumber(db, 'citizen_requests', 'request_number', 'CR');

    const result = await db.prepare(`
      INSERT INTO citizen_requests (request_number, category_id, reporter_name, reporter_phone, reporter_email,
        address, description, latitude, longitude, photo_data,
        status, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)
    `).bind(
      reqNum, category.id,
      data.reporter_name || 'Anonymous', data.reporter_phone || null, data.reporter_email || null,
      data.address || null, data.description,
      data.latitude || null, data.longitude || null, data.photo_data || null,
      category.priority_default || 'normal'
    ).run();

    const reqId = result.meta.last_row_id;
    await logActivity(db, 'requests', reqId, null, 'Request submitted', `${category.name} at ${data.address || 'unknown location'}`);

    // Email public works + clerk
    const recipients = [
      { email: 'maintenance@threeforksmt.gov', name: 'Public Works' },
      { email: 'cturner@threeforksmt.gov', name: 'Crystal Turner' },
    ];
    // If zoning issue, also email Kelly
    if (category.department === 'Zoning') {
      recipients.push({ email: 'ksmith@threeforksmt.gov', name: 'Kelly Smith' });
    }

    for (const r of recipients) {
      await queueEmail(db, {
        to_email: r.email, to_name: r.name,
        subject: `Citizen Request ${reqNum}: ${category.name}`,
        body_text: `New ${category.name} report from ${data.reporter_name || 'Anonymous'} at ${data.address || 'unknown'}.\n\n${data.description}`,
        module: 'requests', ref_id: reqId,
      });
    }

    return json({ id: reqId, request_number: reqNum }, 201);
  }

  // GET /requests/:id
  const idMatch = path.match(/^\/requests\/(\d+)$/);
  if (method === 'GET' && idMatch) {
    const reqId = parseInt(idMatch[1]);
    const req = await db.prepare(`
      SELECT cr.*, rc.code as category_code, rc.name as category_name, rc.department,
        u.first_name as assigned_first, u.last_name as assigned_last
      FROM citizen_requests cr
      JOIN request_categories rc ON cr.category_id = rc.id
      LEFT JOIN users u ON cr.assigned_to = u.id WHERE cr.id = ?
    `).bind(reqId).first();
    if (!req) return json({ error: 'Request not found' }, 404);

    const [activity, comments] = await Promise.all([
      db.prepare("SELECT al.*, u.first_name, u.last_name FROM activity_log al LEFT JOIN users u ON al.user_id = u.id WHERE al.module = 'requests' AND al.ref_id = ? ORDER BY al.created_at DESC").bind(reqId).all(),
      db.prepare("SELECT c.*, u.first_name, u.last_name FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.module = 'requests' AND c.ref_id = ? ORDER BY c.created_at DESC").bind(reqId).all(),
    ]);

    return json({ ...req, activity: activity.results, comments: comments.results });
  }

  // PUT /requests/:id — staff only
  if (method === 'PUT' && idMatch) {
    const auth = await requireAuth(request, db);
    if (auth.error) return auth.error;
    const reqId = parseInt(idMatch[1]);
    const { data, error: bodyErr } = await parseBody(request);
    if (bodyErr) return bodyErr;
    if (data.status && !VALID_STATUSES.requests.includes(data.status)) return json({ error: 'Invalid status' }, 400);
    const user = auth.user;

    const updates = [], bindings = [];
    const allowed = ['status', 'priority', 'assigned_to', 'resolution', 'address', 'description'];
    for (const f of allowed) {
      if (f in data) { updates.push(`${f} = ?`); bindings.push(data[f]); }
    }
    if (data.status === 'resolved') updates.push("resolved_at = datetime('now')");
    updates.push("updated_at = datetime('now')");
    bindings.push(reqId);

    await db.prepare(`UPDATE citizen_requests SET ${updates.join(', ')} WHERE id = ?`).bind(...bindings).run();
    await logActivity(db, 'requests', reqId, user?.id, data.status ? `Status: ${data.status}` : 'Request updated', data.resolution || null);

    // Email reporter on resolution
    if (data.status === 'resolved') {
      const req = await db.prepare('SELECT reporter_email, reporter_name, request_number FROM citizen_requests WHERE id = ?').bind(reqId).first();
      if (req?.reporter_email) {
        await queueEmail(db, {
          to_email: req.reporter_email, to_name: req.reporter_name,
          subject: `Your Request ${req.request_number} Has Been Resolved`,
          body_text: `Your citizen request has been resolved.\n\nResolution: ${data.resolution || 'Issue addressed.'}`,
          module: 'requests', ref_id: reqId,
        });
      }
    }

    return json({ success: true });
  }

  // POST /requests/:id/comments — staff only
  const commentMatch = path.match(/^\/requests\/(\d+)\/comments$/);
  if (commentMatch) {
    const reqId = parseInt(commentMatch[1]);
    if (method === 'POST') {
      const auth = await requireAuth(request, db);
      if (auth.error) return auth.error;
      const { data, error: bodyErr } = await parseBody(request);
      if (bodyErr) return bodyErr;
      if (!data.comment?.trim()) return json({ error: 'Comment required' }, 400);
      const user = auth.user;
      const result = await db.prepare("INSERT INTO comments (module, ref_id, user_id, author_name, comment, is_internal) VALUES ('requests', ?, ?, ?, ?, ?)")
        .bind(reqId, user.id, `${user.first_name} ${user.last_name}`, sanitize(data.comment, 10000), data.is_internal !== false ? 1 : 0).run();
      return json({ id: result.meta.last_row_id }, 201);
    }
    const r = await db.prepare("SELECT c.*, u.first_name, u.last_name FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.module = 'requests' AND c.ref_id = ? ORDER BY c.created_at DESC").bind(reqId).all();
    return json(r.results);
  }

  // GET /request-categories
  if (method === 'GET' && path === '/request-categories') {
    const cats = await db.prepare('SELECT * FROM request_categories WHERE is_active = 1 ORDER BY name').all();
    return json(cats.results);
  }

  // GET /requests/map — GeoJSON for map display
  if (method === 'GET' && path === '/requests/map') {
    const statusFilter = url.searchParams.get('status') || 'open';
    const statusClause = statusFilter === 'open'
      ? "cr.status IN ('submitted', 'in_progress')"
      : '1=1';

    const results = await db.prepare(`
      SELECT cr.*, rc.name as category_name, rc.code as category_code
      FROM citizen_requests cr JOIN request_categories rc ON cr.category_id = rc.id
      WHERE ${statusClause} AND cr.latitude IS NOT NULL
    `).all();

    const features = results.results.map(r => ({
      type: 'Feature',
      properties: {
        id: r.request_number, category: r.category_name, categoryCode: r.category_code,
        address: r.address, status: r.status, priority: r.priority,
        description: r.description, reporter: r.reporter_name, created: r.created_at,
      },
      geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
    }));

    return json({ type: 'FeatureCollection', features });
  }

  return null;
}
