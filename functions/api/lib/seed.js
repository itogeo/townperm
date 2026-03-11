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
  ('ANIMAL', 'Animal Control', 'Stray, injured, or loose livestock report — contact City Hall for after-hours', 'City Hall', 'normal'),
  ('NOISE', 'Noise/Nuisance', 'Persistent noise, junk vehicles, or property nuisance — for emergencies call 911', 'City Hall', 'low'),
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

-- Extended deadlines for new permits and license renewals
INSERT OR IGNORE INTO deadlines (module, ref_id, title, due_date, deadline_type, description) VALUES
  ('licenses', 3, 'Wheat Montana License Renewal', '2026-12-31', 'renewal', 'Annual food service license renewal'),
  ('licenses', 4, 'Bridger Brewing License Approval', '2026-04-15', 'other', 'Pending business license decision'),
  ('licenses', 5, 'Headwaters Vet License Decision', '2026-04-01', 'other', 'Pending business license decision'),
  ('licenses', 8, 'Pioneer Mountain Builders Renewal', '2026-12-31', 'renewal', 'Annual contractor license renewal'),
  ('licenses', 9, 'Valley Feed & Supply Renewal', '2026-12-31', 'renewal', 'Annual general business license renewal'),
  ('licenses', 14, 'Headwaters Grill Renewal', '2026-12-31', 'renewal', 'Annual food service license renewal');

-- Additional permits — spread across Three Forks
INSERT OR IGNORE INTO permits (permit_number, permit_type_id, parcel_id, address, applicant_name, applicant_phone, applicant_email, status, description, valuation, latitude, longitude, submitted_at, zoning_district, flood_zone, fees_calculated, fees_paid, square_footage, assigned_to, priority, expires_at, reviewed_at, decision_date, conditions) VALUES
  ('ZP-R-2026-002', 1, NULL, '318 E Cedar St', 'Angela Patterson', '406-285-4490', 'apatterson@gmail.com', 'approved', 'New single-family residence — 1,820 sq ft ranch style', 295000, 45.8945, -111.5483, '2026-01-10', 'R', NULL, 200.00, 200.00, 1820, 1, 'normal', '2027-01-25', '2026-01-17', '2026-01-25', 'Corner pins required. Setback from alley confirmed.'),
  ('ZP-G-2026-002', 3, NULL, '415 W Elm St', 'David & Susan Kline', '406-285-5512', 'dkline@outlook.com', 'approved', 'Detached 20x24 garage — wood frame, metal roof', 28500, 45.8912, -111.5558, '2026-01-18', 'R', NULL, 100.00, 100.00, 480, 1, 'normal', '2027-02-01', '2026-01-25', '2026-02-01', 'Siding to match house. Eave drip edge required.'),
  ('ZP-D-2026-002', 4, NULL, '220 W Birch St', 'Kyle Nettleton', '406-285-3381', 'knettleton@yahoo.com', 'approved', '12x16 wood deck — rear yard, concrete footings', 8400, 45.8892, -111.5546, '2026-01-25', 'R', NULL, 50.00, 50.00, 192, 1, 'normal', '2027-02-10', '2026-02-01', '2026-02-10', NULL),
  ('FP-2026-003', 6, NULL, '812 2nd Ave E', 'Tamara Griffith', '406-285-7722', 'tgriffith@threeforks.net', 'under_review', 'Accessory structure in FEMA AE flood zone — detached workshop', 22000, 45.8908, -111.5499, '2026-02-22', 'R', 'AE', 500.00, 500.00, 320, 1, 'high', NULL, '2026-03-01', NULL, NULL),
  ('CUP-2026-003', 7, NULL, '10 S Main St', 'Montana Pint LLC', '406-285-9900', 'info@montanapint.com', 'approved', 'CUP for food cart pad — three seasonal vendor stalls on parking lot', 15000, 45.8918, -111.5513, '2025-10-15', 'CBD', NULL, 500.00, 500.00, NULL, 1, 'normal', '2026-11-20', '2025-10-29', '2025-11-20', 'Stalls limited to May 1–Oct 31. Fire extinguisher at each stall.'),
  ('ZP-R-2026-003', 1, NULL, '501 4th Ave W', 'Nathan & Brooke Sims', '406-285-6623', 'nsims@gmail.com', 'pending', 'New 2,200 sq ft two-story residence — unfinished basement', 410000, 45.8927, -111.5590, '2026-03-01', 'R', NULL, 200.00, 0, 2200, 1, 'normal', NULL, NULL, NULL, NULL),
  ('ZP-C-2026-002', 2, NULL, '201 1st Ave W', 'Headwaters Vet Clinic LLC', '406-285-1122', 'info@headwatersvet.com', 'under_review', 'Tenant improvement — veterinary clinic exam rooms and surgery suite', 88000, 45.8930, -111.5531, '2026-02-14', 'CBD', NULL, 200.00, 200.00, 1600, 1, 'normal', NULL, '2026-02-21', NULL, NULL),
  ('WSC-2026-001', 10, NULL, '1105 E Cedar St', 'Dan Holbrook', '406-285-4401', 'dholbrook@montana.net', 'pending', 'New water and sewer connection — new residence hookup', 0, 45.8947, -111.5470, '2026-03-03', 'R', NULL, 250.00, 0, NULL, 1, 'normal', NULL, NULL, NULL, NULL),
  ('ZP-A-2026-002', 5, NULL, '305 4th Ave E', 'Carolyn Meyer', '406-285-8812', 'cmeyer@outlook.com', 'approved', '550 sq ft ADU above detached garage — alley access', 88000, 45.8938, -111.5473, '2025-11-01', 'R', NULL, 250.00, 250.00, 550, 1, 'normal', '2026-12-05', '2025-11-14', '2025-12-05', 'Separate utility meter required.'),
  ('VAR-2026-002', 8, NULL, '110 W Elm St', 'Jerry & Patty Strand', '406-285-2200', 'jstrand@gmail.com', 'approved', 'Rear yard setback variance — covered 12x20 porch addition', 24000, 45.8909, -111.5540, '2025-12-01', 'R', NULL, 500.00, 500.00, 240, 1, 'normal', '2026-01-15', '2025-12-15', '2026-01-15', 'Board approved 4-1. Porch may not be enclosed.'),
  ('ZP-G-2026-003', 3, NULL, '715 W Ash St', 'Roberto Fuentes', '406-285-5531', 'rfuentes@yahoo.com', 'pending', 'Detached 24x24 garage — concrete slab, metal siding', 36000, 45.8871, -111.5548, '2026-03-04', 'R', NULL, 100.00, 0, 576, 1, 'normal', NULL, NULL, NULL, NULL),
  ('ZP-D-2026-003', 4, NULL, '504 E Jefferson St', 'Mark & Ellen Hobbs', '406-285-4477', 'mhobbs@gmail.com', 'approved', '10x12 garden shed — pre-fab, anchored to concrete piers', 4500, 45.8932, -111.5477, '2026-02-01', 'R', NULL, 50.00, 50.00, 120, 1, 'normal', '2027-02-15', '2026-02-08', '2026-02-15', NULL),
  ('CUP-2026-004', 7, NULL, '205 E Birch St', 'Sunrise Ministries Inc', '406-285-7744', 'admin@sunriseministries.org', 'under_review', 'CUP for community food pantry in residential zone — weekly distribution', 0, 45.8891, -111.5506, '2026-02-25', 'R', NULL, 500.00, 500.00, NULL, 1, 'normal', NULL, '2026-03-04', NULL, NULL),
  ('ZP-R-2026-004', 1, NULL, '1020 1st Ave W', 'Craig & Lori Dawes', '406-285-3394', 'cdawes@gmail.com', 'pending', 'Modular home placement — 1,440 sq ft, permanent foundation', 185000, 45.8920, -111.5535, '2026-03-05', 'R', NULL, 200.00, 0, 1440, 1, 'normal', NULL, NULL, NULL, NULL),
  ('ZP-C-2026-003', 2, NULL, '100 Vigilante Way', 'Gallatin County Fair LLC', '406-285-5500', 'events@gallatinfair.com', 'approved', 'New 4,200 sq ft event pavilion — post and beam, concrete floor', 520000, 45.8860, -111.5545, '2025-09-20', 'NHB', NULL, 200.00, 200.00, 4200, 1, 'normal', '2026-10-25', '2025-10-05', '2025-10-25', 'Accessible parking required. Sprinkler system required over 3,500 sq ft.');

