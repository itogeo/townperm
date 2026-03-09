#!/usr/bin/env python3
"""
Ito Development Tracker - Backend API
A permit tracking system for small municipalities

Run: python server.py
Access: http://localhost:5000
"""

from flask import Flask, jsonify, request, send_from_directory, g, session
from flask_cors import CORS
import sqlite3
import os
import json
from datetime import datetime
from functools import wraps
import hashlib
import secrets

app = Flask(__name__, static_folder='.')
CORS(app)

# Configuration
DATABASE = 'permits.db'
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# City Configuration - Edit for each deployment
CITY_CONFIG = {
    'city_name': 'Three Forks',
    'city_state': 'MT',
    'map_center': [-111.5513, 45.8930],
    'map_zoom': 14,
    'mapbox_token': 'pk.eyJ1IjoiaXRvZ2VvIiwiYSI6ImNtNnphb29uMDA2dTYycm9mNTNvNjdvNjQifQ.l0eaBrNbQV7B4VNiyPKd0A',
    'county': 'Gallatin',
    'timezone': 'America/Denver'
}

# ============================================================================
# DATABASE
# ============================================================================

def get_db():
    """Get database connection"""
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(error):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    """Initialize database tables"""
    db = sqlite3.connect(DATABASE)
    db.executescript('''
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'applicant',
            first_name TEXT,
            last_name TEXT,
            phone TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        );

        -- Permit types
        CREATE TABLE IF NOT EXISTS permit_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            base_fee REAL DEFAULT 0,
            requires_inspection INTEGER DEFAULT 0,
            review_days INTEGER DEFAULT 14,
            is_active INTEGER DEFAULT 1
        );

        -- Permits
        CREATE TABLE IF NOT EXISTS permits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            permit_number TEXT UNIQUE NOT NULL,
            permit_type_id INTEGER REFERENCES permit_types(id),
            
            -- Location
            parcel_id TEXT,
            address TEXT,
            zoning_district TEXT,
            flood_zone TEXT,
            latitude REAL,
            longitude REAL,
            
            -- Applicant
            applicant_id INTEGER REFERENCES users(id),
            applicant_name TEXT,
            applicant_email TEXT,
            applicant_phone TEXT,
            owner_name TEXT,
            
            -- Project
            description TEXT,
            work_type TEXT,
            valuation REAL DEFAULT 0,
            square_footage INTEGER,
            
            -- Status
            status TEXT DEFAULT 'submitted',
            submitted_at TIMESTAMP,
            assigned_to INTEGER REFERENCES users(id),
            reviewed_at TIMESTAMP,
            reviewed_by INTEGER REFERENCES users(id),
            review_notes TEXT,
            conditions TEXT,
            decision TEXT,
            decision_date TIMESTAMP,
            denial_reason TEXT,
            
            -- Fees
            fees_calculated REAL DEFAULT 0,
            fees_paid REAL DEFAULT 0,
            
            -- Timestamps
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Parcels (from HometownMap)
        CREATE TABLE IF NOT EXISTS parcels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parcel_id TEXT UNIQUE NOT NULL,
            address TEXT,
            owner_name TEXT,
            acres REAL,
            zoning TEXT,
            assessed_value REAL,
            geometry_json TEXT,
            centroid_lat REAL,
            centroid_lng REAL
        );

        -- Activity log
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            permit_id INTEGER REFERENCES permits(id),
            user_id INTEGER REFERENCES users(id),
            action TEXT NOT NULL,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Insert default permit types
        INSERT OR IGNORE INTO permit_types (code, name, description, base_fee, requires_inspection, review_days) VALUES
            ('ZP', 'Zoning Permit', 'General zoning compliance permit', 50.00, 0, 14),
            ('FP', 'Flood Permit', 'Required for flood zone construction', 75.00, 1, 21),
            ('SP', 'Sign Permit', 'Commercial signage installation', 35.00, 0, 7),
            ('SUB', 'Subdivision', 'Land subdivision approval', 500.00, 0, 30),
            ('SPR', 'Site Plan Review', 'Commercial/multi-family site review', 150.00, 1, 21),
            ('VAR', 'Variance', 'Variance from zoning regulations', 200.00, 0, 30),
            ('CUP', 'Conditional Use', 'Conditional use permit', 150.00, 0, 30),
            ('ENC', 'Encroachment', 'Work in public right-of-way', 25.00, 1, 7),
            ('DEM', 'Demolition', 'Building demolition notification', 50.00, 1, 14);

        -- Insert demo staff users
        INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name) VALUES
            ('admin@threeforksmt.gov', 'demo_hash', 'admin', 'Crystal', 'Turner'),
            ('staff@threeforksmt.gov', 'demo_hash', 'staff', 'Skip', 'Gee');

        -- Insert sample parcels (Three Forks area)
        INSERT OR IGNORE INTO parcels (parcel_id, address, owner_name, acres, zoning, assessed_value, centroid_lat, centroid_lng, geometry_json) VALUES
            ('06-0450-12-1-01-01-0000', '123 Main St', 'John Smith', 0.25, 'R-1', 185000, 45.8930, -111.5520, '{"type":"Polygon","coordinates":[[[-111.5525,45.8935],[-111.5515,45.8935],[-111.5515,45.8925],[-111.5525,45.8925],[-111.5525,45.8935]]]}'),
            ('06-0450-08-2-03-04-0000', '456 River Rd', 'Jane Doe', 0.5, 'FP-1', 220000, 45.8912, -111.5537, '{"type":"Polygon","coordinates":[[[-111.5545,45.8920],[-111.5530,45.8920],[-111.5530,45.8905],[-111.5545,45.8905],[-111.5545,45.8920]]]}'),
            ('06-0450-15-3-02-08-0000', '789 Broadway', 'Downtown LLC', 0.15, 'C-1', 320000, 45.8936, -111.5495, '{"type":"Polygon","coordinates":[[[-111.5500,45.8940],[-111.5490,45.8940],[-111.5490,45.8932],[-111.5500,45.8932],[-111.5500,45.8940]]]}'),
            ('06-0450-11-1-05-02-0000', '321 Oak Ave', 'Mike Johnson', 0.35, 'R-2', 195000, 45.8907, -111.5472, '{"type":"Polygon","coordinates":[[[-111.5480,45.8915],[-111.5465,45.8915],[-111.5465,45.8900],[-111.5480,45.8900],[-111.5480,45.8915]]]}'),
            ('06-0450-22-4-00-00-0000', 'Wheat Fields Subdivision', 'Valley Developers', 15.2, 'R-1', 450000, 45.8865, -111.5575, '{"type":"Polygon","coordinates":[[[-111.5600,45.8880],[-111.5550,45.8880],[-111.5550,45.8850],[-111.5600,45.8850],[-111.5600,45.8880]]]}'),
            ('06-0450-09-2-01-03-0000', '555 Elm St', 'Sarah Wilson', 0.30, 'R-1', 175000, 45.8895, -111.5510, '{"type":"Polygon","coordinates":[[[-111.5518,45.8902],[-111.5502,45.8902],[-111.5502,45.8888],[-111.5518,45.8888],[-111.5518,45.8902]]]}');

        -- Insert sample permits
        INSERT OR IGNORE INTO permits (permit_number, permit_type_id, parcel_id, address, applicant_name, status, description, valuation, latitude, longitude, submitted_at, zoning_district) VALUES
            ('ZP-2026-001', 1, '06-0450-12-1-01-01-0000', '123 Main St', 'John Smith', 'approved', 'New garage construction - 24x30 detached garage', 45000, 45.8930, -111.5520, '2026-01-15', 'R-1'),
            ('FP-2026-003', 2, '06-0450-08-2-03-04-0000', '456 River Rd', 'Jane Doe', 'pending', 'Deck addition in floodplain - 12x20 treated lumber deck', 8500, 45.8912, -111.5537, '2026-02-20', 'FP-1'),
            ('SP-2026-002', 3, '06-0450-15-3-02-08-0000', '789 Broadway', 'Downtown LLC', 'under_review', 'New business signage - 24 sq ft illuminated sign', 3200, 45.8936, -111.5495, '2026-02-18', 'C-1'),
            ('ZP-2026-004', 1, '06-0450-11-1-05-02-0000', '321 Oak Ave', 'Mike Johnson', 'approved', 'ADU construction - 600 sq ft accessory dwelling unit', 125000, 45.8907, -111.5472, '2026-02-01', 'R-2'),
            ('SUB-2026-001', 4, '06-0450-22-4-00-00-0000', 'Wheat Fields Subdivision', 'Valley Developers', 'under_review', '12-lot minor subdivision with infrastructure', 1200000, 45.8865, -111.5575, '2026-02-10', 'R-1'),
            ('ZP-2026-005', 1, '06-0450-09-2-01-03-0000', '555 Elm St', 'Sarah Wilson', 'denied', 'Setback variance request - proposed 3ft side setback', 0, 45.8895, -111.5510, '2026-01-25', 'R-1');
    ''')
    db.commit()
    db.close()
    print("Database initialized!")

