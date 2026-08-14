import React from 'react';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  AlertTriangle,
  UtensilsCrossed,
  ShieldCheck,
  PlaneTakeoff,
  PlaneLanding,
  ArrowRight,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { data, setActiveTab } = useProperty();
  const { canAccessModule, canEditModule } = useAuth();

  const totalBeds = data.beds.length;
  const occupiedBeds = data.beds.filter((b) => b.assignedTo != null).length;

  const maintenanceBeds = data.beds.filter((b) => {
    const s = data.statuses.find((st) => st.id === b.statusId);
    return s?.isMaintenanceState === true;
  }).length;

  const reservedBeds = data.beds.filter((b) => {
    const s = data.statuses.find((st) => st.id === b.statusId);
    return s?.name.toLowerCase() === 'reserved';
  }).length;

  const availableBeds = totalBeds - occupiedBeds - maintenanceBeds;

  const occupancyPercentage = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
  const occupancyFormatted = occupancyPercentage.toFixed(1);

  // Food Waste Stats
  const foodWasteLogs = data.foodWasteLogs || [];
  const totalWasteKg = foodWasteLogs.reduce((sum, item) => sum + (item.weightKg || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayWasteKg = foodWasteLogs
    .filter((l) => l.date === todayStr)
    .reduce((sum, item) => sum + (item.weightKg || 0), 0);

  // Transfer Schedule Stats
  const transferRecords = data.transferRecords || [];
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayDateStr = `${year}-${month}-${day}`;

  const tom = new Date(now);
  tom.setDate(tom.getDate() + 1);
  const tomYear = tom.getFullYear();
  const tomMonth = String(tom.getMonth() + 1).padStart(2, '0');
  const tomDay = String(tom.getDate()).padStart(2, '0');
  const tomorrowDateStr = `${tomYear}-${tomMonth}-${tomDay}`;

  const todaysArrivals = transferRecords.filter((r) => r.status !== 'Cancelled' && r.arrivalDate === todayDateStr).length;
  const todaysDepartures = transferRecords.filter((r) => r.status !== 'Cancelled' && r.departureDate === todayDateStr).length;
  const tomorrowsArrivals = transferRecords.filter((r) => r.status !== 'Cancelled' && r.arrivalDate === tomorrowDateStr).length;
  const tomorrowsDepartures = transferRecords.filter((r) => r.status !== 'Cancelled' && r.departureDate === tomorrowDateStr).length;

  // Helper to order categories as requested:
  // SINGLE, TWIN SHARE, FOUR SHARE, FIVE SHARE, SIX SHARE, EIGHT SHARE, TEN SHARE, TWELVE SHARE
  const getCategoryRank = (name: string, bedCount: number): number => {
    const upper = name.toUpperCase().trim();
    if (upper.includes('SINGLE')) return 1;
    if (upper.includes('TWIN') || upper.includes('DOUBLE')) return 2;
    if (upper.includes('FOUR') || upper.includes('4-BED') || upper.includes('4 SHARE') || upper.includes('4BED') || upper.includes('QUAD')) return 3;
    if (upper.includes('FIVE') || upper.includes('5-BED') || upper.includes('5 SHARE') || upper.includes('5BED')) return 4;
    if (upper.includes('SIX') || upper.includes('6-BED') || upper.includes('6 SHARE') || upper.includes('6BED')) return 5;
    if (upper.includes('EIGHT') || upper.includes('8-BED') || upper.includes('8 SHARE') || upper.includes('8BED')) return 6;
    if (upper.includes('TEN') || upper.includes('10-BED') || upper.includes('10 SHARE') || upper.includes('10BED')) return 7;
    if (upper.includes('TWELVE') || upper.includes('12-BED') || upper.includes('12 SHARE') || upper.includes('12BED')) return 8;

    if (bedCount === 1) return 1;
    if (bedCount === 2) return 2;
    if (bedCount === 4) return 3;
    if (bedCount === 5) return 4;
    if (bedCount === 6) return 5;
    if (bedCount === 8) return 6;
    if (bedCount === 10) return 7;
    if (bedCount === 12) return 8;

    return 100 + bedCount;
  };

  // Breakdown by Room Category
  const categoryBreakdown = data.roomTypes.map((type) => {
    const roomsOfType = data.rooms.filter((r) => r.roomTypeId === type.id);
    const roomIds = roomsOfType.map((r) => r.id);
    const bedsOfType = data.beds.filter((b) => roomIds.includes(b.roomId));
    const occupied = bedsOfType.filter((b) => b.assignedTo != null).length;
    const total = bedsOfType.length;
    const available = total - occupied;
    const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return {
      type,
      totalRooms: roomsOfType.length,
      totalBeds: total,
      occupiedBeds: occupied,
      availableBeds: available,
      percentage: pct,
    };
  });

  categoryBreakdown.sort((a, b) => {
    const rankA = getCategoryRank(a.type.name, a.type.defaultBedCount);
    const rankB = getCategoryRank(b.type.name, b.type.defaultBedCount);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return a.type.name.localeCompare(b.type.name);
  });

  // Maintenance Alerts
  const maintenanceRooms = data.rooms.filter((r) => {
    const s = data.statuses.find((st) => st.id === r.statusId);
    return s?.isMaintenanceState === true || r.statusId === 'status-maintenance';
  });

  const maintenanceBedList = data.beds.filter((b) => {
    const s = data.statuses.find((st) => st.id === b.statusId);
    return s?.isMaintenanceState === true || b.statusId === 'status-maintenance';
  });

  return (
    <div className="p-0 sm:p-2 lg:p-6 space-y-6 sm:space-y-8 font-sans">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Occupancy Rate */}
        <div className="bg-white border border-[#E5E5E1] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
              Occupancy Rate
            </div>
            <div className="text-4xl font-bold leading-none text-[#1A1A1A]">
              {occupancyFormatted}<span className="text-lg ml-1 font-sans">%</span>
            </div>
          </div>
          <div className="mt-6">
            <div className="h-1 w-full bg-[#F0F0EE]">
              <div
                className="h-full bg-[#1A1A1A] transition-all duration-500"
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
            <div className="text-[10px] mt-2 text-[#666662] uppercase tracking-wider font-semibold">
              {occupiedBeds} occupied / {totalBeds} total beds
            </div>
          </div>
        </div>

        {/* Metric 2: Available Beds */}
        <div className="bg-white border border-[#E5E5E1] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
              Available Capacity
            </div>
            <div className="text-4xl font-bold leading-none text-[#1A1A1A]">
              {availableBeds}
            </div>
          </div>
          <div className="text-[10px] mt-4 text-[#666662] uppercase tracking-wider font-semibold">
            {reservedBeds > 0 ? `${reservedBeds} beds reserved` : 'Across active floors'}
          </div>
        </div>

        {/* Metric 3: Active Buildings */}
        <div className="bg-white border border-[#E5E5E1] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
              Active Properties
            </div>
            <div className="text-4xl font-bold leading-none text-[#1A1A1A]">
              0{data.buildings.length}
            </div>
          </div>
          <div className="text-[10px] mt-4 text-[#666662] uppercase tracking-wider font-semibold">
            {data.floors.length} Floors • {data.rooms.length} Rooms
          </div>
        </div>

        {/* Metric 4: Maintenance */}
        <div className="bg-[#F0F0EE] border border-[#E5E5E1] p-6 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
              Maintenance Alerts
            </div>
            <div className="text-4xl font-bold leading-none text-[#1A1A1A]">
              0{maintenanceBedList.length}
            </div>
          </div>
          <div className="text-[10px] mt-4 text-[#9E2A2B] font-bold uppercase tracking-wider">
            {maintenanceRooms.length} Active Flagged Rooms
          </div>
        </div>
      </div>

      {/* Arrival & Departure Schedule (4 Boxes) */}
      <div className="bg-white border border-[#E5E5E1] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
              Transfer Schedule
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-2">
              <PlaneTakeoff className="w-4 h-4 text-[#1A1A1A]" />
              <span>Arrivals & Departures</span>
            </h3>
          </div>
          {canAccessModule('transferTracker') && (
            <button
              onClick={() => setActiveTab('transferTracker')}
              className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] hover:underline flex items-center gap-1"
            >
              <span>View Transfer Tracker</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Box 1: Today's Arrival */}
          <div
            onClick={() => canAccessModule('transferTracker') && setActiveTab('transferTracker')}
            className="p-4 border border-[#E5E5E1] bg-[#F9F9F8] hover:bg-white hover:border-[#1A1A1A] transition-all cursor-pointer rounded-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1E5D38] bg-[#EBF5EE] px-2 py-0.5 border border-[#C5E3CE]">
                Today
              </span>
              <PlaneLanding className="w-4 h-4 text-[#1E5D38]" />
            </div>
            <div className="text-3xl font-bold text-[#1A1A1A]">{todaysArrivals}</div>
            <div className="text-xs font-bold text-[#1A1A1A] mt-1">Today's Arrival</div>
            <div className="text-[10px] text-[#666662] mt-0.5">Team members arriving today</div>
          </div>

          {/* Box 2: Today's Departure */}
          <div
            onClick={() => canAccessModule('transferTracker') && setActiveTab('transferTracker')}
            className="p-4 border border-[#E5E5E1] bg-[#F9F9F8] hover:bg-white hover:border-[#1A1A1A] transition-all cursor-pointer rounded-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9E2A2B] bg-[#FDF2F0] px-2 py-0.5 border border-[#F5C6C2]">
                Today
              </span>
              <PlaneTakeoff className="w-4 h-4 text-[#9E2A2B]" />
            </div>
            <div className="text-3xl font-bold text-[#1A1A1A]">{todaysDepartures}</div>
            <div className="text-xs font-bold text-[#1A1A1A] mt-1">Today's Departure</div>
            <div className="text-[10px] text-[#666662] mt-0.5">Team members departing today</div>
          </div>

          {/* Box 3: Tomorrow's Arrival */}
          <div
            onClick={() => canAccessModule('transferTracker') && setActiveTab('transferTracker')}
            className="p-4 border border-[#E5E5E1] bg-[#F9F9F8] hover:bg-white hover:border-[#1A1A1A] transition-all cursor-pointer rounded-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 border border-[#BFDBFE]">
                Tomorrow
              </span>
              <PlaneLanding className="w-4 h-4 text-[#1D4ED8]" />
            </div>
            <div className="text-3xl font-bold text-[#1A1A1A]">{tomorrowsArrivals}</div>
            <div className="text-xs font-bold text-[#1A1A1A] mt-1">Tomorrow's Arrival</div>
            <div className="text-[10px] text-[#666662] mt-0.5">Scheduled arrivals for tomorrow</div>
          </div>

          {/* Box 4: Tomorrow's Departure */}
          <div
            onClick={() => canAccessModule('transferTracker') && setActiveTab('transferTracker')}
            className="p-4 border border-[#E5E5E1] bg-[#F9F9F8] hover:bg-white hover:border-[#1A1A1A] transition-all cursor-pointer rounded-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B21A8] bg-[#FAF5FF] px-2 py-0.5 border border-[#E9D5FF]">
                Tomorrow
              </span>
              <PlaneTakeoff className="w-4 h-4 text-[#6B21A8]" />
            </div>
            <div className="text-3xl font-bold text-[#1A1A1A]">{tomorrowsDepartures}</div>
            <div className="text-xs font-bold text-[#1A1A1A] mt-1">Tomorrow's Departure</div>
            <div className="text-[10px] text-[#666662] mt-0.5">Scheduled departures for tomorrow</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Category Availability + Maintenance & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Category Breakdown & Building Summaries */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-[#E5E5E1] p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1] mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                  Capacity by Room Category
                </h3>
                <p className="text-[11px] text-[#666662] mt-0.5">
                  Occupancy distribution across configured room classifications
                </p>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] bg-[#F0F0EE] px-2 py-0.5 border border-[#E5E5E1]">
                {categoryBreakdown.length} Categories
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categoryBreakdown.map((item) => (
                <div
                  key={item.type.id}
                  className="p-2.5 bg-[#F9F9F8] border border-[#E5E5E1] hover:bg-white hover:border-[#1A1A1A] transition-colors rounded-xs flex flex-col justify-between space-y-2"
                >
                  <div>
                    {/* Top Header Row */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.type.badgeColor || '#1A1A1A' }}
                        />
                        <span className="font-bold text-xs sm:text-sm text-[#1A1A1A] truncate">
                          {item.type.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E5D38] bg-[#EBF5EE] px-1.5 py-0.5 border border-[#C5E3CE] shrink-0">
                        {item.availableBeds} Avail
                      </span>
                    </div>

                    {/* Meta Specs & Counts Row */}
                    <div className="flex items-center justify-between text-[11px] text-[#666662] font-medium gap-1">
                      <span className="text-[10px] font-semibold text-[#666662] bg-white px-1.5 py-0.5 border border-[#E5E5E1] rounded-2xs font-mono">
                        {item.totalRooms} Rms ({item.type.defaultBedCount} b/rm)
                      </span>
                      <span className="font-bold text-[#1A1A1A] text-[11px]">
                        {item.occupiedBeds}/{item.totalBeds} Occupied ({item.percentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#E5E5E1] h-1.5 overflow-hidden rounded-none">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.type.badgeColor || '#1A1A1A',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Building Overview Cards */}
          <div className="bg-white border border-[#E5E5E1] p-6 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A] pb-3 border-b border-[#E5E5E1] mb-4">
              Building Performance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.buildings.map((b) => {
                const bRooms = data.rooms.filter((r) => r.buildingId === b.id);
                const rIds = bRooms.map((r) => r.id);
                const bBeds = data.beds.filter((bd) => rIds.includes(bd.roomId));
                const bOcc = bBeds.filter((bd) => bd.assignedTo != null).length;
                const bTotal = bBeds.length;
                const bPct = bTotal > 0 ? Math.round((bOcc / bTotal) * 100) : 0;

                return (
                  <div key={b.id} className="p-4 border border-[#E5E5E1] bg-[#F9F9F8]">
                    <div className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1">
                      {b.code}
                    </div>
                    <div className="font-bold text-[#1A1A1A] text-lg">{b.name}</div>
                    <div className="text-xs text-[#666662] mt-1">
                      {bRooms.length} Rooms • {bTotal} Beds
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-bold">
                      <span className="text-[#666662] uppercase tracking-wider text-[10px]">Occupancy</span>
                      <span className="text-[#1A1A1A]">{bPct}%</span>
                    </div>
                    <div className="w-full bg-[#E5E5E1] h-1 mt-1">
                      <div
                        className="bg-[#1A1A1A] h-full"
                        style={{ width: `${bPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Maintenance Panel & Activity Log */}
        <div className="space-y-8">
          {/* Maintenance Panel */}
          <div className="bg-white border border-[#E5E5E1] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1] mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#9E2A2B]" />
                <span>Maintenance</span>
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FDF2F0] text-[#9E2A2B] border border-[#F5C6C2]">
                {maintenanceBedList.length} Beds
              </span>
            </div>

            {maintenanceBedList.length === 0 ? (
              <div className="py-8 text-center bg-[#F9F9F8] border border-dashed border-[#E5E5E1]">
                <ShieldCheck className="w-8 h-8 text-[#1E5D38] mx-auto mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">Operational Integrity</p>
                <p className="text-[11px] text-[#A3A39F] mt-1">No pending maintenance tickets.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {maintenanceBedList.map((bed) => {
                  const room = data.rooms.find((r) => r.id === bed.roomId);
                  const bldg = data.buildings.find((b) => b.id === room?.buildingId);

                  return (
                    <div
                      key={bed.id}
                      className="p-3 bg-[#FDF2F0] border border-[#F5C6C2] flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#9E2A2B]">
                          {bldg?.code || 'BLDG'} • Room #{room?.roomNumber || 'N/A'} - {bed.label}
                        </div>
                        <div className="text-[11px] text-[#666662] mt-1">
                          {bed.notes || room?.notes || 'Flagged for service/repairs'}
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('assignments')}
                        className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] hover:underline shrink-0"
                      >
                        Inspect
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Food Waste Stats */}
          <div className="bg-white border border-[#E5E5E1] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1] mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A] flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-[#1A1A1A]" />
                <span>Food Waste Overview</span>
              </h3>
              {canAccessModule('foodWaste') && (
                <button
                  onClick={() => setActiveTab('foodWaste')}
                  className="text-[10px] uppercase font-bold tracking-widest text-[#1A1A1A] hover:underline"
                >
                  View Tracker
                </button>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-[#F9F9F8] border border-[#E5E5E1]">
                <div className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-wider">
                  Total Waste
                </div>
                <div className="text-xl font-bold text-[#1A1A1A] mt-0.5">
                  {totalWasteKg.toFixed(1)} <span className="text-xs font-normal text-[#666662]">Kg</span>
                </div>
              </div>
              <div className="p-3 bg-[#F9F9F8] border border-[#E5E5E1]">
                <div className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-wider">
                  Today's Waste
                </div>
                <div className="text-xl font-bold text-[#1A1A1A] mt-0.5">
                  {todayWasteKg.toFixed(1)} <span className="text-xs font-normal text-[#666662]">Kg</span>
                </div>
              </div>
            </div>

            {/* Recent Logs List */}
            <div className="space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#A3A39F]">
                Recent Waste Entries ({foodWasteLogs.length})
              </div>
              {foodWasteLogs.length === 0 ? (
                <div className="p-4 text-center bg-[#F9F9F8] border border-dashed border-[#E5E5E1] text-xs text-[#A3A39F]">
                  No food waste logged yet.
                </div>
              ) : (
                foodWasteLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="pb-3 border-b border-[#F0F0EE] last:border-0 last:pb-0 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#F0F0EE] text-[#1A1A1A] border border-[#E5E5E1] rounded-xs">
                        {log.mealService}
                      </span>
                      <span className="font-bold text-[#1A1A1A] font-mono">
                        {log.weightKg} Kg
                      </span>
                    </div>
                    <div className="font-bold text-[#1A1A1A] flex items-center justify-between">
                      <span>{log.diningHallLocation || 'Bite'}</span>
                      <span className="text-[10px] font-normal text-[#A3A39F]">{log.date}</span>
                    </div>
                    {log.wasteReason && (
                      <div className="text-[#666662] text-[11px] mt-0.5">
                        <span className="font-semibold text-[#1A1A1A]">Reason:</span> {log.wasteReason}
                      </div>
                    )}
                    <div className="text-[10px] text-[#A3A39F] mt-1">
                      Logged by {log.loggedBy}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