-- Additional business licenses
INSERT OR IGNORE INTO business_licenses (license_number, license_type_id, business_name, dba_name, owner_name, owner_phone, owner_email, address, description, status, issued_date, expiration_date, annual_fee, fees_paid) VALUES
  ('BL-2026-006', 1, 'Three Forks Motel', NULL, 'Raymond & Judy Cox', '406-285-3233', 'threeforksmotl@gmail.com', '10776 US-287', 'Budget motel and campground', 'active', '2026-01-02', '2026-12-31', 75.00, 75.00),
  ('BL-2026-007', 3, 'Headwaters Veterinary Clinic', NULL, 'Dr. Susan Baehr', '406-285-1122', 'info@headwatersvet.com', '201 1st Ave W', 'Small animal and livestock veterinary practice', 'pending', NULL, NULL, 150.00, 0),
  ('BL-2026-008', 5, 'Pioneer Mountain Builders LLC', NULL, 'Chris Radtke', '406-580-4411', 'chris@pioneermt.com', '612 E Cedar St', 'General residential contractor', 'active', '2026-01-15', '2026-12-31', 100.00, 100.00),
  ('BL-2026-009', 1, 'Valley Feed & Supply', NULL, 'Harold & Donna Trent', '406-285-4430', 'valleyfeed@montana.net', '8850 US-287', 'Farm supplies, livestock feed, fencing', 'active', '2026-01-02', '2026-12-31', 75.00, 75.00),
  ('BL-2026-010', 4, 'Clear Sky Consulting', NULL, 'Jennifer Wolfe', '406-285-6615', 'jen@clearskymt.com', '718 3rd Ave E', 'Environmental and planning consulting, home office', 'active', '2026-01-10', '2026-12-31', 50.00, 50.00),
  ('BL-2026-011', 5, 'Gallatin Valley Electric', NULL, 'Brad Sorenson', '406-285-8880', 'brad@gvelectric.com', '305 W Ash St', 'Licensed electrical contractor', 'active', '2026-01-08', '2026-12-31', 100.00, 100.00),
  ('BL-2026-012', 1, 'Main Street Realty', NULL, 'Tanya Bowen', '406-285-5544', 'tanya@mainstreetrealty.com', '15 N Main St', 'Real estate sales and property management', 'active', '2026-01-02', '2026-12-31', 75.00, 75.00),
  ('BL-2026-013', 1, 'Three Forks Hardware & Ranch Supply', NULL, 'Dale McKinley', '406-285-3320', 'threeforkshardware@gmail.com', '25 S Main St', 'Hardware store, ranch and farm supplies', 'active', '2026-01-02', '2026-12-31', 75.00, 75.00),
  ('BL-2026-014', 3, 'Headwaters Grill', NULL, 'Sandra & Pete Aguilar', '406-285-6690', 'headwatersgrill@gmail.com', '4 N Main St', 'Diner — breakfast, lunch, daily specials', 'active', '2026-01-05', '2026-12-31', 150.00, 150.00),
  ('BL-2026-015', 6, 'Prickly Pear Signs', NULL, 'Ryan Olson', '406-285-7701', 'ryan@pricklypearsigns.com', '810 E Birch St', 'Sign fabrication and installation', 'active', '2026-01-12', '2026-12-31', 25.00, 25.00);

