/*
# Seed Initial Data for Haharu Housing Portal

## Overview
Populates the database with the same initial data that was previously embedded in
`src/data/initialData.ts` and seeded to Firestore on first load.

## Data Inserted
1. **room_types** — 4 default room types (Single Deluxe, Studio Twin, 4-Bed Shared Dorm, Executive Suite)
2. **statuses** — 6 default status categories (Vacant, Occupied, Partially Occupied, Reserved, Cleaning, Maintenance)
3. **users** — 6 default user accounts for login (Admin, Property Manager, Staff, Tenant, View Only)
4. **food_waste_logs** — 3 sample waste log entries for the current date
5. **transfer_records** — 3 sample transfer records

## Notes
- Uses ON CONFLICT (id) DO NOTHING so re-running is safe — existing data is preserved.
- Timestamps use now() for created_at/updated_at to reflect seeding time.
- The app will check if room_types count is 0 on first load; if so, it seeds from the
  initial data in the frontend. This migration pre-seeds so the app has data immediately.
*/

-- Seed room_types
INSERT INTO room_types (id, name, default_bed_count, description, badge_color) VALUES
  ('rtype-1', 'Single Deluxe', 1, 'Private room with single bed and desk workspace', '#3b82f6'),
  ('rtype-2', 'Studio Twin', 2, 'Two single beds with kitchenette and private bath', '#10b981'),
  ('rtype-3', '4-Bed Shared Dorm', 4, 'Shared dorm with 4 bunk bed slots and individual lockers', '#8b5cf6'),
  ('rtype-4', 'Executive Suite', 1, 'Premium suite with living area and master bed', '#f59e0b')
ON CONFLICT (id) DO NOTHING;

-- Seed statuses
INSERT INTO statuses (id, name, type, color, description, is_occupied_state, is_maintenance_state) VALUES
  ('status-vacant', 'Vacant', 'both', '#10b981', 'Ready for immediate check-in', false, false),
  ('status-occupied', 'Occupied', 'both', '#3b82f6', 'Fully occupied bed or room', true, false),
  ('status-partially', 'Partially Occupied', 'room', '#06b6d4', 'Room has available beds remaining', true, false),
  ('status-reserved', 'Reserved', 'both', '#8b5cf6', 'Held for upcoming team member arrival', false, false),
  ('status-cleaning', 'Cleaning in Progress', 'room', '#f59e0b', 'Turnover cleaning undergoing', false, false),
  ('status-maintenance', 'Maintenance', 'both', '#ef4444', 'Out of service due to repairs', false, true)
ON CONFLICT (id) DO NOTHING;

-- Seed users
INSERT INTO users (id, email, password, name, role, employee_id, department, phone, created_at) VALUES
  ('usr-admin-aasnad', 'aasnad@avanihotels.com', 'adminpassword', 'Asnaad (Admin)', 'Admin', 'ADM-000', 'Housing Operations', '+1 (555) 011-0000', '2026-01-01T08:00:00Z'),
  ('usr-admin-1', 'admin@haharu.com', 'adminpassword', 'James Dalton', 'Admin', 'ADM-001', 'Housing Operations', '+1 (555) 011-2233', '2026-01-01T08:00:00Z'),
  ('usr-pm-1', 'pm@haharu.com', '123456', 'Marcus Vance', 'Property Manager', 'PM-202', 'Property Management', '+1 (555) 012-3456', '2026-01-02T08:00:00Z'),
  ('usr-staff-1', 'staff@haharu.com', '123456', 'Elena Rostova', 'Staff', 'STF-303', 'Facilities & Maintenance', '+1 (555) 013-4567', '2026-01-03T08:00:00Z'),
  ('usr-tenant-1', 'tenant@haharu.com', '123456', 'Alex Rivera', 'Tenant', 'EMP-909', 'Engineering', '+1 (555) 014-5678', '2026-01-04T08:00:00Z'),
  ('usr-viewonly-1', 'observer@haharu.com', '123456', 'Sarah Jenkins', 'View Only (Dashboard & Reports)', 'AUD-808', 'Executive Audit', '+1 (555) 015-6789', '2026-01-05T08:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Seed food_waste_logs
INSERT INTO food_waste_logs (id, date, meal_service, weight_kg, dining_hall_location, waste_reason, shift_notes, logged_by, logged_by_role, created_at, updated_at) VALUES
  ('fwl-101', CURRENT_DATE::text, 'Breakfast', 14.5, 'Bite', 'Over-preparation', 'Higher than normal fruit salad & scrambled egg surplus due to morning shift change.', 'Chef Marco Rossi', 'Staff', now(), now()),
  ('fwl-102', CURRENT_DATE::text, 'Lunch', 28.2, 'Bite', 'Plate waste', 'Heavy rice & pasta plate scrapings from afternoon rush.', 'Elena Rostova', 'Staff', now(), now()),
  ('fwl-103', CURRENT_DATE::text, 'Dinner', 19.8, 'Bite', 'Over-preparation', 'Soup & steamed vegetables left unserved at counter close.', 'Chef Marco Rossi', 'Staff', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Seed transfer_records
INSERT INTO transfer_records (id, psa_no, full_name, employee_id, position, nid_wp_no, arrival_date, departure_date, arrival_flight, departure_flight, rate, notes, status, created_at, updated_at, created_by) VALUES
  ('trf-101', 'PSA-2026-001', 'Ahmed Asnad', '30034', 'IT Manager', 'A289124', CURRENT_DATE::text, (CURRENT_DATE + INTERVAL '14 days')::date::text, 'EK652 @ 14:30 / MLE -> Resort', 'EK653 @ 22:15 / Resort -> MLE', 'STAFF', 'Annual IT Infrastructure Audit & Onsite Support', 'Pending', now(), now(), 'System Admin'),
  ('trf-102', 'PSA-2026-002', 'Ibrahim Rasheed', '30112', 'Senior F&B Supervisor', 'WP-88192', (CURRENT_DATE + INTERVAL '2 days')::date::text, (CURRENT_DATE + INTERVAL '10 days')::date::text, 'QR670 @ 09:15 / MLE -> Resort', 'QR671 @ 18:40 / Resort -> MLE', 'FOC/CIP', 'Transfer for seasonal banquet event coverage', 'Pending', now(), now(), 'James Dalton'),
  ('trf-103', 'PSA-2026-003', 'Fatimath Zaha', '30205', 'Housekeeping Executive', 'A194820', (CURRENT_DATE - INTERVAL '5 days')::date::text, (CURRENT_DATE - INTERVAL '1 day')::date::text, 'UL101 @ 11:00 / Male -> Resort', 'UL102 @ 16:30 / Resort -> Male', 'SUPPLIER', 'Deep cleaning turnover training', 'Completed', now(), now(), 'System Admin')
ON CONFLICT (id) DO NOTHING;
