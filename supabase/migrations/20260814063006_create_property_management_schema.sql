/*
# Create Property Management Schema (Haharu Housing Portal)

## Overview
Migrates the Haharu housing management app from Firebase/Firestore to Supabase/Postgres.
This is a single-tenant app with custom (non-Supabase) auth — login checks email/password
against records in the `users` table. No `auth.uid()` ownership checks are used.

## New Tables (11 total)
1. **buildings** — property buildings (id, name, code, description, created_at)
2. **floors** — floors within buildings (id, building_id FK, number, label, description)
3. **room_types** — room type definitions (id, name, default_bed_count, description, badge_color)
4. **statuses** — status categories for rooms/beds (id, name, type, color, description, is_occupied_state, is_maintenance_state)
5. **rooms** — individual rooms (id, building_id FK, floor_id FK, room_number, room_type_id, total_beds, status_id, notes, last_cleaned, updated_at)
6. **beds** — beds within rooms (id, room_id FK, bed_number, label, status_id, assigned_to JSONB, notes)
7. **users** — app user profiles for login (id, email, password, name, role, employee_id, department, assigned_building_ids, assigned_bed_id, phone, avatar_url, created_at, module_permissions JSONB)
8. **maintenance_requests** — maintenance tickets (id, title, description, category, urgency, status, building_id, floor_id, room_id, bed_id, requester_id, requester_name, requester_role, contact_phone, assigned_technician, assigned_technician_phone, created_at, updated_at, completed_at, resolution_notes, update_room_bed_status_on_complete)
9. **food_waste_logs** — food waste tracking entries (id, date, meal_service, weight_kg, dining_hall_location, prepared_servings, unconsumed_servings, waste_reason, shift_notes, logged_by, logged_by_user_id, logged_by_role, created_at, updated_at)
10. **transfer_records** — transfer tracker entries (id, psa_no, full_name, employee_id, position, department, transport, nid_wp_no, request_id, linked_request_id, leave_type, leg_type, trip_group_id, linked_transfer_id, linked_psa_no, arrival_date, departure_date, arrival_flight, departure_flight, flight_details, preferred_flight_timing, check_in_time, check_in_close, departure_time, rate, notes, status, created_at, updated_at, created_by, last_modified_by, audit_logs JSONB)
11. **activity_logs** — audit log entries (id, timestamp, action, title, details, actor, actor_email, actor_role, ip_address, browser, device_type)

## Security
- RLS enabled on every table.
- Policies: TO anon, authenticated with USING(true) / WITH CHECK(true) — this is a single-tenant
  app with custom auth. The frontend uses the anon key for all operations. There is no Supabase
  Auth sign-in screen, so authenticated-only policies would make all data invisible to the app.

## Important Notes
1. All tables use TEXT primary keys because the app generates its own IDs (e.g. `bldg-1700000000`).
   This preserves all existing document IDs from Firestore without migration conflicts.
2. JSONB columns used for nested/variable-shape data: beds.assigned_to, users.module_permissions,
   transfer_records.audit_logs.
3. Foreign keys set to CASCADE on parent deletion for floors, rooms, beds.
4. Seed data is inserted in a follow-up migration to keep this one focused on schema.
*/

-- 1. buildings
CREATE TABLE IF NOT EXISTS buildings (
  id text PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_buildings" ON buildings;
CREATE POLICY "anon_select_buildings" ON buildings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_buildings" ON buildings;
CREATE POLICY "anon_insert_buildings" ON buildings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_buildings" ON buildings;
CREATE POLICY "anon_update_buildings" ON buildings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_buildings" ON buildings;
CREATE POLICY "anon_delete_buildings" ON buildings FOR DELETE TO anon, authenticated USING (true);

-- 2. floors
CREATE TABLE IF NOT EXISTS floors (
  id text PRIMARY KEY,
  building_id text NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  number integer NOT NULL,
  label text NOT NULL,
  description text DEFAULT ''
);
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_floors" ON floors;
CREATE POLICY "anon_select_floors" ON floors FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_floors" ON floors;
CREATE POLICY "anon_insert_floors" ON floors FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_floors" ON floors;
CREATE POLICY "anon_update_floors" ON floors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_floors" ON floors;
CREATE POLICY "anon_delete_floors" ON floors FOR DELETE TO anon, authenticated USING (true);

-- 3. room_types
CREATE TABLE IF NOT EXISTS room_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  default_bed_count integer NOT NULL DEFAULT 1,
  description text DEFAULT '',
  badge_color text DEFAULT '#3b82f6'
);
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_room_types" ON room_types;
CREATE POLICY "anon_select_room_types" ON room_types FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_room_types" ON room_types;
CREATE POLICY "anon_insert_room_types" ON room_types FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_room_types" ON room_types;
CREATE POLICY "anon_update_room_types" ON room_types FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_room_types" ON room_types;
CREATE POLICY "anon_delete_room_types" ON room_types FOR DELETE TO anon, authenticated USING (true);