-- Additional park reservations
INSERT OR IGNORE INTO park_reservations (reservation_number, facility_id, contact_name, contact_phone, contact_email, event_name, event_description, event_date, start_time, end_time, attendee_count, status, total_fee, fees_paid) VALUES
  ('PR-2026-005', 5, 'Three Forks Youth Baseball', '406-285-5541', 'coach@tfyouthball.org', 'Opening Day Tournament', '6-team single elimination bracket — ages 8-12', '2026-05-16', '08:00', '18:00', 150, 'approved', 50.00, 50.00),
  ('PR-2026-006', 3, 'Gallatin County Health Dept', '406-582-3100', 'health@gallatin.mt.gov', 'Back to School Immunization Clinic', 'Free immunizations for school-age children', '2026-08-05', '09:00', '15:00', 120, 'approved', 150.00, 150.00),
  ('PR-2026-007', 1, 'Mary & Jim Hensley', '406-285-4488', 'mhensley@outlook.com', 'Hensley-Crawford Wedding Reception', 'Outdoor reception, catered, DJ provided', '2026-07-19', '16:00', '22:00', 85, 'approved', 75.00, 75.00),
  ('PR-2026-008', 2, 'Three Forks Lions Club', '406-285-3198', 'lionsclub@threeforkschamber.com', 'Veterans Day Ceremony', 'Annual ceremony honoring local veterans', '2026-11-11', '10:00', '12:00', 80, 'pending', 50.00, 0),
  ('PR-2026-009', 3, 'Three Forks Farmers Market', '406-285-6611', 'farmersmarket@gmail.com', 'Summer Farmers Market — Opening Weekend', 'Local produce, crafts, food vendors', '2026-06-06', '08:00', '14:00', 250, 'approved', 150.00, 150.00),
  ('PR-2026-010', 4, 'Headwaters Swim Team', '406-285-3224', 'coach@hwswim.com', 'Summer Invitational Swim Meet', 'Youth competitive swim meet — 8 teams', '2026-07-11', '08:00', '17:00', 180, 'pending', 50.00, 0);

-- Additional citizen requests
INSERT OR IGNORE INTO citizen_requests (request_number, category_id, reporter_name, reporter_phone, reporter_email, address, description, latitude, longitude, status, priority, assigned_to) VALUES
  ('CR-2026-006', 1, 'Susan Wells', '406-285-6612', 'swells@gmail.com', '300 Block W Cedar St', 'Two large potholes developing on south side, about 18 inches wide each', 45.8944, -111.5543, 'submitted', 'normal', NULL),
  ('CR-2026-007', 2, 'Anonymous', NULL, NULL, 'E Jefferson St between 2nd and 3rd Ave', 'Street light flickering for two weeks then went dark', 45.8930, -111.5488, 'in_progress', 'low', 3),
  ('CR-2026-008', 3, 'Phil Hanson', '406-285-3310', 'phanson@threeforks.net', '415 S Main St', 'Hydrant appears to be leaking at the base, small puddle forming', 45.8905, -111.5513, 'submitted', 'high', NULL),
  ('CR-2026-009', 4, 'Lorraine Hatch', '406-285-5521', 'lhatch@yahoo.com', '605 E Birch St', 'Sidewalk completely heaved up, nearly 4 inch rise — elderly neighbor fell', 45.8889, -111.5485, 'in_progress', 'high', 3),
  ('CR-2026-010', 5, 'Walt Bergman', '406-285-4444', NULL, '2nd Ave E near Cedar St', 'Large cottonwood branch hanging over street — concerned about winter storm damage', 45.8942, -111.5494, 'submitted', 'low', NULL),
  ('CR-2026-011', 9, 'Kathy Monroe', '406-285-7730', 'kmonroe@gmail.com', '820 3rd Ave E', 'Multiple vehicles being stored and worked on in yard — running auto shop from home', 45.8888, -111.5469, 'submitted', 'normal', 1),
  ('CR-2026-012', 6, 'Derek Collins', '406-285-4401', NULL, 'Intersection of Ash St & Main St', 'Stop sign knocked off post — intersection has no signage', 45.8867, -111.5513, 'resolved', 'high', 3),
  ('CR-2026-013', 8, 'Anonymous', NULL, NULL, '500 Block 4th Ave E', 'Loud music and parties every weekend until 2am — multiple neighbors complaining', 45.8935, -111.5473, 'submitted', 'normal', NULL),
  ('CR-2026-014', 7, 'Alice Freeman', '406-285-3388', 'afreeman@outlook.com', '310 W Elm St', 'Large stray dog, brown and black, been in neighborhood 3 days, seems lost', 45.8909, -111.5557, 'resolved', 'normal', NULL),
  ('CR-2026-015', 1, 'Norm Christoffersen', '406-285-5501', NULL, 'Vigilante Way near railroad tracks', 'Road edge crumbling badly — about 50 feet of edge breaking off', 45.8855, -111.5532, 'in_progress', 'normal', 3),
  ('CR-2026-016', 3, 'Peggy Schultz', '406-285-6633', 'pschultz@gmail.com', '1100 Block E Cedar St', 'Water pressure very low since last week, neighbor also affected', 45.8947, -111.5469, 'submitted', 'high', NULL),
  ('CR-2026-017', 10, 'Bob & Dee Tremblay', '406-285-4499', 'btremblay@montana.net', '218 W Jefferson St', 'Abandoned vehicle — blue Chevy truck no plates, been here 3 weeks', 45.8929, -111.5536, 'submitted', 'low', NULL),
  ('CR-2026-018', 9, 'Frank Olson', '406-285-3355', NULL, '715 W Ash St', 'Neighbor building large accessory structure, believe they have no permit', 45.8871, -111.5548, 'submitted', 'normal', 1),
  ('CR-2026-019', 4, 'Nancy Drake', '406-285-7744', 'ndrake@gmail.com', '120 3rd Ave W', 'Raised sidewalk panel — front edge of panel sticking up 2+ inches, trip hazard', 45.8924, -111.5556, 'resolved', 'normal', 3),
  ('CR-2026-020', 2, 'Tom & Carolyn Eads', '406-285-4422', NULL, 'Headwaters Heritage Park — south entrance', 'Parking lot light out, area is very dark at night', 45.8898, -111.5553, 'submitted', 'low', NULL);