# ============================================================================
# API ROUTES
# ============================================================================

@app.route('/')
def index():
    """Serve the main app"""
    return send_from_directory('.', 'index.html')

@app.route('/api/config')
def get_config():
    """Return city configuration"""
    return jsonify(CITY_CONFIG)

# ----------------------------------------------------------------------------
# PERMITS
# ----------------------------------------------------------------------------

@app.route('/api/permits')
def get_permits():
    """Get all permits with optional filters"""
    db = get_db()
    
    status = request.args.get('status')
    permit_type = request.args.get('type')
    search = request.args.get('search', '')
    
    query = '''
        SELECT p.*, pt.code as type_code, pt.name as type_name
        FROM permits p
        JOIN permit_types pt ON p.permit_type_id = pt.id
        WHERE 1=1
    '''
    params = []
    
    if status:
        query += ' AND p.status = ?'
        params.append(status)
    
    if permit_type:
        query += ' AND pt.code = ?'
        params.append(permit_type)
    
    if search:
        query += ' AND (p.address LIKE ? OR p.permit_number LIKE ? OR p.applicant_name LIKE ?)'
        params.extend([f'%{search}%'] * 3)
    
    query += ' ORDER BY p.submitted_at DESC'
    
    permits = db.execute(query, params).fetchall()
    
    return jsonify([dict(row) for row in permits])