-- 4. statuses
CREATE TABLE IF NOT EXISTS statuses (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'both',
  color text NOT NULL,
  description text DEFAULT '',
  is_occupied_state boolean DEFAULT false,
  is_maintenance_state boolean DEFAULT false
);
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_statuses" ON statuses;
CREATE POLICY "anon_select_statuses" ON statuses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_statuses" ON statuses;
CREATE POLICY "anon_insert_statuses" ON statuses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_statuses" ON statuses;
CREATE POLICY "anon_update_statuses" ON statuses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_statuses" ON statuses;
CREATE POLICY "anon_delete_statuses" ON statuses FOR DELETE TO anon, authenticated USING (true);

-- 5. rooms
CREATE TABLE IF NOT EXISTS rooms (
  id text PRIMARY KEY,
  building_id text NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  floor_id text NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  room_type_id text NOT NULL REFERENCES room_types(id),
  total_beds integer NOT NULL DEFAULT 1,
  status_id text NOT NULL,
  notes text DEFAULT '',
  last_cleaned text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_rooms" ON rooms;
CREATE POLICY "anon_select_rooms" ON rooms FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_rooms" ON rooms;
CREATE POLICY "anon_insert_rooms" ON rooms FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_rooms" ON rooms;
CREATE POLICY "anon_update_rooms" ON rooms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_rooms" ON rooms;
CREATE POLICY "anon_delete_rooms" ON rooms FOR DELETE TO anon, authenticated USING (true);

-- 6. beds
CREATE TABLE IF NOT EXISTS beds (
  id text PRIMARY KEY,
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  bed_number integer NOT NULL,
  label text NOT NULL,
  status_id text NOT NULL,
  assigned_to jsonb,
  notes text
);
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_beds" ON beds;
CREATE POLICY "anon_select_beds" ON beds FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_beds" ON beds;
CREATE POLICY "anon_insert_beds" ON beds FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_beds" ON beds;
CREATE POLICY "anon_update_beds" ON beds FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_beds" ON beds;
CREATE POLICY "anon_delete_beds" ON beds FOR DELETE TO anon, authenticated USING (true);

-- 7. users
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text NOT NULL,
  password text,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'Staff',
  employee_id text,
  department text,
  assigned_building_ids text[] DEFAULT '{}',
  assigned_bed_id text,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  module_permissions jsonb
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE TO anon, authenticated USING (true);

-- 8. maintenance_requests
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL,
  urgency text NOT NULL,
  status text NOT NULL DEFAULT 'New',
  building_id text,
  floor_id text,
  room_id text,
  bed_id text,
  requester_id text,
  requester_name text,
  requester_role text,
  contact_phone text,
  assigned_technician text,
  assigned_technician_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  resolution_notes text,
  update_room_bed_status_on_complete boolean DEFAULT true
);
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_maintenance_requests" ON maintenance_requests;
CREATE POLICY "anon_select_maintenance_requests" ON maintenance_requests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_maintenance_requests" ON maintenance_requests;
CREATE POLICY "anon_insert_maintenance_requests" ON maintenance_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_maintenance_requests" ON maintenance_requests;
CREATE POLICY "anon_update_maintenance_requests" ON maintenance_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_maintenance_requests" ON maintenance_requests;
CREATE POLICY "anon_delete_maintenance_requests" ON maintenance_requests FOR DELETE TO anon, authenticated USING (true);