-- Dog permits (15 residential properties around Three Forks)
INSERT OR IGNORE INTO form_submissions (submission_number, form_type, form_name, data, status, submitted_at) VALUES
  ('GF-DOG-001', 'DOG', 'Additional Dog Permit', '{"owner_name":"Jake & Amy Larson","address":"318 E Cedar St","phone":"406-285-4490","email":"jlarson@gmail.com","dog_name":"Biscuit","breed":"Yellow Labrador","color":"Yellow, white belly","sex":"Neutered Male","age":"3","weight":"72","rabies_tag":"MT-24-8812","vaccination_date":"2025-08-15","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.8945,"longitude":-111.5483}', 'approved', '2026-01-15'),
  ('GF-DOG-002', 'DOG', 'Additional Dog Permit', '{"owner_name":"Susan & Mark Tully","address":"415 W Elm St","phone":"406-285-5512","email":"stully@outlook.com","dog_name":"Ranger","breed":"Border Collie","color":"Black and white","sex":"Male","age":"2","weight":"48","rabies_tag":"MT-24-9021","vaccination_date":"2025-09-10","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.8912,"longitude":-111.5558}', 'approved', '2026-01-18'),
  ('GF-DOG-003', 'DOG', 'Additional Dog Permit', '{"owner_name":"Patricia Dawson","address":"715 3rd Ave E","phone":"406-285-4418","email":"pdawson@gmail.com","dog_name":"Luna","breed":"Australian Shepherd","color":"Blue merle","sex":"Spayed Female","age":"4","weight":"55","rabies_tag":"MT-25-1045","vaccination_date":"2025-11-20","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.88920,"longitude":-111.54720}', 'approved', '2026-01-22'),
  ('GF-DOG-004', 'DOG', 'Additional Dog Permit', '{"owner_name":"Dennis & Cheryl Burr","address":"126 E Jefferson St","phone":"406-285-3150","email":"dburr@montana.net","dog_name":"Max","breed":"German Shepherd","color":"Black and tan","sex":"Neutered Male","age":"5","weight":"80","rabies_tag":"MT-24-6650","vaccination_date":"2025-07-08","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.89310,"longitude":-111.54870}', 'approved', '2026-01-28'),
  ('GF-DOG-005', 'DOG', 'Additional Dog Permit', '{"owner_name":"Robert Hansen","address":"502 1st Ave E","phone":"406-285-9145","email":"rhansen@threeforks.net","dog_name":"Daisy","breed":"Golden Retriever","color":"Light golden","sex":"Spayed Female","age":"6","weight":"65","rabies_tag":"MT-23-7741","vaccination_date":"2025-06-12","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.89050,"longitude":-111.54985}', 'approved', '2026-02-02'),
  ('GF-DOG-006', 'DOG', 'Additional Dog Permit', '{"owner_name":"James & Linda Morales","address":"605 3rd Ave W","phone":"406-285-3392","email":"jmorales@yahoo.com","dog_name":"Bolt","breed":"Siberian Husky","color":"Grey and white","sex":"Male","age":"1","weight":"52","rabies_tag":"MT-25-2201","vaccination_date":"2026-01-05","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.89000,"longitude":-111.55450}', 'approved', '2026-02-05'),
  ('GF-DOG-007', 'DOG', 'Additional Dog Permit', '{"owner_name":"Carolyn Meyer","address":"305 4th Ave E","phone":"406-285-8812","email":"cmeyer@outlook.com","dog_name":"Pepper","breed":"Dachshund","color":"Black and tan","sex":"Spayed Female","age":"7","weight":"14","rabies_tag":"MT-23-4490","vaccination_date":"2025-05-20","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.8938,"longitude":-111.5473}', 'received', '2026-02-10'),
  ('GF-DOG-008', 'DOG', 'Additional Dog Permit', '{"owner_name":"Kyle Nettleton","address":"220 W Birch St","phone":"406-285-3381","email":"knettleton@yahoo.com","dog_name":"Bear","breed":"Rottweiler","color":"Black and mahogany","sex":"Neutered Male","age":"3","weight":"110","rabies_tag":"MT-24-5512","vaccination_date":"2025-09-30","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.8892,"longitude":-111.5546}', 'approved', '2026-02-14'),
  ('GF-DOG-009', 'DOG', 'Additional Dog Permit', '{"owner_name":"Angela Patterson","address":"318 E Cedar St","phone":"406-285-4491","email":"apatterson2@gmail.com","dog_name":"Rosie","breed":"Beagle","color":"Tri-color","sex":"Spayed Female","age":"4","weight":"22","rabies_tag":"MT-25-3301","vaccination_date":"2025-12-10","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.8946,"longitude":-111.5480}', 'approved', '2026-02-18'),
  ('GF-DOG-010', 'DOG', 'Additional Dog Permit', '{"owner_name":"Jerry & Patty Strand","address":"110 W Elm St","phone":"406-285-2200","email":"jstrand@gmail.com","dog_name":"Scout","breed":"Labrador mix","color":"Chocolate brown","sex":"Male","age":"2","weight":"68","rabies_tag":"MT-25-4401","vaccination_date":"2026-01-15","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.8909,"longitude":-111.5540}', 'received', '2026-02-25'),
  ('GF-DOG-011', 'DOG', 'Additional Dog Permit', '{"owner_name":"Roberto Fuentes","address":"715 W Ash St","phone":"406-285-5531","email":"rfuentes@yahoo.com","dog_name":"Chico","breed":"Chihuahua mix","color":"Brown and white","sex":"Neutered Male","age":"6","weight":"9","rabies_tag":"MT-23-8811","vaccination_date":"2025-04-14","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.8871,"longitude":-111.5548}', 'approved', '2026-03-01'),
  ('GF-DOG-012', 'DOG', 'Additional Dog Permit', '{"owner_name":"Diane Hay","address":"219 4th Ave E","phone":"406-285-7703","email":"dianehay@outlook.com","dog_name":"Sadie","breed":"Shih Tzu","color":"White and gold","sex":"Spayed Female","age":"5","weight":"12","rabies_tag":"MT-24-7720","vaccination_date":"2025-10-01","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.89340,"longitude":-111.54730}', 'approved', '2026-01-12'),
  ('GF-DOG-013', 'DOG', 'Additional Dog Permit', '{"owner_name":"Mark & Ellen Hobbs","address":"504 E Jefferson St","phone":"406-285-4477","email":"mhobbs@gmail.com","dog_name":"Duke","breed":"Great Dane","color":"Brindle","sex":"Neutered Male","age":"2","weight":"145","rabies_tag":"MT-25-5501","vaccination_date":"2025-12-18","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.8932,"longitude":-111.5477}', 'received', '2026-03-05'),
  ('GF-DOG-014', 'DOG', 'Additional Dog Permit', '{"owner_name":"Nathan & Brooke Sims","address":"501 4th Ave W","phone":"406-285-6623","email":"nsims@gmail.com","dog_name":"Lola","breed":"Poodle mix","color":"Apricot","sex":"Spayed Female","age":"3","weight":"28","rabies_tag":"MT-25-6610","vaccination_date":"2026-01-20","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.8927,"longitude":-111.5590}', 'approved', '2026-02-20'),
  ('GF-DOG-015', 'DOG', 'Additional Dog Permit', '{"owner_name":"Michael Torres","address":"606 E Birch St","phone":"406-285-6601","email":"mtorres@threeforks.net","dog_name":"Rocky","breed":"Pitbull mix","color":"Grey brindle","sex":"Neutered Male","age":"4","weight":"58","rabies_tag":"MT-24-9901","vaccination_date":"2025-08-22","vet_name":"Headwaters Vet Clinic","vet_phone":"406-285-1122","latitude":45.89175,"longitude":-111.54850}', 'approved', '2026-01-30');