@app.route('/api/permits/<permit_id>')
def get_permit(permit_id):
    """Get single permit details"""
    db = get_db()
    
    permit = db.execute('''
        SELECT p.*, pt.code as type_code, pt.name as type_name, pt.base_fee
        FROM permits p
        JOIN permit_types pt ON p.permit_type_id = pt.id
        WHERE p.id = ? OR p.permit_number = ?
    ''', (permit_id, permit_id)).fetchone()
    
    if not permit:
        return jsonify({'error': 'Permit not found'}), 404
    
    # Get related parcel
    parcel = db.execute(
        'SELECT * FROM parcels WHERE parcel_id = ?',
        (permit['parcel_id'],)
    ).fetchone()
    
    # Get activity log
    activity = db.execute('''
        SELECT al.*, u.first_name, u.last_name
        FROM activity_log al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.permit_id = ?
        ORDER BY al.created_at DESC
    ''', (permit['id'],)).fetchall()
    
    result = dict(permit)
    result['parcel'] = dict(parcel) if parcel else None
    result['activity'] = [dict(a) for a in activity]
    
    return jsonify(result)

@app.route('/api/permits', methods=['POST'])
def create_permit():
    """Create new permit"""
    db = get_db()
    data = request.json
    
    # Get permit type
    permit_type = db.execute(
        'SELECT * FROM permit_types WHERE code = ?',
        (data.get('permit_type_code', 'ZP'),)
    ).fetchone()
    
    if not permit_type:
        return jsonify({'error': 'Invalid permit type'}), 400
    
    # Generate permit number
    year = datetime.now().year
    count = db.execute(
        "SELECT COUNT(*) FROM permits WHERE permit_number LIKE ?",
        (f"{permit_type['code']}-{year}-%",)
    ).fetchone()[0]
    
    permit_number = f"{permit_type['code']}-{year}-{str(count + 1).zfill(3)}"
    
    # Get parcel coordinates if available
    parcel = None
    if data.get('parcel_id'):
        parcel = db.execute(
            'SELECT * FROM parcels WHERE parcel_id = ?',
            (data['parcel_id'],)
        ).fetchone()
    
    cursor = db.execute('''
        INSERT INTO permits (
            permit_number, permit_type_id, parcel_id, address,
            applicant_name, applicant_email, applicant_phone, owner_name,
            description, work_type, valuation, square_footage,
            status, submitted_at, zoning_district,
            latitude, longitude, fees_calculated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', CURRENT_TIMESTAMP, ?, ?, ?, ?)
    ''', (
        permit_number,
        permit_type['id'],
        data.get('parcel_id'),
        data.get('address'),
        data.get('applicant_name'),
        data.get('applicant_email'),
        data.get('applicant_phone'),
        data.get('owner_name'),
        data.get('description'),
        data.get('work_type'),
        data.get('valuation', 0),
        data.get('square_footage'),
        data.get('zoning_district'),
        parcel['centroid_lat'] if parcel else data.get('latitude'),
        parcel['centroid_lng'] if parcel else data.get('longitude'),
        permit_type['base_fee']
    ))
    
    db.commit()
    
    return jsonify({
        'id': cursor.lastrowid,
        'permit_number': permit_number,
        'fees': permit_type['base_fee']
    }), 201

