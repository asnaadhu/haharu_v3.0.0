import React, { useState, useMemo } from 'react';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { Bed, Room, RoomType } from '../types';
import { AssignMemberModal } from './modals/AssignMemberModal';
import {
  Building2,
  Calendar,
  Filter,
  Search,
  BedDouble,
  CheckCircle2,
  XCircle,
  Wrench,
  Clock,
  FileDown,
  Printer,
  ChevronRight,
  UserPlus,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const PropertyAvailabilityView: React.FC = () => {
  const { data } = useProperty();
  const { canEditModule } = useAuth();

  // Helper date string (YYYY-MM-DD)
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getFutureDateStr = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  // State
  const [fromDate, setFromDate] = useState<string>(getTodayStr());
  const [toDate, setToDate] = useState<string>(getFutureDateStr(14));
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 'all', 'vacant', 'occupied', 'maintenance'
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Assign Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [bedToAssign, setBedToAssign] = useState<Bed | null>(null);

  // Quick Preset Handlers
  const applyPreset = (preset: 'today' | '7days' | '14days' | '30days' | 'month') => {
    const today = new Date();
    const todayStr = getTodayStr();

    if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === '7days') {
      setFromDate(todayStr);
      setToDate(getFutureDateStr(7));
    } else if (preset === '14days') {
      setFromDate(todayStr);
      setToDate(getFutureDateStr(14));
    } else if (preset === '30days') {
      setFromDate(todayStr);
      setToDate(getFutureDateStr(30));
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(lastDay);
    }
  };

  // Building Lookup
  const buildingMap = useMemo(() => {
    const map = new Map<string, string>();
    (data.buildings || []).forEach((b) => map.set(b.id, b.name));
    return map;
  }, [data.buildings]);

  // Floor Lookup
  const floorMap = useMemo(() => {
    const map = new Map<string, string>();
    (data.floors || []).forEach((f) => map.set(f.id, f.label));
    return map;
  }, [data.floors]);

  // Room Type Lookup
  const roomTypeMap = useMemo(() => {
    const map = new Map<string, RoomType>();
    (data.roomTypes || []).forEach((rt) => map.set(rt.id, rt));
    return map;
  }, [data.roomTypes]);

  // Room Lookup
  const roomMap = useMemo(() => {
    const map = new Map<string, Room>();
    (data.rooms || []).forEach((r) => map.set(r.id, r));
    return map;
  }, [data.rooms]);

  // Status Category Lookup
  const statusMap = useMemo(() => {
    const map = new Map<string, { name: string; isOccupied?: boolean; isMaintenance?: boolean }>();
    (data.statuses || []).forEach((s) =>
      map.set(s.id, { name: s.name, isOccupied: s.isOccupiedState, isMaintenance: s.isMaintenanceState })
    );
    return map;
  }, [data.statuses]);

  // Filtered Rooms List
  const filteredRooms = useMemo(() => {
    return (data.rooms || []).filter((r) => {
      if (selectedBuildingId !== 'all' && r.buildingId !== selectedBuildingId) return false;
      if (selectedRoomTypeId !== 'all' && r.roomTypeId !== selectedRoomTypeId) return false;
      return true;
    });
  }, [data.rooms, selectedBuildingId, selectedRoomTypeId]);

  const filteredRoomIds = useMemo(() => new Set(filteredRooms.map((r) => r.id)), [filteredRooms]);

  // Master Bed Records with Augmented Availability & Date Window Calculation
  const masterBedRecords = useMemo(() => {
    const fromTs = fromDate ? new Date(fromDate).getTime() : 0;
    const toTs = toDate ? new Date(toDate).getTime() + 86400000 : Infinity;

    return (data.beds || [])
      .filter((b) => filteredRoomIds.has(b.roomId))
      .map((bed) => {
        const room = roomMap.get(bed.roomId);
        const roomType = room ? roomTypeMap.get(room.roomTypeId) : undefined;
        const bldName = room ? buildingMap.get(room.buildingId) || 'Unknown Building' : 'Unknown Building';
        const flrLabel = room ? floorMap.get(room.floorId) || 'Floor' : 'Floor';
        const statusObj = statusMap.get(bed.statusId);

        const isOccupied = bed.assignedTo != null;
        const isMaintenance = statusObj?.isMaintenance || false;
        const isVacant = !isOccupied && !isMaintenance;

        // Check expected checkout in date range
        let expectedCheckout = bed.assignedTo?.expectedCheckOutDate || null;
        let freesUpInRange = false;
        if (expectedCheckout) {
          const checkoutTs = new Date(expectedCheckout).getTime();
          if (checkoutTs >= fromTs && checkoutTs <= toTs) {
            freesUpInRange = true;
          }
        }

        return {
          bed,
          room,
          roomType,
          buildingName: bldName,
          floorLabel: flrLabel,
          isOccupied,
          isMaintenance,
          isVacant,
          freesUpInRange,
          expectedCheckout,
        };
      })
      .filter((item) => {
        // Status Filter
        if (selectedStatus === 'vacant' && (!item.isVacant && !item.freesUpInRange)) return false;
        if (selectedStatus === 'occupied' && !item.isOccupied) return false;
        if (selectedStatus === 'maintenance' && !item.isMaintenance) return false;

        // Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchRoom = item.room?.roomNumber.toLowerCase().includes(q);
          const matchBed = item.bed.label.toLowerCase().includes(q);
          const matchCategory = item.roomType?.name.toLowerCase().includes(q);
          const matchBuilding = item.buildingName.toLowerCase().includes(q);
          const matchOccupant = item.bed.assignedTo?.memberName?.toLowerCase().includes(q);
          const matchEmpId = item.bed.assignedTo?.employeeId?.toLowerCase().includes(q);
          const matchDept = item.bed.assignedTo?.department?.toLowerCase().includes(q);
          const matchPos = item.bed.assignedTo?.position?.toLowerCase().includes(q);

          if (!matchRoom && !matchBed && !matchCategory && !matchBuilding && !matchOccupant && !matchEmpId && !matchDept && !matchPos) {
            return false;
          }
        }

        return true;
      });
  }, [data.beds, filteredRoomIds, roomMap, roomTypeMap, buildingMap, floorMap, statusMap, fromDate, toDate, selectedStatus, searchQuery]);

  // Overall Statistics Metrics
  const summaryMetrics = useMemo(() => {
    const totalBeds = masterBedRecords.length;
    const vacantBeds = masterBedRecords.filter((b) => b.isVacant).length;
    const occupiedBeds = masterBedRecords.filter((b) => b.isOccupied).length;
    const maintenanceBeds = masterBedRecords.filter((b) => b.isMaintenance).length;
    const freesUpCount = masterBedRecords.filter((b) => b.freesUpInRange).length;

    const totalRoomsCount = new Set(masterBedRecords.map((b) => b.room?.id)).size;

    const vacantRate = totalBeds > 0 ? Math.round((vacantBeds / totalBeds) * 100) : 0;
    const occupiedRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      totalBeds,
      totalRoomsCount,
      vacantBeds,
      occupiedBeds,
      maintenanceBeds,
      freesUpCount,
      vacantRate,
      occupiedRate,
    };
  }, [masterBedRecords]);

  // Category Breakdown Metrics
  const categoryBreakdown = useMemo(() => {
    const categoryMap = new Map<
      string,
      {
        roomType: RoomType;
        totalRooms: Set<string>;
        totalBeds: number;
        vacantBeds: number;
        occupiedBeds: number;
        maintenanceBeds: number;
        freesUpCount: number;
      }
    >();

    // Initialize all room types
    (data.roomTypes || []).forEach((rt) => {
      if (selectedRoomTypeId === 'all' || selectedRoomTypeId === rt.id) {
        categoryMap.set(rt.id, {
          roomType: rt,
          totalRooms: new Set(),
          totalBeds: 0,
          vacantBeds: 0,
          occupiedBeds: 0,
          maintenanceBeds: 0,
          freesUpCount: 0,
        });
      }
    });

    masterBedRecords.forEach((record) => {
      const rtId = record.roomType?.id;
      if (rtId && categoryMap.has(rtId)) {
        const cat = categoryMap.get(rtId)!;
        if (record.room?.id) cat.totalRooms.add(record.room.id);
        cat.totalBeds += 1;
        if (record.isVacant) cat.vacantBeds += 1;
        if (record.isOccupied) cat.occupiedBeds += 1;
        if (record.isMaintenance) cat.maintenanceBeds += 1;
        if (record.freesUpInRange) cat.freesUpCount += 1;
      }
    });

    return Array.from(categoryMap.values()).map((c) => {
      const availPct = c.totalBeds > 0 ? Math.round((c.vacantBeds / c.totalBeds) * 100) : 0;
      const occPct = c.totalBeds > 0 ? Math.round((c.occupiedBeds / c.totalBeds) * 100) : 0;
      return {
        ...c,
        roomsCount: c.totalRooms.size,
        availPct,
        occPct,
      };
    });
  }, [data.roomTypes, selectedRoomTypeId, masterBedRecords]);

  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Room Number',
      'Building',
      'Floor',
      'Room Category',
      'Bed Label',
      'Current Status',
      'Occupant Name',
      'Employee ID',
      'Department',
      'Check-in Date',
      'Expected Check-out Date',
      'Availability Status (Date Window)',
    ];

    const rows = masterBedRecords.map((r) => {
      let availStatus = 'Vacant / Available';
      if (r.isMaintenance) availStatus = 'Under Maintenance';
      else if (r.freesUpInRange) availStatus = `Frees Up on ${r.expectedCheckout}`;
      else if (r.isOccupied) availStatus = 'Occupied (Beyond Window)';

      return [
        r.room?.roomNumber || 'N/A',
        r.buildingName,
        r.floorLabel,
        r.roomType?.name || 'General',
        r.bed.label,
        r.isOccupied ? 'Occupied' : r.isMaintenance ? 'Maintenance' : 'Vacant',
        r.bed.assignedTo?.memberName || '-',
        r.bed.assignedTo?.employeeId || '-',
        r.bed.assignedTo?.department || '-',
        r.bed.assignedTo?.checkInDate || '-',
        r.bed.assignedTo?.expectedCheckOutDate || '-',
        availStatus,
      ];
    });

    const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map((cell) => escapeCsv(String(cell))).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Property_Availability_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    const title = `PROPERTY AVAILABILITY REPORT (${fromDate} to ${toDate})`;

    doc.setFontSize(14);
    doc.text(title, 14, 15);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      `Total Beds: ${summaryMetrics.totalBeds} | Vacant: ${summaryMetrics.vacantBeds} (${summaryMetrics.vacantRate}%) | Occupied: ${summaryMetrics.occupiedBeds} (${summaryMetrics.occupiedRate}%) | Expected Checkouts: ${summaryMetrics.freesUpCount}`,
      14,
      22
    );

    const head = [
      ['Room', 'Building', 'Category', 'Bed', 'Status', 'Occupant Name', 'Dept', 'Check-in', 'Expected Checkout', 'Window Availability'],
    ];

    const body = masterBedRecords.map((r) => {
      let availStatus = 'Vacant & Available';
      if (r.isMaintenance) availStatus = 'Under Maintenance';
      else if (r.freesUpInRange) availStatus = `Frees Up (${r.expectedCheckout})`;
      else if (r.isOccupied) availStatus = 'Occupied';

      return [
        r.room?.roomNumber || '-',
        r.buildingName,
        r.roomType?.name || 'General',
        r.bed.label,
        r.isOccupied ? 'Occupied' : r.isMaintenance ? 'Maintenance' : 'Vacant',
        r.bed.assignedTo?.memberName || '-',
        r.bed.assignedTo?.department || '-',
        r.bed.assignedTo?.checkInDate || '-',
        r.bed.assignedTo?.expectedCheckOutDate || '-',
        availStatus,
      ];
    });

    autoTable(doc, {
      head,
      body,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [26, 26, 26] },
    });

    doc.save(`Property_Availability_Report_${fromDate}_to_${toDate}.pdf`);
  };

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* 1. VIEW HEADER & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 border border-[#E5E5E1]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#1A1A1A]">Property Availability</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xs">
              Live Forecast
            </span>
          </div>
          <p className="text-xs text-[#666662] mt-1">
            Track room & bed availability by Room Category, date range, and expected departures.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-[#F0F0EE] hover:bg-[#E5E5E1] text-[#1A1A1A] border border-[#E5E5E1] transition-colors"
          >
            <FileDown className="w-4 h-4 text-[#666662]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-[#1A1A1A] hover:bg-[#000000] text-white shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. DATE RANGE & FILTER CONTROLS BAR */}
      <div className="bg-white p-5 border border-[#E5E5E1] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E5E1]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
            <Calendar className="w-4 h-4 text-[#A3A39F]" />
            <span>Date Range & Category Selectors</span>
          </div>

          {/* Quick Date Range Presets */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <span className="text-[10px] uppercase font-bold text-[#A3A39F] mr-1">Presets:</span>
            <button
              onClick={() => applyPreset('today')}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#F0F0EE] hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => applyPreset('7days')}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#F0F0EE] hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              Next 7 Days
            </button>
            <button
              onClick={() => applyPreset('14days')}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#F0F0EE] hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              Next 14 Days
            </button>
            <button
              onClick={() => applyPreset('30days')}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#F0F0EE] hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              Next 30 Days
            </button>
            <button
              onClick={() => applyPreset('month')}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#F0F0EE] hover:bg-[#1A1A1A] hover:text-white transition-colors"
            >
              This Month
            </button>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* From Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A39F] mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E1] font-semibold text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A]"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A39F] mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E1] font-semibold text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A]"
            />
          </div>

          {/* Building Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A39F] mb-1">
              Building / Property
            </label>
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E1] bg-white font-semibold text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A]"
            >
              <option value="all">All Buildings</option>
              {(data.buildings || []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Room Category (Room Type) Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A39F] mb-1">
              Room Category
            </label>
            <select
              value={selectedRoomTypeId}
              onChange={(e) => setSelectedRoomTypeId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E1] bg-white font-semibold text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A]"
            >
              <option value="all">All Room Categories</option>
              {(data.roomTypes || []).map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A39F] mb-1">
              Status Filter
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E5E5E1] bg-white font-semibold text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A]"
            >
              <option value="all">All Statuses</option>
              <option value="vacant">Vacant / Frees Up in Range</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>

        {/* Search Field */}
        <div className="pt-2 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#A3A39F] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Room #, Category, Bed Label, Occupant Name, Department..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#E5E5E1] bg-white font-medium text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A]"
            />
          </div>

          <div className="text-[11px] font-mono font-bold text-[#666662] shrink-0">
            Showing <span className="text-[#1A1A1A]">{masterBedRecords.length}</span> Bed Records
          </div>
        </div>
      </div>

      {/* 3. EXECUTIVE KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Beds */}
        <div className="bg-white p-5 border border-[#E5E5E1] relative overflow-hidden">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F]">Total Beds</div>
          <div className="text-2xl font-bold text-[#1A1A1A] mt-1 font-mono">{summaryMetrics.totalBeds}</div>
          <div className="text-[11px] text-[#666662] mt-1 flex items-center gap-1 font-medium">
            <Building2 className="w-3.5 h-3.5 text-[#A3A39F]" />
            <span>Across {summaryMetrics.totalRoomsCount} Rooms</span>
          </div>
        </div>

        {/* Available / Vacant Beds */}
        <div className="bg-white p-5 border border-[#E5E5E1] border-l-4 border-l-emerald-500">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F]">Vacant / Available</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono flex items-baseline gap-2">
            <span>{summaryMetrics.vacantBeds}</span>
            <span className="text-xs font-semibold text-emerald-600">({summaryMetrics.vacantRate}%)</span>
          </div>
          <div className="text-[11px] text-emerald-800 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ready for Immediate Move-in</span>
          </div>
        </div>

        {/* Occupied Beds */}
        <div className="bg-white p-5 border border-[#E5E5E1] border-l-4 border-l-blue-500">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F]">Occupied Beds</div>
          <div className="text-2xl font-bold text-blue-900 mt-1 font-mono flex items-baseline gap-2">
            <span>{summaryMetrics.occupiedBeds}</span>
            <span className="text-xs font-semibold text-blue-700">({summaryMetrics.occupiedRate}%)</span>
          </div>
          <div className="text-[11px] text-blue-800 mt-1 font-medium flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5 text-blue-600" />
            <span>Active Occupants</span>
          </div>
        </div>

        {/* Expected Departures / Freed Beds */}
        <div className="bg-white p-5 border border-[#E5E5E1] border-l-4 border-l-amber-500">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F]">Checkouts in Window</div>
          <div className="text-2xl font-bold text-amber-900 mt-1 font-mono">{summaryMetrics.freesUpCount}</div>
          <div className="text-[11px] text-amber-800 mt-1 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Freed between {fromDate} & {toDate}</span>
          </div>
        </div>

        {/* Maintenance Holds */}
        <div className="bg-white p-5 border border-[#E5E5E1] border-l-4 border-l-rose-500">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F]">Maintenance Hold</div>
          <div className="text-2xl font-bold text-rose-800 mt-1 font-mono">{summaryMetrics.maintenanceBeds}</div>
          <div className="text-[11px] text-rose-700 mt-1 font-medium flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5 text-rose-600" />
            <span>Out of Service</span>
          </div>
        </div>
      </div>

      {/* 4. AVAILABILITY BY ROOM CATEGORY BREAKDOWN */}
      <div className="bg-white border border-[#E5E5E1] p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E1] mb-5">
          <div>
            <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1A1A1A]" />
              <span>Availability Breakdown by Room Category</span>
            </h2>
            <p className="text-xs text-[#666662] mt-0.5">
              Compare vacant capacity and upcoming turnover across room categories.
            </p>
          </div>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#A3A39F] font-semibold">
            No room categories configured or matching the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.roomType.id}
                className="p-4 bg-[#F9F9F8] border border-[#E5E5E1] rounded-xs space-y-3 relative overflow-hidden"
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                    {cat.roomType.name}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white border border-[#E5E5E1] text-[#1A1A1A]">
                    {cat.roomsCount} Rooms • {cat.totalBeds} Beds
                  </span>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xs">
                    <div className="text-emerald-900 font-bold font-mono text-base">{cat.vacantBeds}</div>
                    <div className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider mt-0.5">Vacant</div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-2 rounded-xs">
                    <div className="text-blue-900 font-bold font-mono text-base">{cat.occupiedBeds}</div>
                    <div className="text-[9px] uppercase font-bold text-blue-700 tracking-wider mt-0.5">Occupied</div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-2 rounded-xs">
                    <div className="text-amber-900 font-bold font-mono text-base">{cat.freesUpCount}</div>
                    <div className="text-[9px] uppercase font-bold text-amber-700 tracking-wider mt-0.5">Frees Up</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#1A1A1A]">
                    <span>Availability Rate</span>
                    <span className="font-mono text-emerald-700 font-bold">{cat.availPct}% Vacant</span>
                  </div>
                  <div className="w-full bg-[#E5E5E1] h-2 rounded-xs overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${cat.availPct}%` }} title="Vacant" />
                    <div className="bg-blue-500 h-full" style={{ width: `${cat.occPct}%` }} title="Occupied" />
                    <div className="bg-rose-500 h-full" style={{ width: `${100 - cat.availPct - cat.occPct}%` }} title="Maintenance" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. DETAILED ROOM & BED AVAILABILITY MATRIX */}
      <div className="bg-white border border-[#E5E5E1]">
        <div className="p-5 border-b border-[#E5E5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-[#1A1A1A]" />
              <span>Room & Bed Availability Matrix</span>
            </h2>
            <p className="text-xs text-[#666662] mt-0.5">
              Live status, occupant assignments, and window availability for room beds.
            </p>
          </div>

          <div className="text-xs text-[#A3A39F] font-bold font-mono">
            {masterBedRecords.length} Beds Loaded
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-[#1A1A1A] text-white uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-4">Room & Building</th>
                <th className="py-3 px-3">Room Category</th>
                <th className="py-3 px-3">Bed Label</th>
                <th className="py-3 px-3">Current Status</th>
                <th className="py-3 px-4">Current Occupant</th>
                <th className="py-3 px-3">Check-in / Checkout</th>
                <th className="py-3 px-4">Availability in Selected Window</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1] bg-white">
              {masterBedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#A3A39F] font-semibold">
                    No matching room beds found for the specified filters and date range.
                  </td>
                </tr>
              ) : (
                masterBedRecords.map((r) => {
                  return (
                    <tr key={r.bed.id} className="hover:bg-[#F9F9F8] transition-colors">
                      {/* Room & Building */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#1A1A1A] text-sm">
                          Room {r.room?.roomNumber || 'N/A'}
                        </div>
                        <div className="text-[10px] text-[#666662] font-medium mt-0.5">
                          {r.buildingName} • {r.floorLabel}
                        </div>
                      </td>

                      {/* Room Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#F0F0EE] border border-[#E5E5E1] text-[#1A1A1A]">
                          {r.roomType?.name || 'General'}
                        </span>
                      </td>

                      {/* Bed Label */}
                      <td className="py-3.5 px-3 font-semibold text-[#1A1A1A] whitespace-nowrap">
                        {r.bed.label}
                      </td>

                      {/* Current Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {r.isOccupied ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                            Occupied
                          </span>
                        ) : r.isMaintenance ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300">
                            <Wrench className="w-3 h-3 text-rose-700" />
                            Maintenance
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                            Vacant
                          </span>
                        )}
                      </td>

                      {/* Current Occupant */}
                      <td className="py-3.5 px-4">
                        {r.bed.assignedTo ? (
                          <div>
                            <div className="font-bold text-[#1A1A1A]">{r.bed.assignedTo.memberName}</div>
                            <div className="text-[10px] text-[#666662] font-mono mt-0.5">
                              ID: {r.bed.assignedTo.employeeId} • {r.bed.assignedTo.department}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#A3A39F] italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Check-in / Checkout */}
                      <td className="py-3.5 px-3 text-[11px] font-mono whitespace-nowrap">
                        {r.bed.assignedTo ? (
                          <div>
                            <div className="text-[#666662]">In: {r.bed.assignedTo.checkInDate}</div>
                            <div className="font-bold text-[#1A1A1A]">
                              Out: {r.bed.assignedTo.expectedCheckOutDate || 'Open'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#A3A39F]">-</span>
                        )}
                      </td>

                      {/* Availability Forecast in Window */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {r.isVacant ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Vacant & Immediately Available</span>
                          </div>
                        ) : r.freesUpInRange ? (
                          <div className="flex items-center gap-1.5 text-amber-800 font-bold bg-amber-50 px-2.5 py-1 border border-amber-300 rounded-xs">
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Frees Up on {r.expectedCheckout}</span>
                          </div>
                        ) : r.isMaintenance ? (
                          <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Out of Service (Maintenance)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[#666662] font-semibold">
                            <span>Occupied (Beyond Selected Window)</span>
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        {r.isVacant && canEditModule('assignments') && (
                          <button
                            onClick={() => {
                              setBedToAssign(r.bed);
                              setAssignModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-[#1A1A1A] hover:bg-black text-white transition-colors"
                          >
                            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Assign</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSIGN MEMBER MODAL */}
      <AssignMemberModal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setBedToAssign(null);
        }}
        bedToAssign={bedToAssign}
      />
    </div>
  );
};