-- Chicken permits (12 properties)
INSERT OR IGNORE INTO form_submissions (submission_number, form_type, form_name, data, status, submitted_at) VALUES
  ('GF-CHK-001', 'CHK', 'Chicken Permit Application', '{"applicant_name":"James & Linda Morales","address":"605 3rd Ave W","phone":"406-285-3392","email":"jmorales@yahoo.com","num_chickens":"4","coop_location":"Northeast corner of backyard, behind fence, approximately 40 feet from back door","coop_dimensions":"6x8 ft","run_dimensions":"8x16 ft","distance_property_line":"8 feet","distance_dwelling":"40 feet","neighbor_notification":"Yes - All Notified","latitude":45.89000,"longitude":-111.55450}', 'approved', '2025-11-20'),
  ('GF-CHK-002', 'CHK', 'Chicken Permit Application', '{"applicant_name":"Dennis & Cheryl Burr","address":"126 E Jefferson St","phone":"406-285-3150","email":"dburr@montana.net","num_chickens":"6","coop_location":"South end of large lot, separate structure from house, screened from street","coop_dimensions":"8x10 ft","run_dimensions":"10x20 ft","distance_property_line":"15 feet","distance_dwelling":"55 feet","neighbor_notification":"Yes - All Notified","latitude":45.89310,"longitude":-111.54870}', 'approved', '2025-12-05'),
  ('GF-CHK-003', 'CHK', 'Chicken Permit Application', '{"applicant_name":"Angela Patterson","address":"318 E Cedar St","phone":"406-285-4490","email":"apatterson@gmail.com","num_chickens":"4","coop_location":"Northwest corner of fenced backyard","coop_dimensions":"5x6 ft","run_dimensions":"6x12 ft","distance_property_line":"10 feet","distance_dwelling":"35 feet","neighbor_notification":"Yes - All Notified","latitude":45.8945,"longitude":-111.5483}', 'approved', '2026-01-08'),
  ('GF-CHK-004', 'CHK', 'Chicken Permit Application', '{"applicant_name":"Patricia Dawson","address":"715 3rd Ave E","phone":"406-285-4418","email":"pdawson@gmail.com","num_chickens":"3","coop_location":"Rear of property adjacent to existing shed, not visible from street","coop_dimensions":"4x6 ft","run_dimensions":"6x10 ft","distance_property_line":"12 feet","distance_dwelling":"50 feet","neighbor_notification":"Yes - All Notified","latitude":45.88920,"longitude":-111.54720}', 'approved', '2026-01-15'),
  ('GF-CHK-005', 'CHK', 'Chicken Permit Application', '{"applicant_name":"Jerry & Patty Strand","address":"110 W Elm St","phone":"406-285-2200","email":"jstrand@gmail.com","num_chickens":"5","coop_location":"South backyard, cedar fence around run, neighbor approved","coop_dimensions":"6x8 ft","run_dimensions":"8x16 ft","distance_property_line":"8 feet","distance_dwelling":"38 feet","neighbor_notification":"Yes - All Notified","latitude":45.8909,"longitude":-111.5540}', 'reviewed', '2026-02-01'),
  ('GF-CHK-006', 'CHK', 'Chicken Permit Application', '{"applicant_name":"Carolyn Meyer","address":"305 4th Ave E","phone":"406-285-8812","email":"cmeyer@outlook.com","num_chickens":"4","coop_location":"Attached lean-to coop on back of garage, large fenced run","coop_dimensions":"5x8 ft","run_dimensions":"10x20 ft","distance_property_line":"14 feet","distance_dwelling":"45 feet","neighbor_notification":"Yes - All Notified","latitude":45.8938,"longitude":-111.5473}', 'approved', '2026-01-25'),
  ('GF-CHK-007', 'CHK', 'Chicken Permit Application', '{"applicant_name":"Kyle Nettleton","address":"220 W Birch St","phone":"406-285-3381","email":"knettleton@yahoo.com","num_chickens":"6","coop_location":"Back corner of yard, behind privacy fence, 12 feet from alley","coop_dimensions":"6x10 ft","run_dimensions":"10x20 ft","distance_property_line":"10 feet","distance_dwelling":"44 feet","neighbor_notification":"Yes - All Notified","latitude":45.8892,"longitude":-111.5546}', 'approved', '2026-02-10'),
  ('GF-CHK-008', 'CHK', 'Chicken Permit Application', '{"applicant_name":"Mark & Ellen Hobbs","address":"504 E Jefferson St","phone":"406-285-4477","email":"mhobbs@gmail.com","num_chickens":"4","coop_location":"East side of yard near garden, predator-proof run with hardware cloth","coop_dimensions":"5x6 ft","run_dimensions":"6x12 ft","distance_property_line":"9 feet","distance_dwelling":"32 feet","neighbor_notification":"In Progress","latitude":45.8932,"longitude":-111.5477}', 'received', '2026-03-02'),
  ('GF-CHK-009', 'CHK', 'Chicken Permit Application', '{"applicant_name":"Roberto Fuentes","address":"715 W Ash St","phone":"406-285-5531","email":"rfuentes@yahoo.com","num_chickens":"5","coop_location":"South backyard, existing storage structure converted to coop","coop_dimensions":"8x8 ft","run_dimensions":"8x24 ft","distance_property_line":"11 feet","distance_dwelling":"48 feet","neighbor_notification":"Yes - All Notified","latitude":45.8871,"longitude":-111.5548}', 'approved', '2026-01-20'),
  ('GF-CHK-010', 'CHK', 'Chicken Permit Application', '{"applicant_name":"Craig & Lori Dawes","address":"1020 1st Ave W","phone":"406-285-3394","email":"cdawes@gmail.com","num_chickens":"3","coop_location":"Backyard shed converted, separate enclosed run area","coop_dimensions":"6x6 ft","run_dimensions":"6x16 ft","distance_property_line":"10 feet","distance_dwelling":"36 feet","neighbor_notification":"Yes - All Notified","latitude":45.8920,"longitude":-111.5535}', 'received', '2026-03-06'),
  ('GF-CHK-011', 'CHK', 'Chicken Permit Application', '{"applicant_name":"Nathan & Brooke Sims","address":"501 4th Ave W","phone":"406-285-6623","email":"nsims@gmail.com","num_chickens":"4","coop_location":"Rear right corner of large lot, well away from all structures","coop_dimensions":"5x7 ft","run_dimensions":"7x14 ft","distance_property_line":"16 feet","distance_dwelling":"60 feet","neighbor_notification":"Yes - All Notified","latitude":45.8927,"longitude":-111.5590}', 'approved', '2026-02-15'),
  ('GF-CHK-012', 'CHK', 'Chicken Permit Application', '{"applicant_name":"Robert Hansen","address":"502 1st Ave E","phone":"406-285-9145","email":"rhansen@threeforks.net","num_chickens":"6","coop_location":"Backyard near alley, fenced run with shade structure","coop_dimensions":"6x8 ft","run_dimensions":"8x20 ft","distance_property_line":"8 feet","distance_dwelling":"30 feet","neighbor_notification":"Yes - All Notified","latitude":45.89050,"longitude":-111.54985}', 'approved', '2026-01-05');