@app.route('/api/permits/<int:permit_id>', methods=['PUT'])
def update_permit(permit_id):
    """Update permit (staff only)"""
    db = get_db()
    data = request.json
    
    permit = db.execute('SELECT * FROM permits WHERE id = ?', (permit_id,)).fetchone()
    if not permit:
        return jsonify({'error': 'Permit not found'}), 404
    
    # Build update query dynamically
    updates = []
    params = []
    
    allowed_fields = ['status', 'assigned_to', 'review_notes', 'conditions', 
                      'decision', 'denial_reason', 'fees_paid']
    
    for field in allowed_fields:
        if field in data:
            updates.append(f'{field} = ?')
            params.append(data[field])
    
    # Handle status changes
    if data.get('status') in ['approved', 'denied']:
        updates.append('decision = ?')
        updates.append('decision_date = CURRENT_TIMESTAMP')
        params.append(data['status'])
    
    if data.get('status') == 'under_review':
        updates.append('reviewed_at = CURRENT_TIMESTAMP')
    
    updates.append('updated_at = CURRENT_TIMESTAMP')
    params.append(permit_id)
    
    db.execute(
        f"UPDATE permits SET {', '.join(updates)} WHERE id = ?",
        params
    )
    
    # Log activity
    db.execute('''
        INSERT INTO activity_log (permit_id, action, details)
        VALUES (?, ?, ?)
    ''', (permit_id, f"Status changed to {data.get('status', 'updated')}", json.dumps(data)))
    
    db.commit()
    
    return jsonify({'success': True})

# ----------------------------------------------------------------------------
# PARCELS
# ----------------------------------------------------------------------------

@app.route('/api/parcels')
def get_parcels():
    """Get parcels as GeoJSON"""
    db = get_db()
    
    # Optional bbox filter
    bbox = request.args.get('bbox')
    
    query = 'SELECT * FROM parcels'
    params = []
    
    if bbox:
        west, south, east, north = map(float, bbox.split(','))
        query += ''' WHERE centroid_lng BETWEEN ? AND ?
                     AND centroid_lat BETWEEN ? AND ?'''
        params = [west, east, south, north]
    
    parcels = db.execute(query, params).fetchall()
    
    features = []
    for p in parcels:
        geometry = json.loads(p['geometry_json']) if p['geometry_json'] else None
        features.append({
            'type': 'Feature',
            'properties': {
                'parcel_id': p['parcel_id'],
                'address': p['address'],
                'owner': p['owner_name'],
                'acres': p['acres'],
                'zoning': p['zoning'],
                'assessed_value': p['assessed_value']
            },
            'geometry': geometry
        })
    
    return jsonify({
        'type': 'FeatureCollection',
        'features': features
    })

@app.route('/api/parcels/<parcel_id>')
def get_parcel(parcel_id):
    """Get single parcel with permit history"""
    db = get_db()
    
    parcel = db.execute(
        'SELECT * FROM parcels WHERE parcel_id = ?',
        (parcel_id,)
    ).fetchone()
    
    if not parcel:
        return jsonify({'error': 'Parcel not found'}), 404
    
    # Get permits on this parcel
    permits = db.execute('''
        SELECT p.*, pt.name as type_name
        FROM permits p
        JOIN permit_types pt ON p.permit_type_id = pt.id
        WHERE p.parcel_id = ?
        ORDER BY p.submitted_at DESC
    ''', (parcel_id,)).fetchall()
    
    result = dict(parcel)
    result['geometry'] = json.loads(parcel['geometry_json']) if parcel['geometry_json'] else None
    result['permits'] = [dict(p) for p in permits]
    
    return jsonify(result)

