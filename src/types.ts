export interface Building {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
}

export interface Floor {
  id: string;
  buildingId: string;
  number: number;
  label: string;
  description?: string;
}

export interface RoomType {
  id: string;
  name: string;
  defaultBedCount: number;
  description?: string;
  badgeColor: string; // e.g., 'blue', 'emerald', 'purple', 'amber', 'rose', 'indigo'
}

export interface StatusCategory {
  id: string;
  name: string;
  type: 'room' | 'bed' | 'both';
  color: string; // Hex color or Tailwind color token, e.g., '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
  description?: string;
  isOccupiedState?: boolean;
  isMaintenanceState?: boolean;
}

export interface BedAssignment {
  memberId: string;
  memberName: string;
  employeeId: string;
  department: string;
  position?: string;
  email?: string;
  phone?: string;
  checkInDate: string;
  expectedCheckOutDate?: string;
  notes?: string;
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: number; // e.g. 1, 2, 3
  label: string; // e.g., "Bed A", "Bed B", "Top Bunk"
  statusId: string; // ID from StatusCategory
  assignedTo?: BedAssignment | null;
  notes?: string;
}

export interface Room {
  id: string;
  buildingId: string;
  floorId: string;
  roomNumber: string; // e.g., "101", "A-204"
  roomTypeId: string;
  totalBeds: number;
  statusId: string; // ID from StatusCategory
  notes?: string;
  lastCleaned?: string;
  updatedAt: string;
}

export type MealServiceType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Night Snack / Other';

export type WasteReason = string;

export interface FoodWasteLog {
  id: string;
  date: string; // YYYY-MM-DD
  mealService: MealServiceType;
  weightKg: number; // Weight strictly in Kilograms (Kg)
  diningHallLocation: string;
  preparedServings?: number;
  unconsumedServings?: number;
  wasteReason: WasteReason;
  shiftNotes?: string;
  loggedBy: string;
  loggedByUserId?: string;
  loggedByRole?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransferStatus = 'Pending' | 'Completed' | 'Cancelled';
export type TransferLegType = 'Outbound' | 'Inbound' | 'One-Way';

export interface TransferAuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  details?: string;
}

export interface TransferRecord {
  id: string;
  psaNo: string; // PSA No*
  fullName: string; // Full Name*
  employeeId: string; // Team Member ID*
  position: string; // Position*
  department?: string; // Department
  transport?: string; // Transport (SEAPLANE / DOMESTIC / SPEED BOAT)
  nidWpNo: string; // NID/WP No*
  requestId?: string; // System-generated tracking ID e.g. VFAR-104829-2026
  linkedRequestId?: string; // Linked system-generated request ID for round trips
  leaveType?: string; // Leave Type (DO / AL / BT / R&R)
  legType?: TransferLegType; // Leg Type: Outbound (Resort -> Airport) or Inbound (Airport -> Resort) or One-Way
  tripGroupId?: string; // Unique group ID connecting linked Outbound and Inbound legs
  linkedTransferId?: string; // ID of the linked transfer leg
  linkedPsaNo?: string; // PSA No of the linked transfer leg
  arrivalDate?: string; // Arrival Date (YYYY-MM-DD)
  departureDate?: string; // Departure Date (YYYY-MM-DD)
  arrivalFlight?: string; // Arrival From Int. TKT & Time
  departureFlight?: string; // Departure from Int. TKT & Time
  flightDetails?: string; // Flight Details
  preferredFlightTiming?: string; // Preferred Flight Timing (ANY / MORNING FLIGHT / AFTERNOON FLIGHT / LAST FLIGHT)
  checkInTime?: string; // Check-in - Time
  checkInClose?: string; // Check-in Close
  departureTime?: string; // Departure Time
  rate: string | number; // Rate*
  notes?: string; // Note
  status: TransferStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastModifiedBy?: string;
  auditLogs?: TransferAuditLogEntry[];
}

export type UserRole = 'Admin' | 'Property Manager' | 'Staff' | 'Tenant' | 'View Only (Dashboard & Reports)';

export type ModuleAccessLevel = 'full' | 'view' | 'none';

export interface ModulePermissions {
  dashboard: ModuleAccessLevel;
  availability: ModuleAccessLevel;
  foodWaste: ModuleAccessLevel;
  inventory: ModuleAccessLevel;
  assignments: ModuleAccessLevel;
  transferTracker: ModuleAccessLevel;
  maintenance: ModuleAccessLevel;
  reports: ModuleAccessLevel;
  users: ModuleAccessLevel;
  settings: ModuleAccessLevel;
}

export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  employeeId?: string;
  department?: string;
  assignedBuildingIds?: string[]; // for Property Manager
  assignedBedId?: string; // for Tenant
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
  modulePermissions?: Partial<ModulePermissions>;
}

export type MaintenanceCategory =
  | 'Plumbing'
  | 'Electrical'
  | 'HVAC'
  | 'Appliance'
  | 'Furniture'
  | 'Structural'
  | 'Cleaning'
  | 'General';

export type MaintenanceUrgency = 'Low' | 'Medium' | 'High' | 'Urgent';

export type MaintenanceStatus = 'New' | 'In Progress' | 'Pending Parts' | 'Completed' | 'Cancelled';

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  urgency: MaintenanceUrgency;
  status: MaintenanceStatus;
  buildingId: string;
  floorId: string;
  roomId: string;
  bedId?: string;
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  contactPhone?: string;
  assignedTechnician?: string;
  assignedTechnicianPhone?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  resolutionNotes?: string;
  updateRoomBedStatusOnComplete?: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action:
    | 'ASSIGN'
    | 'CHECKOUT'
    | 'ROOM_CREATE'
    | 'ROOM_UPDATE'
    | 'STATUS_CHANGE'
    | 'SETTING_CHANGE'
    | 'MAINTENANCE_CREATE'
    | 'MAINTENANCE_UPDATE'
    | 'FOOD_WASTE_CREATE'
    | 'FOOD_WASTE_UPDATE'
    | 'FOOD_WASTE_DELETE'
    | 'TRANSFER_CREATE'
    | 'TRANSFER_UPDATE'
    | 'TRANSFER_DELETE'
    | 'USER_CHANGE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'ROLE_SWITCH';
  title: string;
  details: string;
  actor?: string;
  actorEmail?: string;
  actorRole?: string;
  ipAddress?: string;
  browser?: string;
  deviceType?: string;
}

export interface PropertyData {
  buildings: Building[];
  floors: Floor[];
  roomTypes: RoomType[];
  statuses: StatusCategory[];
  rooms: Room[];
  beds: Bed[];
  logs: ActivityLog[];
  users: UserProfile[];
  maintenanceRequests: MaintenanceRequest[];
  foodWasteLogs: FoodWasteLog[];
  transferRecords: TransferRecord[];
}

export type ActiveTab =
  | 'dashboard'
  | 'availability'
  | 'assignments'
  | 'transferTracker'
  | 'foodWaste'
  | 'inventory'
  | 'maintenance'
  | 'reports'
  | 'users'
  | 'settings';