-- Board, traffic, and other form submissions
INSERT OR IGNORE INTO form_submissions (submission_number, form_type, form_name, data, status, submitted_at) VALUES
  ('GF-BRD-001', 'BRD', 'Board / Committee Application', '{"name":"William Chen","address":"415 W Elm St","phone":"406-285-5513","email":"wchen@gmail.com","occupation":"Civil Engineer","board_name":"Planning Board","qualifications":"10 years experience in infrastructure planning and GIS, familiar with Montana zoning law","interest_reason":"I want to help Three Forks plan thoughtfully for growth while preserving small-town character","is_resident":"Yes"}', 'reviewed', '2026-02-01'),
  ('GF-BRD-002', 'BRD', 'Board / Committee Application', '{"name":"Rebecca Nolan","address":"720 4th Ave E","phone":"406-285-6633","email":"rnolan@outlook.com","occupation":"Retired Teacher","board_name":"Park Board","qualifications":"Longtime coach and parks volunteer, managed youth sports leagues for 15 years","interest_reason":"I believe great parks are the heart of a small town and want to advocate for youth programming","is_resident":"Yes"}', 'approved', '2026-01-22'),
  ('GF-BRD-003', 'BRD', 'Board / Committee Application', '{"name":"George Sandoval","address":"312 W Cedar St","phone":"406-285-3300","email":"gsandoval@gmail.com","occupation":"Contractor","board_name":"Board of Adjustment","qualifications":"20 years in residential construction, familiar with setback and variance issues from contractor side","interest_reason":"Want to give practical perspective to variance decisions, ensure fair outcomes for residents","is_resident":"Yes"}', 'received', '2026-03-05'),
  ('GF-SEC-001', 'SEC', 'Security Check Request', '{"owner_name":"Linda Garcia","address":"400 Block S Main St","phone":"406-285-7789","departure_date":"2026-03-15","return_date":"2026-03-29","emergency_name":"Donna Garcia","emergency_phone":"406-285-9911","vehicles":"None","lights_timers":"Yes","mail_stopped":"Yes","pets":"None","alarm":"Yes","instructions":"Key hidden under front mat. Please check gate latch — it sometimes swings open."}', 'approved', '2026-03-10'),
  ('GF-SEC-002', 'SEC', 'Security Check Request', '{"owner_name":"Norm Christoffersen","address":"Vigilante Way near railroad","phone":"406-285-5501","departure_date":"2026-04-05","return_date":"2026-04-19","emergency_name":"Ron Christoffersen","emergency_phone":"406-285-5502","vehicles":"White Ford pickup in driveway","lights_timers":"No","mail_stopped":"Yes","pets":"None","alarm":"No","instructions":"Check barn door latch. Property includes equipment shed on east side."}', 'received', '2026-03-06'),
  ('GF-PRR-001', 'PRR', 'Public Records Request', '{"name":"Taylor Enterprises LLC","address":"PO Box 411, Bozeman MT 59715","phone":"406-587-0012","email":"info@taylorent.com","cell":"406-581-0012","description":"All building permits issued for properties on Vigilante Way and adjacent parcels from 2020 to present, including any pending applications","delivery":"Electronic/Email"}', 'approved', '2026-02-20'),
  ('GF-PRR-002', 'PRR', 'Public Records Request', '{"name":"Bozeman Daily Chronicle","address":"2820 W College St, Bozeman MT 59718","phone":"406-587-4491","email":"news@bozchron.com","description":"Zoning violations and code enforcement actions from January 2025 through present, redacted as allowed by law","delivery":"Electronic/Email"}', 'received', '2026-03-08'),
  ('GF-TRF-001', 'TRF', 'Traffic / Sign Request', '{"name":"Cedar Street Neighborhood Assoc","address":"300 Block E Cedar St","phone":"406-285-4499","email":"cedarneighbors@gmail.com","location":"E Cedar St between 2nd and 4th Ave E","request_type":"Speed Limit Change","description":"Requesting posted speed limit reduction from 25 to 15 mph on Cedar St — school children walk this route daily and speeding is a real concern","urgency":"Safety Concern"}', 'reviewed', '2026-02-28'),
  ('GF-EMP-001', 'EMP', 'Employment Application', '{"name":"Rivera, Antonio J.","date_available":"2026-04-01","address":"1415 Bridger Dr, Bozeman MT 59715","city":"Bozeman","state":"MT","zip":"59715","phone":"406-581-2233","email":"arivera@gmail.com","position":"Public Works Technician","work_auth":"Yes","prev_city_employee":"No","hs_name":"Bozeman High School","hs_grad":"Yes","college_name":"MSU Bozeman","college_grad":"Yes","college_degree":"BS Civil Engineering Technology","ref1_name":"Mike Jensen","ref1_relation":"Former Supervisor","ref1_phone":"406-582-1100","emp1_company":"City of Bozeman Public Works","emp1_title":"Water Systems Tech","emp1_dates":"2022-2025","emp1_reason":"Seeking advancement opportunity in smaller community"}', 'reviewed', '2026-03-07');