-- 9. food_waste_logs
CREATE TABLE IF NOT EXISTS food_waste_logs (
  id text PRIMARY KEY,
  date text NOT NULL,
  meal_service text NOT NULL,
  weight_kg numeric NOT NULL DEFAULT 0,
  dining_hall_location text NOT NULL,
  prepared_servings integer,
  unconsumed_servings integer,
  waste_reason text NOT NULL,
  shift_notes text,
  logged_by text NOT NULL,
  logged_by_user_id text,
  logged_by_role text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE food_waste_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_food_waste_logs" ON food_waste_logs;
CREATE POLICY "anon_select_food_waste_logs" ON food_waste_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_food_waste_logs" ON food_waste_logs;
CREATE POLICY "anon_insert_food_waste_logs" ON food_waste_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_food_waste_logs" ON food_waste_logs;
CREATE POLICY "anon_update_food_waste_logs" ON food_waste_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_food_waste_logs" ON food_waste_logs;
CREATE POLICY "anon_delete_food_waste_logs" ON food_waste_logs FOR DELETE TO anon, authenticated USING (true);

-- 10. transfer_records
CREATE TABLE IF NOT EXISTS transfer_records (
  id text PRIMARY KEY,
  psa_no text NOT NULL,
  full_name text NOT NULL,
  employee_id text NOT NULL,
  position text NOT NULL,
  department text,
  transport text,
  nid_wp_no text NOT NULL,
  request_id text,
  linked_request_id text,
  leave_type text,
  leg_type text,
  trip_group_id text,
  linked_transfer_id text,
  linked_psa_no text,
  arrival_date text,
  departure_date text,
  arrival_flight text,
  departure_flight text,
  flight_details text,
  preferred_flight_timing text,
  check_in_time text,
  check_in_close text,
  departure_time text,
  rate text,
  notes text,
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by text,
  last_modified_by text,
  audit_logs jsonb DEFAULT '[]'::jsonb
);
ALTER TABLE transfer_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_transfer_records" ON transfer_records;
CREATE POLICY "anon_select_transfer_records" ON transfer_records FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_transfer_records" ON transfer_records;
CREATE POLICY "anon_insert_transfer_records" ON transfer_records FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_transfer_records" ON transfer_records;
CREATE POLICY "anon_update_transfer_records" ON transfer_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_transfer_records" ON transfer_records;
CREATE POLICY "anon_delete_transfer_records" ON transfer_records FOR DELETE TO anon, authenticated USING (true);

-- 11. activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id text PRIMARY KEY,
  timestamp timestamptz NOT NULL DEFAULT now(),
  action text NOT NULL,
  title text NOT NULL,
  details text NOT NULL DEFAULT '',
  actor text,
  actor_email text,
  actor_role text,
  ip_address text,
  browser text,
  device_type text
);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_activity_logs" ON activity_logs;
CREATE POLICY "anon_select_activity_logs" ON activity_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_activity_logs" ON activity_logs;
CREATE POLICY "anon_insert_activity_logs" ON activity_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_activity_logs" ON activity_logs;
CREATE POLICY "anon_update_activity_logs" ON activity_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_activity_logs" ON activity_logs;
CREATE POLICY "anon_delete_activity_logs" ON activity_logs FOR DELETE TO anon, authenticated USING (true);

-- Indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_floors_building_id ON floors(building_id);
CREATE INDEX IF NOT EXISTS idx_rooms_building_id ON rooms(building_id);
CREATE INDEX IF NOT EXISTS idx_rooms_floor_id ON rooms(floor_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type_id ON rooms(room_type_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status_id ON rooms(status_id);
CREATE INDEX IF NOT EXISTS idx_beds_room_id ON beds(room_id);
CREATE INDEX IF NOT EXISTS idx_beds_status_id ON beds(status_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_building_id ON maintenance_requests(building_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_room_id ON maintenance_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_food_waste_logs_date ON food_waste_logs(date);
CREATE INDEX IF NOT EXISTS idx_transfer_records_status ON transfer_records(status);
CREATE INDEX IF NOT EXISTS idx_transfer_records_psa_no ON transfer_records(psa_no);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
