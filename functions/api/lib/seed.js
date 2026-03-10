// ==========================================================================
// SEED DATA — Three Forks city management platform
// ==========================================================================

export const SEED_SQL = `
-- Staff users
INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name, phone, title) VALUES
  ('ksmith@threeforksmt.gov', 'demo_hash', 'admin', 'Kelly', 'Smith', '406-285-3431', 'Zoning Official'),
  ('cturner@threeforksmt.gov', 'demo_hash', 'staff', 'Crystal', 'Turner', '406-285-3431', 'City Clerk'),
  ('maintenance@threeforksmt.gov', 'demo_hash', 'staff', 'Tom', 'Bradley', '406-285-3431', 'Public Works');

-- Permit types
INSERT OR IGNORE INTO permit_types (code, name, description, base_fee, requires_inspection, review_days) VALUES
  ('ZP-R', 'Zoning Permit - Residential', 'New residential construction or addition', 200.00, 1, 14),
  ('ZP-C', 'Zoning Permit - Commercial', 'New commercial construction or tenant improvement', 200.00, 1, 14),
  ('ZP-G', 'Zoning Permit - Garage/Addition', 'Detached garage, addition, or accessory structure', 100.00, 1, 14),
  ('ZP-D', 'Zoning Permit - Deck/Shed/Carport', 'Deck, shed, carport, or minor structure', 50.00, 0, 7),
  ('ZP-A', 'Zoning Permit - ADU', 'Accessory dwelling unit construction', 250.00, 1, 14),
  ('FP', 'Floodplain Permit', 'Required for any improvement in FEMA AE flood zone', 500.00, 1, 21),
  ('CUP', 'Conditional Use Permit', 'Conditional use in zoning district', 500.00, 0, 30),
  ('VAR', 'Variance', 'Variance from zoning regulations', 500.00, 0, 30),
  ('SUB', 'Exemption from Subdivision Review', 'Exemption from subdivision review application', 500.00, 0, 30),
  ('WSC', 'Water/Sewer Connection', 'New water and sewer service connection', 250.00, 1, 14),
  ('ZCA', 'Zone Change / Amend Zoning Code', 'Application to amend zoning code or change zone', 350.00, 0, 30),
  ('FPV', 'Floodplain Variance', 'Variance from floodplain regulations', 350.00, 0, 30),
  ('PPL', 'Preliminary Plat Application', 'Subdivision preliminary plat review', 500.00, 0, 60),
  ('FPL', 'Final Plat Application', 'Subdivision final plat approval', 300.00, 0, 30),
  ('ANX', 'Annexation Application', 'Petition for annexation into city limits', 500.00, 0, 60),
  ('VAC', 'Petition to Vacate/Abandon', 'Petition to vacate or abandon street or alley', 250.00, 0, 30);

-- License types
INSERT OR IGNORE INTO license_types (code, name, description, annual_fee, requires_inspection, renewal_month) VALUES
  ('GBL', 'General Business', 'Standard business license for retail/service', 75.00, 0, 1),
  ('LIQ', 'Liquor License', 'On-premise alcohol sales license', 500.00, 1, 7),
  ('FOOD', 'Food Service', 'Restaurant or food preparation', 150.00, 1, 1),
  ('HOME', 'Home Occupation', 'Business operated from residential property', 50.00, 0, 1),
  ('CONTR', 'Contractor License', 'General or specialty contractor', 100.00, 0, 1),
  ('SIGN', 'Sign Permit', 'New or replacement signage', 25.00, 0, 1),
  ('VENDOR', 'Temporary Vendor', 'Temporary or seasonal sales permit', 50.00, 0, 1);

-- Park facilities
INSERT OR IGNORE INTO park_facilities (name, park_name, facility_type, capacity, daily_rate, hourly_rate, amenities, latitude, longitude) VALUES
  ('John Q. Adams Pavilion', 'John Q. Adams Park', 'pavilion', 80, 75.00, 0, 'Covered pavilion, picnic tables, BBQ grills, restrooms, playground nearby', 45.8928, -111.5505),
  ('Veterans Memorial Shelter', 'Veterans Park', 'shelter', 40, 50.00, 0, 'Open shelter with tables, small parking area, adjacent baseball field', 45.8945, -111.5530),
  ('Headwaters Heritage Park', 'Headwaters Heritage Park', 'open_space', 200, 150.00, 25.00, 'Large open area for events, stage hookups, parking lot', 45.8900, -111.5550),
  ('City Pool', 'Three Forks Pool', 'pool', 100, 0, 50.00, 'Outdoor pool, lifeguard on duty, changing rooms', 45.8935, -111.5520),
  ('Baseball Field #1', 'City Ball Fields', 'field', 200, 50.00, 0, 'Lighted baseball diamond, bleachers, dugouts', 45.8948, -111.5540);

-- Request categories
INSERT OR IGNORE INTO request_categories (code, name, description, department, priority_default) VALUES
  ('POTHOLE', 'Pothole/Road Damage', 'Report potholes or road surface damage', 'Public Works', 'normal'),
  ('LIGHT', 'Street Light Out', 'Report a broken or malfunctioning street light', 'Public Works', 'low'),
  ('WATER', 'Water/Sewer Issue', 'Water main break, sewer backup, or leak', 'Public Works', 'high'),
  ('SIDEWALK', 'Sidewalk Damage', 'Cracked or heaved sidewalk', 'Public Works', 'normal'),
  ('TREE', 'Tree/Vegetation', 'Overgrown trees blocking view or damaged trees', 'Public Works', 'low'),
  ('SIGN', 'Sign Damaged/Missing', 'Street sign or stop sign needs repair', 'Public Works', 'normal'),
  ('ANIMAL', 'Animal Control', 'Stray or dangerous animal report', 'Police', 'normal'),
  ('NOISE', 'Noise Complaint', 'Excessive noise or nuisance', 'Police', 'low'),
  ('ZONING', 'Zoning Violation', 'Suspected zoning or code violation', 'Zoning', 'normal'),
  ('OTHER', 'Other', 'General city service request', 'City Hall', 'normal');

-- Parcels
INSERT OR IGNORE INTO parcels (parcel_id, address, owner_name, acres, zoning, assessed_value, centroid_lat, centroid_lng, geometry_json) VALUES
  ('06-0450-12-1-01-01-0000', '121 E Jefferson St', 'Matt & Kelly Bugland', 0.18, 'R', 245000, 45.89295, -111.54925, '{"type":"Polygon","coordinates":[[[-111.5497,45.8932],[-111.5488,45.8932],[-111.5488,45.8927],[-111.5497,45.8927],[-111.5497,45.8932]]]}'),
  ('06-0450-12-1-01-02-0000', '126 E Jefferson St', 'Dennis & Cheryl Burr', 0.45, 'R', 198000, 45.89310, -111.54870, '{"type":"Polygon","coordinates":[[[-111.5493,45.8935],[-111.5481,45.8935],[-111.5481,45.8927],[-111.5493,45.8927],[-111.5493,45.8935]]]}'),
  ('06-0450-15-3-02-08-0000', '5 N Main St', 'Sacajawea Hotel LLC', 0.35, 'CBD', 1250000, 45.89415, -111.55130, '{"type":"Polygon","coordinates":[[[-111.5518,45.8944],[-111.5508,45.8944],[-111.5508,45.8939],[-111.5518,45.8939],[-111.5518,45.8944]]]}'),
  ('06-0450-09-2-01-03-0000', '123 W Elm St', 'Cody & Kari Ham', 0.20, 'CBD', 285000, 45.89190, -111.55245, '{"type":"Polygon","coordinates":[[[-111.5530,45.8922],[-111.5519,45.8922],[-111.5519,45.8916],[-111.5530,45.8916],[-111.5530,45.8922]]]}'),
  ('06-0450-08-2-03-04-0000', '502 1st Ave E', 'Robert Hansen', 0.22, 'R', 215000, 45.89050, -111.54985, '{"type":"Polygon","coordinates":[[[-111.5503,45.8908],[-111.5494,45.8908],[-111.5494,45.8902],[-111.5503,45.8902],[-111.5503,45.8908]]]}'),
  ('06-0450-11-1-05-02-0000', '715 3rd Ave E', 'Patricia Dawson', 0.28, 'R', 199580, 45.88920, -111.54720, '{"type":"Polygon","coordinates":[[[-111.5478,45.8896],[-111.5466,45.8896],[-111.5466,45.8888],[-111.5478,45.8888],[-111.5478,45.8896]]]}'),
  ('06-0450-22-4-00-00-0000', '75 Vigilante Way', 'Vigilante Commercial LLC', 1.2, 'NHB', 520000, 45.88650, -111.55500, '{"type":"Polygon","coordinates":[[[-111.5560,45.8872],[-111.5540,45.8872],[-111.5540,45.8858],[-111.5560,45.8858],[-111.5560,45.8872]]]}'),
  ('06-0450-10-3-02-01-0000', '605 3rd Ave W', 'James & Linda Morales', 0.30, 'R', 225000, 45.89000, -111.55450, '{"type":"Polygon","coordinates":[[[-111.5551,45.8904],[-111.5539,45.8904],[-111.5539,45.8896],[-111.5551,45.8896],[-111.5551,45.8904]]]}'),
  ('06-0450-14-2-04-06-0000', '219 4th Ave E', 'Diane Hay', 0.25, 'R', 210000, 45.89340, -111.54730, '{"type":"Polygon","coordinates":[[[-111.5479,45.8938],[-111.5467,45.8938],[-111.5467,45.8930],[-111.5479,45.8930],[-111.5479,45.8938]]]}'),
  ('06-0450-09-1-03-05-0000', '606 E Birch St', 'Michael Torres', 0.24, 'R', 187000, 45.89175, -111.54850, '{"type":"Polygon","coordinates":[[[-111.5491,45.8921],[-111.5479,45.8921],[-111.5479,45.8914],[-111.5491,45.8914],[-111.5491,45.8921]]]}');

-- Sample permits
INSERT OR IGNORE INTO permits (permit_number, permit_type_id, parcel_id, address, applicant_name, applicant_phone, applicant_email, status, description, valuation, latitude, longitude, submitted_at, zoning_district, flood_zone, fees_calculated, fees_paid, square_footage, assigned_to, priority, expires_at, reviewed_at, decision_date, conditions) VALUES
  ('ZP-R-2026-001', 1, '06-0450-12-1-01-01-0000', '121 E Jefferson St', 'Matt Bugland', '406-580-2211', 'mbugland@gmail.com', 'approved', 'New duplex construction - two 1,316 sq ft units with shared driveway', 385000, 45.89295, -111.54925, '2026-01-08', 'R', NULL, 200.00, 200.00, 2632, 1, 'normal', '2027-01-22', '2026-01-15', '2026-01-22', 'Must locate all corner pins before foundation pour.'),
  ('FP-2026-001', 6, '06-0450-08-2-03-04-0000', '502 1st Ave E', 'Robert Hansen', '406-285-9145', 'rhansen@threeforks.net', 'pending', 'Covered deck addition in FEMA AE flood zone', 12500, 45.89050, -111.54985, '2026-02-18', 'R', 'AE', 500.00, 0, 240, 1, 'high', NULL, NULL, NULL, NULL),
  ('ZP-C-2026-001', 2, '06-0450-22-4-00-00-0000', '75 Vigilante Way', 'Bridger Brewing LLC', '406-587-2124', 'permits@bridgerbrewing.com', 'approved', 'Tenant improvement for brewery taproom - kitchen buildout, bar, patio', 175000, 45.88650, -111.55500, '2026-01-22', 'NHB', NULL, 200.00, 200.00, 3800, 1, 'normal', '2027-02-05', '2026-01-29', '2026-02-05', 'Grease trap required. Fire suppression hood must be inspected.'),
  ('CUP-2026-001', 7, '06-0450-14-2-04-06-0000', '219 4th Ave E', 'Diane Hay', '406-285-7703', 'dianehay@outlook.com', 'under_review', 'Home occupation permit for massage therapy spa', 0, 45.89340, -111.54730, '2026-02-05', 'R', NULL, 500.00, 500.00, NULL, 1, 'normal', NULL, '2026-02-12', NULL, NULL),
  ('ZP-G-2026-001', 3, '06-0450-10-3-02-01-0000', '605 3rd Ave W', 'James Morales', '406-285-3392', 'jmorales@yahoo.com', 'approved', 'Detached 24x30 garage with concrete slab foundation', 42000, 45.89000, -111.55450, '2026-01-15', 'R', NULL, 100.00, 100.00, 720, 1, 'normal', '2027-01-29', '2026-01-22', '2026-01-29', 'Setbacks verified. Siding must match existing residence.'),
  ('ZP-A-2026-001', 5, '06-0450-11-1-05-02-0000', '715 3rd Ave E', 'Patricia Dawson', '406-285-4418', 'pdawson@gmail.com', 'under_review', 'New 640 sq ft ADU - studio above detached garage', 95000, 45.88920, -111.54720, '2026-02-10', 'R', NULL, 250.00, 250.00, 640, 1, 'normal', NULL, '2026-02-17', NULL, NULL),
  ('FP-2026-002', 6, '06-0450-09-1-03-05-0000', '606 E Birch St', 'Michael Torres', '406-285-6601', 'mtorres@threeforks.net', 'pending', 'Foundation repair in FEMA AE flood zone', 18000, 45.89175, -111.54850, '2026-02-20', 'R', 'AE', 500.00, 0, NULL, 1, 'normal', NULL, NULL, NULL, NULL),
  ('VAR-2026-001', 8, '06-0450-09-2-01-03-0000', '123 W Elm St', 'Cody Ham', '406-451-8820', 'cham@sawdustandsteel.com', 'approved', 'Side yard setback variance for outdoor beer garden', 35000, 45.89190, -111.55245, '2025-11-20', 'CBD', NULL, 500.00, 500.00, 400, 1, 'normal', '2026-12-18', '2025-12-04', '2025-12-18', 'Approved 5-0 by Board of Adjustment.'),
  ('CUP-2026-002', 7, '06-0450-12-1-01-02-0000', '126 E Jefferson St', 'Dennis Burr', '406-285-3150', 'dburr@montana.net', 'approved', 'Minor subdivision for RV campground - 4 RV sites, 3 cabins', 85000, 45.89310, -111.54870, '2025-12-10', 'R', NULL, 500.00, 500.00, NULL, 1, 'normal', '2027-01-14', '2025-12-17', '2026-01-14', 'Seasonal May-Oct only. Waste disposal per Gallatin County Health.'),
  ('ZP-D-2026-001', 4, '06-0450-15-3-02-08-0000', '5 N Main St', 'Sacajawea Hotel LLC', '406-285-6515', 'manager@sacajaweahotel.com', 'approved', 'Replace rear deck and add ADA ramp - historic property', 28000, 45.89415, -111.55130, '2026-01-28', 'CBD', NULL, 50.00, 50.00, 320, 1, 'normal', '2027-02-04', '2026-02-01', '2026-02-04', 'Materials must be consistent with historic character.');

-- Sample business licenses
INSERT OR IGNORE INTO business_licenses (license_number, license_type_id, business_name, dba_name, owner_name, owner_phone, owner_email, address, description, status, issued_date, expiration_date, annual_fee, fees_paid) VALUES
  ('BL-2026-001', 1, 'Sacajawea Hotel LLC', 'The Sacajawea Hotel', 'Colin Davis', '406-285-6515', 'manager@sacajaweahotel.com', '5 N Main St', 'Historic hotel and restaurant', 'active', '2026-01-02', '2026-12-31', 75.00, 75.00),
  ('BL-2026-002', 2, 'Sawdust and Steel Brewing LLC', NULL, 'Cody Ham', '406-451-8820', 'cham@sawdustandsteel.com', '123 W Elm St', 'Craft brewery and taproom', 'active', '2026-01-02', '2026-06-30', 500.00, 500.00),
  ('BL-2026-003', 3, 'Wheat Montana', NULL, 'Montana Flour & Grains Inc', '406-285-3614', 'info@wheatmt.com', '10778 US-287', 'Restaurant and bakery', 'active', '2026-01-02', '2026-12-31', 150.00, 150.00),
  ('BL-2026-004', 4, 'Diane Hay Massage', NULL, 'Diane Hay', '406-285-7703', 'dianehay@outlook.com', '219 4th Ave E', 'Home massage therapy practice', 'pending', NULL, NULL, 50.00, 0),
  ('BL-2026-005', 1, 'Bridger Brewing - Three Forks', NULL, 'Bridger Brewing LLC', '406-587-2124', 'permits@bridgerbrewing.com', '75 Vigilante Way', 'Brewery taproom and restaurant', 'pending', NULL, NULL, 75.00, 0);

-- Sample park reservations
INSERT OR IGNORE INTO park_reservations (reservation_number, facility_id, contact_name, contact_phone, contact_email, event_name, event_description, event_date, start_time, end_time, attendee_count, status, total_fee, fees_paid) VALUES
  ('PR-2026-001', 1, 'Sarah Mitchell', '406-285-4150', 'smitchell@gmail.com', 'Mitchell Family Reunion', 'Annual family gathering with BBQ', '2026-06-15', '10:00', '18:00', 45, 'approved', 75.00, 75.00),
  ('PR-2026-002', 3, 'Three Forks Chamber', '406-285-3198', 'info@threeforkschamber.com', 'Fourth of July Celebration', 'Annual community celebration with music and fireworks', '2026-07-04', '14:00', '22:00', 500, 'approved', 150.00, 150.00),
  ('PR-2026-003', 2, 'Mike Johnson', '406-285-5523', 'mjohnson@outlook.com', 'Little League Banquet', 'End of season awards banquet', '2026-08-20', '17:00', '20:00', 60, 'pending', 50.00, 0),
  ('PR-2026-004', 4, 'Three Forks Schools', '406-285-3224', 'admin@threeforks.k12.mt.us', 'Swim Team Practice', 'Summer swim team training sessions', '2026-06-01', '07:00', '09:00', 25, 'approved', 50.00, 50.00);

-- Sample citizen requests
INSERT OR IGNORE INTO citizen_requests (request_number, category_id, reporter_name, reporter_phone, reporter_email, address, description, latitude, longitude, status, priority, assigned_to) VALUES
  ('CR-2026-001', 1, 'Bob Stevens', '406-285-4421', 'bstevens@threeforks.net', 'E Jefferson St & 2nd Ave E', 'Large pothole forming near intersection, about 2ft wide', 45.8930, -111.5490, 'in_progress', 'normal', 3),
  ('CR-2026-002', 3, 'Linda Garcia', '406-285-7789', NULL, '400 Block S Main St', 'Water pooling in street, possible water main leak', 45.8910, -111.5515, 'submitted', 'high', NULL),
  ('CR-2026-003', 2, 'Anonymous', NULL, NULL, 'Corner of Ash St & 3rd Ave W', 'Street light has been out for two weeks', 45.8920, -111.5540, 'resolved', 'low', 3),
  ('CR-2026-004', 4, 'Tom Richards', '406-285-3301', 'trichards@gmail.com', '300 Block E Cedar St', 'Sidewalk heaved up by tree roots, trip hazard', 45.8925, -111.5480, 'submitted', 'normal', NULL),
  ('CR-2026-005', 9, 'Jane Wilson', '406-285-6678', 'jwilson@montana.net', '815 2nd Ave E', 'Neighbor appears to be running auto repair business from garage', 45.8915, -111.5470, 'submitted', 'normal', 1);

-- Sample fee payments
INSERT OR IGNORE INTO fee_payments (module, ref_id, amount, payment_method, reference_number, description, received_by, received_at) VALUES
  ('permits', 1, 200.00, 'check', '4482', 'Zoning Permit filing fee', 2, '2026-01-08'),
  ('permits', 3, 200.00, 'credit_card', 'CC-20260122', 'Commercial permit fee', 2, '2026-01-22'),
  ('permits', 4, 500.00, 'check', '4501', 'CUP filing fee', 2, '2026-02-05'),
  ('permits', 5, 100.00, 'check', '4478', 'Garage permit fee', 2, '2026-01-15'),
  ('permits', 6, 250.00, 'check', '4510', 'ADU permit fee', 2, '2026-02-10'),
  ('permits', 8, 500.00, 'check', '4401', 'Variance fee', 2, '2025-11-20'),
  ('permits', 9, 500.00, 'check', '4425', 'CUP fee', 2, '2025-12-10'),
  ('permits', 10, 50.00, 'cash', 'CASH-20260128', 'Deck permit fee', 2, '2026-01-28');

-- Sample inspections
INSERT OR IGNORE INTO inspections (permit_id, inspection_type, status, scheduled_date, completed_date, inspector_id, result, notes) VALUES
  (1, 'Foundation/Setback', 'passed', '2026-02-10', '2026-02-10', 1, 'pass', 'Corner pins located. Setbacks verified.'),
  (1, 'Framing', 'passed', '2026-02-28', '2026-02-28', 1, 'pass', 'Framing complete, firewall separation meets code.'),
  (1, 'Final', 'scheduled', '2026-03-20', NULL, 1, NULL, 'Final for occupancy - both units.'),
  (3, 'Final', 'passed', '2026-03-05', '2026-03-05', 1, 'pass', 'Kitchen hood verified. Approved for occupancy.'),
  (5, 'Foundation/Setback', 'passed', '2026-02-08', '2026-02-08', 1, 'pass', 'Slab forms in place. Setbacks confirmed.'),
  (5, 'Final', 'scheduled', '2026-03-15', NULL, 1, NULL, 'Verify siding color match and drainage.');

-- Sample deadlines
INSERT OR IGNORE INTO deadlines (module, ref_id, title, due_date, deadline_type, description) VALUES
  ('permits', 1, 'Final Inspection - Bugland Duplex', '2026-03-20', 'inspection', 'Final inspection both units'),
  ('permits', 2, 'Elevation Certificate Due', '2026-03-05', 'document', 'Updated elevation cert needed'),
  ('permits', 4, 'Planning Board Hearing', '2026-03-11', 'hearing', 'CUP public hearing 7:00 PM'),
  ('permits', 4, 'Council Hearing', '2026-04-08', 'hearing', 'Second required public hearing'),
  ('licenses', 1, 'Sacajawea License Renewal', '2026-12-31', 'renewal', 'Annual business license renewal'),
  ('licenses', 2, 'Liquor License Renewal', '2026-06-30', 'renewal', 'Annual liquor license renewal');
`;