-- More business licenses (to total ~25)
INSERT OR IGNORE INTO business_licenses (license_number, license_type_id, business_name, dba_name, owner_name, owner_phone, owner_email, address, description, employee_count, status, issued_date, expiration_date, annual_fee, fees_paid) VALUES
  ('BL-2026-016', 3, 'Three Forks Family Pharmacy', NULL, 'Doug & Wendy Harstad', '406-285-4400', 'pharmacy@threeforks.net', '20 N Main St', 'Independent pharmacy and compounding', 4, 'active', '2026-01-02', '2026-12-31', 150.00, 150.00),
  ('BL-2026-017', 2, 'Headwaters Spirits LLC', 'Headwaters Distillery', 'Aaron & Jen Walters', '406-285-9910', 'info@headwatersspirits.com', '88 W Cedar St', 'Craft distillery with tasting room', 6, 'active', '2026-01-05', '2026-06-30', 500.00, 500.00),
  ('BL-2026-018', 4, 'Gallatin Accounting', NULL, 'Barbara Finch CPA', '406-285-3320', 'bfinch@gallatinaccounting.com', '411 4th Ave E', 'CPA firm — tax and bookkeeping, home office', 1, 'active', '2026-01-12', '2026-12-31', 50.00, 50.00),
  ('BL-2026-019', 5, 'Rocking R Excavation LLC', NULL, 'Randy Rhodes', '406-285-5540', 'randy@rockingrexcavation.com', '9120 US-287', 'Excavation, grading, and site work contractor', 5, 'active', '2026-01-08', '2026-12-31', 100.00, 100.00),
  ('BL-2026-020', 1, 'Gallatin Valley Fitness', NULL, 'Travis & Kim Olson', '406-285-8841', 'gvfitness@gmail.com', '68 S Main St', 'Gym and fitness center with personal training', 8, 'active', '2026-01-02', '2026-12-31', 75.00, 75.00),
  ('BL-2026-021', 3, 'Elkhorn Bakery & Deli', NULL, 'Maria Hernandez', '406-285-4411', 'elkhorn@gmail.com', '12 E Jefferson St', 'Artisan bakery, sandwiches, daily soups', 7, 'pending', NULL, NULL, 150.00, 0),
  ('BL-2026-022', 4, 'Headwaters Pet Sitting', NULL, 'Courtney Bell', '406-285-7755', 'courtney@hwpetsitting.com', '508 3rd Ave W', 'In-home pet sitting and dog walking', 1, 'active', '2026-01-20', '2026-12-31', 50.00, 50.00),
  ('BL-2026-023', 1, 'Three Forks Auto Parts', NULL, 'Dale & Tammy Schroeder', '406-285-3390', 'tfautoparts@montana.net', '605 W Cedar St', 'Auto parts and accessories retail', 3, 'active', '2026-01-02', '2026-12-31', 75.00, 75.00),
  ('BL-2026-024', 5, 'Big Sky Plumbing & Heating', NULL, 'Jeff McAllister', '406-285-6640', 'jeff@bigsky-plumbing.com', '712 4th Ave E', 'Licensed plumber and HVAC contractor', 4, 'active', '2026-01-15', '2026-12-31', 100.00, 100.00),
  ('BL-2026-025', 7, 'Farmers Market — Three Forks', NULL, 'Three Forks Chamber of Commerce', '406-285-3198', 'info@threeforkschamber.com', 'Headwaters Heritage Park', 'Seasonal outdoor farmers market, Saturdays June-Sept', NULL, 'active', '2026-05-01', '2026-09-30', 50.00, 50.00);

