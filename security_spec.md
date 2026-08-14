# Security Specification & Test Runner Strategy

## Data Invariants
1. All database operations require authenticated access or read access for authorized users.
2. Buildings, floors, room types, statuses, rooms, beds, logs, users, and maintenance requests are top-level collections managed by housing administrators and staff.
3. System logs and activity history cannot be edited or erased by tenants or non-admin staff once created.
4. User profiles and maintenance tickets validate string constraints and document IDs.

## Dirty Dozen Security Payloads
1. Injecting shadow keys on Building creation (`isSuperAdmin: true`)
2. Updating room status without valid status ID
3. Overwriting activity logs with unauthorized actor details
4. Modifying immutable user fields
5. Creating maintenance request with 50KB description string exceeding max length
6. Unauthenticated write attempt to beds collection
7. Tenant attempting to delete another tenant's profile
8. Modifying building code to invalid symbol characters
9. Modifying bed assignment without required member fields
10. Impersonating Admin role in user profile creation
11. Spoofing requesterId on maintenance ticket create
12. Attempting list query on user profile with malicious ID parameter

## Test Runner Definition
Rules use version 2 with default-deny baseline for unhandled paths and explicit collection rules.