# ----------------------------------------------------------------------------
# MAP DATA
# ----------------------------------------------------------------------------

@app.route('/api/map/permits')
def get_map_permits():
    """Get permits as GeoJSON for map display"""
    db = get_db()
    
    status_filter = request.args.get('status', 'active')
    
    if status_filter == 'active':
        status_clause = "p.status IN ('submitted', 'pending', 'under_review', 'approved')"
    else:
        status_clause = '1=1'
    
    permits = db.execute(f'''
        SELECT p.*, pt.code as type_code, pt.name as type_name
        FROM permits p
        JOIN permit_types pt ON p.permit_type_id = pt.id
        WHERE {status_clause}
        AND p.latitude IS NOT NULL
    ''').fetchall()
    
    features = []
    for p in permits:
        features.append({
            'type': 'Feature',
            'properties': {
                'id': p['permit_number'],
                'type': p['type_name'],
                'typeCode': p['type_code'],
                'address': p['address'],
                'parcel_id': p['parcel_id'],
                'applicant': p['applicant_name'],
                'status': p['status'],
                'description': p['description'],
                'valuation': p['valuation'],
                'submitted': p['submitted_at']
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [p['longitude'], p['latitude']]
            }
        })
    
    return jsonify({
        'type': 'FeatureCollection',
        'features': features
    })

# ----------------------------------------------------------------------------
# STATISTICS
# ----------------------------------------------------------------------------

@app.route('/api/stats')
def get_stats():
    """Get permit statistics"""
    db = get_db()
    
    stats = {
        'total': db.execute('SELECT COUNT(*) FROM permits').fetchone()[0],
        'pending': db.execute("SELECT COUNT(*) FROM permits WHERE status = 'pending'").fetchone()[0],
        'under_review': db.execute("SELECT COUNT(*) FROM permits WHERE status = 'under_review'").fetchone()[0],
        'approved': db.execute("SELECT COUNT(*) FROM permits WHERE status = 'approved'").fetchone()[0],
        'denied': db.execute("SELECT COUNT(*) FROM permits WHERE status = 'denied'").fetchone()[0],
        'total_valuation': db.execute('SELECT COALESCE(SUM(valuation), 0) FROM permits').fetchone()[0],
        'fees_collected': db.execute('SELECT COALESCE(SUM(fees_paid), 0) FROM permits').fetchone()[0],
    }
    
    # By type
    by_type = db.execute('''
        SELECT pt.name, COUNT(*) as count
        FROM permits p
        JOIN permit_types pt ON p.permit_type_id = pt.id
        GROUP BY pt.id
    ''').fetchall()
    
    stats['by_type'] = {row['name']: row['count'] for row in by_type}
    
    # Monthly trend
    monthly = db.execute('''
        SELECT strftime('%Y-%m', submitted_at) as month, COUNT(*) as count
        FROM permits
        WHERE submitted_at >= date('now', '-12 months')
        GROUP BY month
        ORDER BY month
    ''').fetchall()
    
    stats['monthly'] = [{'month': row['month'], 'count': row['count']} for row in monthly]
    
    return jsonify(stats)

# ----------------------------------------------------------------------------
# PERMIT TYPES
# ----------------------------------------------------------------------------

@app.route('/api/permit-types')
def get_permit_types():
    """Get all permit types"""
    db = get_db()
    types = db.execute(
        'SELECT * FROM permit_types WHERE is_active = 1 ORDER BY code'
    ).fetchall()
    return jsonify([dict(t) for t in types])

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    # Initialize database if it doesn't exist
    if not os.path.exists(DATABASE):
        init_db()
    
    print(f"""
    ╔══════════════════════════════════════════════════════════════╗
    ║  Ito Development Tracker - {CITY_CONFIG['city_name']}, {CITY_CONFIG['city_state']}                       ║
    ║                                                              ║
    ║  Server running at: http://localhost:5000                    ║
    ║  API endpoints:     http://localhost:5000/api/               ║
    ║                                                              ║
    ║  Powered by Ito Geospatial - $300/month                      ║
    ╚══════════════════════════════════════════════════════════════╝
    """)
    
    app.run(debug=True, port=5000)