-- More park reservations (to total ~15)
INSERT OR IGNORE INTO park_reservations (reservation_number, facility_id, contact_name, contact_phone, contact_email, event_name, event_description, event_date, start_time, end_time, attendee_count, status, total_fee, fees_paid) VALUES
  ('PR-2026-011', 1, 'Karen & Scott Jensen', '406-285-4451', 'kjensen@gmail.com', 'Jensen 50th Anniversary', 'Golden anniversary celebration, catered, family only', '2026-08-01', '12:00', '20:00', 65, 'approved', 75.00, 75.00),
  ('PR-2026-012', 3, 'Three Forks High School', '406-285-3224', 'principal@threeforks.k12.mt.us', 'Senior Class Graduation Party', 'Post-graduation celebration for Class of 2026', '2026-06-07', '18:00', '23:00', 200, 'pending', 150.00, 0),
  ('PR-2026-013', 5, 'Gallatin Valley Soccer Association', '406-285-6641', 'gvsa@gmail.com', 'Youth Soccer Tournament', '8U and 10U round-robin tournament — 6 teams', '2026-09-13', '08:00', '17:00', 120, 'approved', 50.00, 50.00),
  ('PR-2026-014', 2, 'Three Forks Boy Scout Troop 112', '406-285-3300', 'scoutmaster112@gmail.com', 'Eagle Scout Court of Honor', 'Court of honor for two Eagle Scout recipients', '2026-05-30', '14:00', '17:00', 50, 'approved', 50.00, 50.00),
  ('PR-2026-015', 4, 'Headwaters Swim Lessons', '406-285-3224', 'pool@threeforks.gov', 'Summer Learn-to-Swim Program', 'Week 1 of 4-week learn-to-swim series for ages 4-12', '2026-06-22', '09:00', '12:00', 30, 'approved', 50.00, 50.00);

-- Fix 311 categories: Animal Control and Noise should not route to Police
UPDATE request_categories SET department = 'City Hall', description = 'Stray, injured, or loose livestock report — contact City Hall for after-hours' WHERE code = 'ANIMAL';
UPDATE request_categories SET department = 'City Hall', name = 'Noise/Nuisance', description = 'Persistent noise, junk vehicles, or property nuisance — for emergencies call 911' WHERE code = 'NOISE';
`;
