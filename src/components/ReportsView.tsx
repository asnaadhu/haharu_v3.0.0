import React, { useState, useMemo } from 'react';
import { useProperty } from '../context/PropertyContext';
import { TransferReportAnalytics } from './TransferReportAnalytics';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  Building2,
  BedDouble,
  Users,
  Wrench,
  Search,
  Calendar,
  CheckCircle2,
  PieChart,
  BarChart3,
  FileDown,
  Shield,
  Clock,
  Globe,
  Laptop,
  PlaneTakeoff,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ReportType = 'occupancy' | 'inventory' | 'transfer' | 'maintenance' | 'audit';

export const ReportsView: React.FC = () => {
  const { data } = useProperty();

  const [activeReport, setActiveReport] = useState<ReportType>('occupancy');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [transferDisplayTab, setTransferDisplayTab] = useState<'all' | 'charts' | 'table'>('all');

  // Extract unique departments from occupants, users, and transfers
  const departmentList = useMemo(() => {
    const set = new Set<string>();
    data.beds.forEach((b) => {
      if (b.assignedTo?.department) set.add(b.assignedTo.department);
    });
    data.users.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    (data.transferRecords || []).forEach((t) => {
      if (t.department) set.add(t.department);
    });
    return Array.from(set).sort();
  }, [data.beds, data.users, data.transferRecords]);

  // Overall statistics
  const totalBeds = data.beds.length;
  const occupiedBeds = data.beds.filter((b) => b.assignedTo != null).length;
  const vacantBeds = totalBeds - occupiedBeds;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const openMaintenance = data.maintenanceRequests.filter((r) => r.status !== 'Completed').length;
  const totalTransfers = (data.transferRecords || []).length;
  const pendingTransfers = (data.transferRecords || []).filter((r) => r.status === 'Pending').length;

  // Filtered Occupancy Data
  const filteredOccupancyRows = useMemo(() => {
    return data.beds
      .map((bed) => {
        const room = data.rooms.find((r) => r.id === bed.roomId);
        const building = data.buildings.find((b) => b.id === room?.buildingId);
        const floor = data.floors.find((f) => f.id === room?.floorId);
        const status = data.statuses.find((s) => s.id === bed.statusId);
        const isOccupied = bed.assignedTo != null;

        return {
          bedId: bed.id,
          bedLabel: bed.label,
          buildingId: building?.id || '',
          buildingName: building?.name || 'Unassigned',
          roomNumber: room?.roomNumber || '-',
          floorLabel: floor?.label || '-',
          statusLabel: status?.label || (isOccupied ? 'Occupied' : 'Vacant'),
          isOccupied,
          memberName: bed.assignedTo?.memberName || '-',
          employeeId: bed.assignedTo?.employeeId || '-',
          position: bed.assignedTo?.position || '-',
          department: bed.assignedTo?.department || '-',
          contactPhone: bed.assignedTo?.contactPhone || bed.assignedTo?.phone || '-',
          checkInDate: bed.assignedTo?.checkInDate || '-',
          expectedCheckOutDate: bed.assignedTo?.expectedCheckOutDate || '-',
        };
      })
      .filter((row) => {
        if (selectedBuildingId !== 'all' && row.buildingId !== selectedBuildingId) return false;
        if (selectedDepartment !== 'all' && row.department !== selectedDepartment) return false;
        if (selectedStatus === 'occupied' && !row.isOccupied) return false;
        if (selectedStatus === 'vacant' && row.isOccupied) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = row.memberName.toLowerCase().includes(q);
          const matchEmp = row.employeeId.toLowerCase().includes(q);
          const matchPos = row.position.toLowerCase().includes(q);
          const matchDept = row.department.toLowerCase().includes(q);
          const matchRoom = row.roomNumber.toLowerCase().includes(q);
          const matchBldg = row.buildingName.toLowerCase().includes(q);
          if (!matchName && !matchEmp && !matchPos && !matchDept && !matchRoom && !matchBldg) return false;
        }

        if (dateFrom && row.checkInDate !== '-') {
          if (row.checkInDate < dateFrom) return false;
        }
        if (dateTo && row.checkInDate !== '-') {
          if (row.checkInDate > dateTo) return false;
        }

        return true;
      });
  }, [data, selectedBuildingId, selectedDepartment, selectedStatus, searchQuery, dateFrom, dateTo]);

  // Filtered Room & Building Inventory Rows
  const filteredInventoryRows = useMemo(() => {
    return data.rooms
      .map((room) => {
        const building = data.buildings.find((b) => b.id === room.buildingId);
        const floor = data.floors.find((f) => f.id === room.floorId);
        const roomType = data.roomTypes.find((rt) => rt.id === room.roomTypeId);
        const roomBeds = data.beds.filter((b) => b.roomId === room.id);
        const roomOccupied = roomBeds.filter((b) => b.assignedTo != null).length;
        const roomVacant = roomBeds.length - roomOccupied;
        const roomRate = roomBeds.length > 0 ? Math.round((roomOccupied / roomBeds.length) * 100) : 0;

        return {
          roomId: room.id,
          buildingId: building?.id || '',
          buildingName: building?.name || '-',
          roomNumber: room.roomNumber,
          floorLabel: floor?.label || '-',
          roomTypeName: roomType?.name || 'Standard Room',
          genderPolicy: room.genderPolicy || 'Mixed',
          totalCapacity: roomBeds.length,
          occupiedCount: roomOccupied,
          vacantCount: roomVacant,
          occupancyRate: roomRate,
        };
      })
      .filter((row) => {
        if (selectedBuildingId !== 'all' && row.buildingId !== selectedBuildingId) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchRoom = row.roomNumber.toLowerCase().includes(q);
          const matchBldg = row.buildingName.toLowerCase().includes(q);
          const matchType = row.roomTypeName.toLowerCase().includes(q);
          if (!matchRoom && !matchBldg && !matchType) return false;
        }
        return true;
      });
  }, [data, selectedBuildingId, searchQuery]);

  // Filtered Transfer Rows
  const filteredTransferRows = useMemo(() => {
    return (data.transferRecords || [])
      .map((tr) => {
        const rawCreated = tr.createdAt ? tr.createdAt.split('T')[0] : '';
        return {
          id: tr.id,
          psaNo: tr.psaNo || '-',
          fullName: tr.fullName || '-',
          employeeId: tr.employeeId || '-',
          position: tr.position || '-',
          department: tr.department || '-',
          transport: tr.transport || '-',
          nidWpNo: tr.nidWpNo || '-',
          arrivalDate: tr.arrivalDate || '-',
          departureDate: tr.departureDate || '-',
          arrivalFlight: tr.arrivalFlight || '-',
          departureFlight: tr.departureFlight || '-',
          flightDetails: tr.flightDetails || '-',
          checkInTime: tr.checkInTime || '-',
          checkInClose: tr.checkInClose || '-',
          departureTime: tr.departureTime || '-',
          rate: tr.rate ? `$${tr.rate}` : '-',
          notes: tr.notes || '-',
          status: tr.status || 'Pending',
          createdAt: tr.createdAt ? new Date(tr.createdAt).toLocaleDateString() : '-',
          rawCreatedAt: rawCreated,
        };
      })
      .filter((row) => {
        if (selectedDepartment !== 'all' && row.department !== selectedDepartment) return false;
        if (selectedStatus !== 'all' && row.status !== selectedStatus) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = row.fullName.toLowerCase().includes(q);
          const matchEmp = row.employeeId.toLowerCase().includes(q);
          const matchPsa = row.psaNo.toLowerCase().includes(q);
          const matchPos = row.position.toLowerCase().includes(q);
          const matchDept = row.department.toLowerCase().includes(q);
          const matchNid = row.nidWpNo.toLowerCase().includes(q);
          const matchTransport = row.transport.toLowerCase().includes(q);
          const matchArrival = row.arrivalFlight.toLowerCase().includes(q);
          const matchDep = row.departureFlight.toLowerCase().includes(q);
          if (
            !matchName &&
            !matchEmp &&
            !matchPsa &&
            !matchPos &&
            !matchDept &&
            !matchNid &&
            !matchTransport &&
            !matchArrival &&
            !matchDep
          )
            return false;
        }

        // Travel / Movement Date Range Filtering (inclusive of all statuses)
        if (dateFrom || dateTo) {
          const arr = row.arrivalDate !== '-' ? row.arrivalDate : '';
          const dep = row.departureDate !== '-' ? row.departureDate : '';
          const created = row.rawCreatedAt || '';

          const availableDates = [arr, dep, created].filter(Boolean);

          if (dateFrom && dateTo) {
            // Check if any travel date falls within [dateFrom, dateTo] OR if range [arr, dep] overlaps
            const hasDateInRange = availableDates.some((d) => d >= dateFrom && d <= dateTo);
            const rangeOverlaps = Boolean(arr && dep && arr <= dateTo && dep >= dateFrom);
            if (!hasDateInRange && !rangeOverlaps) return false;
          } else if (dateFrom) {
            const hasDateAfterFrom = availableDates.some((d) => d >= dateFrom) || Boolean(dep && dep >= dateFrom);
            if (!hasDateAfterFrom) return false;
          } else if (dateTo) {
            const hasDateBeforeTo = availableDates.some((d) => d <= dateTo) || Boolean(arr && arr <= dateTo);
            if (!hasDateBeforeTo) return false;
          }
        }

        return true;
      });
  }, [data.transferRecords, selectedDepartment, selectedStatus, searchQuery, dateFrom, dateTo]);

  // Filtered Maintenance Rows
  const filteredMaintenanceRows = useMemo(() => {
    return data.maintenanceRequests
      .map((req) => {
        const building = data.buildings.find((b) => b.id === req.buildingId);
        const room = data.rooms.find((r) => r.id === req.roomId);
        const bed = data.beds.find((b) => b.id === req.bedId);

        return {
          id: req.id,
          buildingId: building?.id || '',
          buildingName: building?.name || '-',
          location: `${building?.name || ''} - Room ${room?.roomNumber || '-'} ${bed ? `(${bed.label})` : ''}`,
          category: req.category,
          title: req.title,
          urgency: req.urgency,
          status: req.status,
          requesterName: req.requesterName,
          assignedTechnician: req.assignedTechnician || 'Unassigned',
          createdAt: req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '-',
          completedAt: req.completedAt ? new Date(req.completedAt).toLocaleDateString() : '-',
        };
      })
      .filter((row) => {
        if (selectedBuildingId !== 'all' && row.buildingId !== selectedBuildingId) return false;
        if (selectedStatus === 'occupied' && row.status === 'Completed') return false;
        if (selectedStatus === 'vacant' && row.status !== 'Completed') return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = row.title.toLowerCase().includes(q);
          const matchLoc = row.location.toLowerCase().includes(q);
          const matchReq = row.requesterName.toLowerCase().includes(q);
          const matchTech = row.assignedTechnician.toLowerCase().includes(q);
          if (!matchTitle && !matchLoc && !matchReq && !matchTech) return false;
        }
        return true;
      });
  }, [data, selectedBuildingId, selectedStatus, searchQuery]);

  // Filtered Audit Log Data
  const filteredAuditLogRows = useMemo(() => {
    return data.logs.filter((log) => {
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'login_logout' && log.action !== 'LOGIN' && log.action !== 'LOGOUT') return false;
        if (selectedStatus === 'assignments' && log.action !== 'ASSIGN' && log.action !== 'CHECKOUT') return false;
        if (selectedStatus === 'maintenance' && log.action !== 'MAINTENANCE_CREATE' && log.action !== 'MAINTENANCE_UPDATE') return false;
        if (selectedStatus === 'users' && log.action !== 'USER_CHANGE' && log.action !== 'ROLE_SWITCH') return false;
        if (selectedStatus === 'settings' && log.action !== 'SETTING_CHANGE' && log.action !== 'ROOM_CREATE' && log.action !== 'ROOM_UPDATE' && log.action !== 'STATUS_CHANGE') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = log.title?.toLowerCase().includes(q);
        const matchDetails = log.details?.toLowerCase().includes(q);
        const matchActor = log.actor?.toLowerCase().includes(q);
        const matchEmail = log.actorEmail?.toLowerCase().includes(q);
        const matchIp = log.ipAddress?.toLowerCase().includes(q);
        const matchBrowser = log.browser?.toLowerCase().includes(q);
        const matchDevice = log.deviceType?.toLowerCase().includes(q);
        const matchAction = log.action?.toLowerCase().includes(q);
        if (!matchTitle && !matchDetails && !matchActor && !matchEmail && !matchIp && !matchBrowser && !matchDevice && !matchAction) return false;
      }

      if (dateFrom) {
        const logTime = new Date(log.timestamp).getTime();
        const fromTime = new Date(dateFrom).getTime();
        if (logTime < fromTime) return false;
      }

      if (dateTo) {
        const logTime = new Date(log.timestamp).getTime();
        const toTime = new Date(dateTo).getTime() + 86400000;
        if (logTime > toTime) return false;
      }

      return true;
    });
  }, [data.logs, selectedStatus, searchQuery, dateFrom, dateTo]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedBuildingId('all');
    setSelectedDepartment('all');
    setSelectedStatus('all');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  // EXPORT CSV HANDLER
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `Haharu_Accommodation_Report_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeReport === 'occupancy') {
      headers = [
        'Building',
        'Room',
        'Bed Label',
        'Occupant Name',
        'Employee ID',
        'Department',
        'Contact Phone',
        'Status',
        'Check-In Date',
        'Expected Check-Out Date',
      ];
      rows = filteredOccupancyRows.map((r) => [
        r.buildingName,
        r.roomNumber,
        r.bedLabel,
        r.memberName,
        r.employeeId,
        r.department,
        r.contactPhone,
        r.isOccupied ? 'Occupied' : 'Vacant',
        r.checkInDate,
        r.expectedCheckOutDate,
      ]);
    } else if (activeReport === 'inventory') {
      headers = [
        'Building',
        'Room Number',
        'Floor',
        'Room Type',
        'Gender Policy',
        'Total Capacity',
        'Occupied Count',
        'Vacant Count',
        'Occupancy Rate (%)',
      ];
      rows = filteredInventoryRows.map((r) => [
        r.buildingName,
        r.roomNumber,
        r.floorLabel,
        r.roomTypeName,
        r.genderPolicy,
        r.totalCapacity.toString(),
        r.occupiedCount.toString(),
        r.vacantCount.toString(),
        `${r.occupancyRate}%`,
      ]);
    } else if (activeReport === 'transfer') {
      headers = [
        'PSA No',
        'Full Name',
        'Employee ID',
        'Position',
        'Department',
        'NID / WP No',
        'Transport Mode',
        'Arrival Date',
        'Arrival Flight / TKT',
        'Departure Date',
        'Departure Flight / TKT',
        'Check-In Time',
        'Check-In Close',
        'Departure Time',
        'Rate',
        'Status',
        'Notes',
      ];
      rows = filteredTransferRows.map((r) => [
        r.psaNo,
        r.fullName,
        r.employeeId,
        r.position,
        r.department,
        r.nidWpNo,
        r.transport,
        r.arrivalDate,
        r.arrivalFlight,
        r.departureDate,
        r.departureFlight,
        r.checkInTime,
        r.checkInClose,
        r.departureTime,
        r.rate,
        r.status,
        r.notes,
      ]);
    } else if (activeReport === 'maintenance') {
      headers = [
        'Ticket ID',
        'Location',
        'Category',
        'Title',
        'Urgency',
        'Status',
        'Requester',
        'Technician',
        'Created Date',
        'Completed Date',
      ];
      rows = filteredMaintenanceRows.map((r) => [
        r.id,
        r.location,
        r.category,
        r.title,
        r.urgency,
        r.status,
        r.requesterName,
        r.assignedTechnician,
        r.createdAt,
        r.completedAt,
      ]);
    } else if (activeReport === 'audit') {
      headers = [
        'Log ID',
        'Timestamp',
        'Action Type',
        'Event Title',
        'Event Details',
        'User / Actor',
        'Actor Email',
        'IP Address',
        'Browser & OS',
        'Device Type',
      ];
      rows = filteredAuditLogRows.map((r) => [
        r.id,
        new Date(r.timestamp).toLocaleString(),
        r.action,
        r.title,
        r.details,
        r.actor || 'System',
        r.actorEmail || '-',
        r.ipAddress || '192.168.1.105',
        r.browser || 'Unknown Browser',
        r.deviceType || 'Desktop',
      ]);
    }

    const escapeCsvField = (field: string) => {
      const cleanStr = String(field || '').replace(/"/g, '""');
      return `"${cleanStr}"`;
    };

    const csvContent =
      '\uFEFF' +
      [headers.map(escapeCsvField).join(','), ...rows.map((row) => row.map(escapeCsvField).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // EXPORT EXCEL HANDLER (Formatted HTML-Excel Spreadsheet with Native Styles & Tabs)
  const handleExportExcel = () => {
    let title = 'Accommodation Occupancy & Bed Assignment Report';
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `Haharu_Accommodation_Report_${activeReport}_${new Date().toISOString().split('T')[0]}.xls`;

    if (activeReport === 'occupancy') {
      title = 'Accommodation Occupancy & Bed Roster Report';
      headers = [
        'Building Name',
        'Room No',
        'Bed Label',
        'Occupant Name',
        'Employee ID',
        'Department',
        'Contact Phone',
        'Status',
        'Check-In Date',
        'Expected Check-Out Date',
      ];
      rows = filteredOccupancyRows.map((r) => [
        r.buildingName,
        r.roomNumber,
        r.bedLabel,
        r.memberName,
        r.employeeId,
        r.department,
        r.contactPhone,
        r.isOccupied ? 'Occupied' : 'Vacant',
        r.checkInDate,
        r.expectedCheckOutDate,
      ]);
    } else if (activeReport === 'inventory') {
      title = 'Room & Building Inventory Capacity Summary';
      headers = [
        'Building Name',
        'Room Number',
        'Floor Label',
        'Room Type',
        'Gender Policy',
        'Total Capacity',
        'Occupied Beds',
        'Vacant Beds',
        'Occupancy Rate',
      ];
      rows = filteredInventoryRows.map((r) => [
        r.buildingName,
        r.roomNumber,
        r.floorLabel,
        r.roomTypeName,
        r.genderPolicy,
        r.totalCapacity.toString(),
        r.occupiedCount.toString(),
        r.vacantCount.toString(),
        `${r.occupancyRate}%`,
      ]);
    } else if (activeReport === 'transfer') {
      title = 'Transfer Tracker & Movement Report';
      headers = [
        'PSA No',
        'Full Name',
        'Employee ID',
        'Position',
        'Department',
        'NID / WP No',
        'Transport Mode',
        'Arrival Date',
        'Arrival Flight / TKT',
        'Departure Date',
        'Departure Flight / TKT',
        'Check-In Time',
        'Check-In Close',
        'Departure Time',
        'Rate',
        'Status',
        'Notes',
      ];
      rows = filteredTransferRows.map((r) => [
        r.psaNo,
        r.fullName,
        r.employeeId,
        r.position,
        r.department,
        r.nidWpNo,
        r.transport,
        r.arrivalDate,
        r.arrivalFlight,
        r.departureDate,
        r.departureFlight,
        r.checkInTime,
        r.checkInClose,
        r.departureTime,
        r.rate,
        r.status,
        r.notes,
      ]);
    } else if (activeReport === 'maintenance') {
      title = 'Property Maintenance & Request Log Report';
      headers = [
        'Ticket Ref',
        'Property Location',
        'Category',
        'Issue Title',
        'Urgency Level',
        'Status',
        'Requester Name',
        'Assigned Technician',
        'Logged Date',
        'Completed Date',
      ];
      rows = filteredMaintenanceRows.map((r) => [
        r.id,
        r.location,
        r.category,
        r.title,
        r.urgency,
        r.status,
        r.requesterName,
        r.assignedTechnician,
        r.createdAt,
        r.completedAt,
      ]);
    }

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Accommodation Report</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Arial, sans-serif; }
          .header-title { font-size: 18px; font-weight: bold; color: #1A1A1A; }
          .header-meta { font-size: 11px; color: #666662; margin-bottom: 15px; }
          th { background-color: #1A1A1A; color: #FFFFFF; font-weight: bold; border: 1px solid #1A1A1A; padding: 8px; text-align: left; }
          td { border: 1px solid #E5E5E1; padding: 6px; font-size: 12px; }
          tr:nth-child(even) { background-color: #F9F9F8; }
        </style>
      </head>
      <body>
        <div class="header-title">HAHARU Housing System &bull; ${title}</div>
        <div class="header-meta">Export Generated: ${new Date().toLocaleString()} | Total Records: ${rows.length}</div>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
              <tr>
                ${row.map((cell) => `<td>${cell}</td>`).join('')}
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // EXPORT PDF HANDLER (jsPDF + autoTable)
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(26, 26, 26);
    doc.text('HAHARU HOUSING & ACCOMMODATION SYSTEM', 14, 15);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);

    let titleText = 'Occupancy & Bed Assignment Roster';
    if (activeReport === 'inventory') titleText = 'Room & Building Inventory Capacity Summary';
    if (activeReport === 'transfer') titleText = 'Transfer Tracker & Travel Movement Report';
    if (activeReport === 'maintenance') titleText = 'Property Maintenance & Incident Log Report';

    doc.text(titleText, 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Generated Date: ${new Date().toLocaleString()} | Total Capacity: ${totalBeds} beds | Occupancy Rate: ${occupancyRate}%`,
      14,
      27
    );

    let head: string[][] = [];
    let body: string[][] = [];

    if (activeReport === 'occupancy') {
      head = [
        [
          'Building',
          'Room',
          'Bed',
          'Occupant Name',
          'Emp ID',
          'Position',
          'Department',
          'Phone',
          'Status',
          'Check-In',
          'Check-Out',
        ],
      ];
      body = filteredOccupancyRows.map((r) => [
        r.buildingName,
        r.roomNumber,
        r.bedLabel,
        r.memberName,
        r.employeeId,
        r.position,
        r.department,
        r.contactPhone,
        r.isOccupied ? 'Occupied' : 'Vacant',
        r.checkInDate,
        r.expectedCheckOutDate,
      ]);
    } else if (activeReport === 'inventory') {
      head = [['Building', 'Room', 'Floor', 'Type', 'Gender', 'Capacity', 'Occupied', 'Vacant', 'Occupancy %']];
      body = filteredInventoryRows.map((r) => [
        r.buildingName,
        r.roomNumber,
        r.floorLabel,
        r.roomTypeName,
        r.genderPolicy,
        r.totalCapacity.toString(),
        r.occupiedCount.toString(),
        r.vacantCount.toString(),
        `${r.occupancyRate}%`,
      ]);
    } else if (activeReport === 'transfer') {
      head = [
        [
          'PSA No',
          'Full Name',
          'Emp ID',
          'Position',
          'Department',
          'NID/WP No',
          'Transport',
          'Arrival Flight',
          'Departure Flight',
          'Times',
          'Status',
        ],
      ];
      body = filteredTransferRows.map((r) => [
        r.psaNo,
        r.fullName,
        r.employeeId,
        r.position,
        r.department,
        r.nidWpNo,
        r.transport,
        `${r.arrivalDate} (${r.arrivalFlight})`,
        `${r.departureDate} (${r.departureFlight})`,
        `In: ${r.checkInTime} / Out: ${r.departureTime}`,
        r.status,
      ]);
    } else if (activeReport === 'maintenance') {
      head = [['Ticket Ref', 'Location', 'Category', 'Issue Title', 'Urgency', 'Status', 'Requester', 'Technician', 'Created']];
      body = filteredMaintenanceRows.map((r) => [
        r.id,
        r.location,
        r.category,
        r.title,
        r.urgency,
        r.status,
        r.requesterName,
        r.assignedTechnician,
        r.createdAt,
      ]);
    } else if (activeReport === 'audit') {
      head = [['Timestamp', 'Action', 'Event Title', 'User / Actor', 'IP Address', 'Browser / Device', 'Details']];
      body = filteredAuditLogRows.map((r) => [
        new Date(r.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
        r.action,
        r.title,
        `${r.actor || 'System'} (${r.actorEmail || 'N/A'})`,
        r.ipAddress || '192.168.1.105',
        `${r.browser || 'Browser'} / ${r.deviceType || 'Desktop'}`,
        r.details,
      ]);
    }

    autoTable(doc, {
      startY: 32,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: {
        fillColor: [26, 26, 26],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [40, 40, 40],
      },
      alternateRowStyles: {
        fillColor: [249, 249, 248],
      },
      margin: { top: 32, right: 14, bottom: 15, left: 14 },
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} - Confidential - Haharu Accommodation System`,
        doc.internal.pageSize.width - 80,
        doc.internal.pageSize.height - 8
      );
    }

    doc.save(`Haharu_Accommodation_Report_${activeReport}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // PRINT HANDLER
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Main Report Control Center */}
      <div className="bg-white border border-[#E5E5E1] shadow-2xs">
        {/* Report Selector Tabs */}
        <div className="flex flex-wrap items-center border-b border-[#E5E5E1] bg-[#F9F9F8] p-2 gap-2">
          <button
            onClick={() => setActiveReport('occupancy')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeReport === 'occupancy'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#666662] hover:bg-[#E5E5E1] hover:text-[#1A1A1A]'
            }`}
          >
            <BedDouble className="w-4 h-4" />
            <span>Bed Occupancy & Roster</span>
          </button>

          <button
            onClick={() => setActiveReport('inventory')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeReport === 'inventory'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#666662] hover:bg-[#E5E5E1] hover:text-[#1A1A1A]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Room & Capacity Summary</span>
          </button>

          <button
            onClick={() => setActiveReport('transfer')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeReport === 'transfer'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#666662] hover:bg-[#E5E5E1] hover:text-[#1A1A1A]'
            }`}
          >
            <PlaneTakeoff className="w-4 h-4 text-amber-400" />
            <span>Transfer Report</span>
          </button>

          <button
            onClick={() => setActiveReport('maintenance')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeReport === 'maintenance'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#666662] hover:bg-[#E5E5E1] hover:text-[#1A1A1A]'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Maintenance & Tickets</span>
          </button>

          <button
            onClick={() => setActiveReport('audit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeReport === 'audit'
                ? 'bg-[#1A1A1A] text-white shadow-xs'
                : 'text-[#666662] hover:bg-[#E5E5E1] hover:text-[#1A1A1A]'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Audit & Security Logs</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-[#E5E5E1] bg-white space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Query */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-[#A3A39F] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeReport === 'transfer'
                    ? 'Search PSA No, full name, ID, transport, flight, position...'
                    : 'Search occupants, IDs, room number, or buildings...'
                }
                className="w-full pl-9 pr-3 py-2 border border-[#E5E5E1] text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            {/* Building Filter (Hide on transfer report since transfers are global movements) */}
            {activeReport !== 'transfer' && (
              <div className="w-48">
                <select
                  value={selectedBuildingId}
                  onChange={(e) => setSelectedBuildingId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E5E1] text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="all">All Buildings</option>
                  {data.buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Department Filter (for occupancy & transfer) */}
            {(activeReport === 'occupancy' || activeReport === 'transfer') && (
              <div className="w-44">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E5E1] text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="all">All Departments</option>
                  {departmentList.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            {(activeReport === 'occupancy' || activeReport === 'transfer' || activeReport === 'maintenance' || activeReport === 'audit') && (
              <div className="w-44">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E5E1] text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                >
                  {activeReport === 'audit' ? (
                    <>
                      <option value="all">All Log Types</option>
                      <option value="login_logout">Logins & Logouts</option>
                      <option value="assignments">Bed Assignments</option>
                      <option value="maintenance">Maintenance Events</option>
                      <option value="users">User Access & Roles</option>
                      <option value="settings">System & Settings</option>
                    </>
                  ) : activeReport === 'transfer' ? (
                    <>
                      <option value="all">All Transfer Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </>
                  ) : activeReport === 'occupancy' ? (
                    <>
                      <option value="all">All Statuses</option>
                      <option value="occupied">Occupied Only</option>
                      <option value="vacant">Vacant Only</option>
                    </>
                  ) : (
                    <>
                      <option value="all">All Statuses</option>
                      <option value="occupied">Active / Open</option>
                      <option value="vacant">Completed</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Clear Filters Button */}
            {(selectedBuildingId !== 'all' ||
              selectedDepartment !== 'all' ||
              selectedStatus !== 'all' ||
              searchQuery ||
              dateFrom ||
              dateTo) && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 text-xs font-bold text-[#A3A39F] hover:text-[#1A1A1A] uppercase tracking-wider"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Date Range Bar */}
          {(activeReport === 'occupancy' || activeReport === 'transfer') && (
            <div className="flex items-center gap-3 text-xs text-[#A3A39F] pt-2 border-t border-[#F0F0EE]">
              <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />{' '}
                {activeReport === 'transfer' ? 'Filter Travel / Movement Date:' : 'Filter Check-In Date:'}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1 border border-[#E5E5E1] text-xs font-mono text-[#1A1A1A]"
                />
                <span>to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-1 border border-[#E5E5E1] text-xs font-mono text-[#1A1A1A]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Export Toolbar Bar */}
        <div className="px-6 py-3 bg-[#F9F9F8] border-b border-[#E5E5E1] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-[#1A1A1A] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#A3A39F]" />
            <span>
              Report Records Filtered:{' '}
              <strong className="text-[#1A1A1A]">
                {activeReport === 'occupancy' && filteredOccupancyRows.length}
                {activeReport === 'inventory' && filteredInventoryRows.length}
                {activeReport === 'transfer' && filteredTransferRows.length}
                {activeReport === 'maintenance' && filteredMaintenanceRows.length}
                {activeReport === 'audit' && filteredAuditLogRows.length}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#333330] transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Export PDF</span>
            </button>

            {/* Export Excel Button */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#333330] transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Excel</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-[#1A1A1A] border border-[#E5E5E1] text-xs font-bold uppercase tracking-wider hover:bg-[#F0F0EE] transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export CSV</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#666662] border border-[#E5E5E1] text-xs font-bold uppercase tracking-wider hover:text-[#1A1A1A] hover:bg-[#F0F0EE] transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Report Data Table Container */}
        <div className="overflow-x-auto">
          {/* 1. OCCUPANCY REPORT TABLE */}
          {activeReport === 'occupancy' && (
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-[#1A1A1A] text-white uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Building</th>
                  <th className="py-3 px-3">Room</th>
                  <th className="py-3 px-3">Bed</th>
                  <th className="py-3 px-4">Occupant Name</th>
                  <th className="py-3 px-3">Employee ID</th>
                  <th className="py-3 px-3">Position</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Check-In</th>
                  <th className="py-3 px-3">Check-Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E1] bg-white">
                {filteredOccupancyRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-[#A3A39F] font-semibold">
                      No matching bed occupancy records found.
                    </td>
                  </tr>
                ) : (
                  filteredOccupancyRows.map((row) => (
                    <tr key={row.bedId} className="hover:bg-[#F9F9F8] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#1A1A1A]">{row.buildingName}</td>
                      <td className="py-3 px-3 font-semibold text-[#1A1A1A]">{row.roomNumber}</td>
                      <td className="py-3 px-3 font-semibold text-[#1A1A1A]">{row.bedLabel}</td>
                      <td className="py-3 px-4 font-bold text-[#1A1A1A]">
                        {row.isOccupied ? (
                          <span className="text-[#1A1A1A]">{row.memberName}</span>
                        ) : (
                          <span className="text-[#A3A39F] italic font-normal">Vacant Bed</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#666662]">{row.employeeId}</td>
                      <td className="py-3 px-3 text-[#1A1A1A] font-medium">{row.position}</td>
                      <td className="py-3 px-3 text-[#1A1A1A] font-medium">{row.department}</td>
                      <td className="py-3 px-3">
                        {row.isOccupied ? (
                          <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                            Occupied
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                            Vacant
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#666662]">{row.checkInDate}</td>
                      <td className="py-3 px-3 font-mono text-[#666662]">{row.expectedCheckOutDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* 2. INVENTORY REPORT TABLE */}
          {activeReport === 'inventory' && (
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-[#1A1A1A] text-white uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Building</th>
                  <th className="py-3 px-3">Room</th>
                  <th className="py-3 px-3">Floor</th>
                  <th className="py-3 px-4">Room Type</th>
                  <th className="py-3 px-3">Gender Policy</th>
                  <th className="py-3 px-3 text-center">Capacity</th>
                  <th className="py-3 px-3 text-center">Occupied</th>
                  <th className="py-3 px-3 text-center">Vacant</th>
                  <th className="py-3 px-3 text-right">Occupancy %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E1] bg-white">
                {filteredInventoryRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#A3A39F] font-semibold">
                      No room inventory records found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredInventoryRows.map((row) => (
                    <tr key={row.roomId} className="hover:bg-[#F9F9F8] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#1A1A1A]">{row.buildingName}</td>
                      <td className="py-3 px-3 font-semibold text-[#1A1A1A]">#{row.roomNumber}</td>
                      <td className="py-3 px-3 text-[#666662]">{row.floorLabel}</td>
                      <td className="py-3 px-4 text-[#1A1A1A] font-medium">{row.roomTypeName}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 border border-gray-200">
                          {row.genderPolicy}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-[#1A1A1A]">{row.totalCapacity}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-800">{row.occupiedCount}</td>
                      <td className="py-3 px-3 text-center font-bold text-indigo-800">{row.vacantCount}</td>
                      <td className="py-3 px-3 text-right font-bold text-[#1A1A1A]">{row.occupancyRate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* 3. TRANSFER REPORT (ANALYTICS & TABLE) */}
          {activeReport === 'transfer' && (
            <div className="space-y-6">
              {/* Transfer Display Mode Bar */}
              <div className="bg-[#1A1A1A] text-white p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <PlaneTakeoff className="w-4 h-4 text-amber-400" />
                  <span className="uppercase tracking-wider">Transfer Report Layout Mode:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTransferDisplayTab('all')}
                    className={`px-3 py-1.5 uppercase text-[10px] tracking-wider transition-colors ${
                      transferDisplayTab === 'all'
                        ? 'bg-amber-500 text-black font-extrabold'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Full Report (Graphs + Schematics + Table)
                  </button>
                  <button
                    onClick={() => setTransferDisplayTab('charts')}
                    className={`px-3 py-1.5 uppercase text-[10px] tracking-wider transition-colors ${
                      transferDisplayTab === 'charts'
                        ? 'bg-amber-500 text-black font-extrabold'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Graphs & Schematics Only
                  </button>
                  <button
                    onClick={() => setTransferDisplayTab('table')}
                    className={`px-3 py-1.5 uppercase text-[10px] tracking-wider transition-colors ${
                      transferDisplayTab === 'table'
                        ? 'bg-amber-500 text-black font-extrabold'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Movement Table Only
                  </button>
                </div>
              </div>

              {/* Graphs and Schematics Component */}
              {(transferDisplayTab === 'all' || transferDisplayTab === 'charts') && (
                <TransferReportAnalytics transferRecords={filteredTransferRows} />
              )}

              {/* Data Table */}
              {(transferDisplayTab === 'all' || transferDisplayTab === 'table') && (
                <div className="border border-[#E5E5E1] bg-white overflow-x-auto">
                  <div className="p-3 bg-[#F5F5F3] border-b border-[#E5E5E1] flex items-center justify-between text-xs font-bold text-[#1A1A1A]">
                    <span className="uppercase tracking-wider flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-[#666662]" />
                      Detailed Movement Records Roster ({filteredTransferRows.length})
                    </span>
                    <span className="text-[10px] text-[#666662] font-normal">
                      Filtered by active search, transport mode, department & status
                    </span>
                  </div>
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="bg-[#1A1A1A] text-white uppercase tracking-wider text-[10px] font-bold">
                        <th className="py-3 px-3">PSA No</th>
                        <th className="py-3 px-4">Full Name</th>
                        <th className="py-3 px-3">Emp ID</th>
                        <th className="py-3 px-3">Position</th>
                        <th className="py-3 px-3">Department</th>
                        <th className="py-3 px-3">NID / WP No</th>
                        <th className="py-3 px-3">Transport</th>
                        <th className="py-3 px-3">Arrival</th>
                        <th className="py-3 px-3">Departure</th>
                        <th className="py-3 px-3">Times</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E1] bg-white">
                      {filteredTransferRows.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-[#A3A39F] font-semibold">
                            No transfer or movement records found matching filters.
                          </td>
                        </tr>
                      ) : (
                        filteredTransferRows.map((row) => {
                          let statusBadge = 'bg-amber-100 text-amber-900 border-amber-200';
                          if (row.status === 'Completed') statusBadge = 'bg-emerald-100 text-emerald-900 border-emerald-200';
                          else if (row.status === 'Cancelled') statusBadge = 'bg-rose-100 text-rose-900 border-rose-200';

                          return (
                            <tr key={row.id} className="hover:bg-[#F9F9F8] transition-colors">
                              <td className="py-3 px-3 font-mono font-bold text-[#1A1A1A]">{row.psaNo}</td>
                              <td className="py-3 px-4 font-bold text-[#1A1A1A]">{row.fullName}</td>
                              <td className="py-3 px-3 font-mono text-[#666662]">{row.employeeId}</td>
                              <td className="py-3 px-3 text-[#1A1A1A] font-medium">{row.position}</td>
                              <td className="py-3 px-3 text-[#1A1A1A] font-medium">{row.department}</td>
                              <td className="py-3 px-3 font-mono text-[#666662]">{row.nidWpNo}</td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 border border-gray-200">
                                  {row.transport}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-mono text-[#1A1A1A] font-semibold">{row.arrivalDate}</div>
                                {row.arrivalFlight !== '-' && (
                                  <div className="text-[10px] text-[#666662] font-mono">{row.arrivalFlight}</div>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-mono text-[#1A1A1A] font-semibold">{row.departureDate}</div>
                                {row.departureFlight !== '-' && (
                                  <div className="text-[10px] text-[#666662] font-mono">{row.departureFlight}</div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-[10px] font-mono text-[#666662]">
                                <div>In: {row.checkInTime}</div>
                                <div>Out: {row.departureTime}</div>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. MAINTENANCE REPORT TABLE */}
          {activeReport === 'maintenance' && (
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-[#1A1A1A] text-white uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-3">Ticket ID</th>
                  <th className="py-3 px-4">Property Location</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-3">Urgency</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Requester</th>
                  <th className="py-3 px-3">Technician</th>
                  <th className="py-3 px-3">Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E1] bg-white">
                {filteredMaintenanceRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#A3A39F] font-semibold">
                      No maintenance records found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredMaintenanceRows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F9F9F8] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#1A1A1A]">{row.id}</td>
                      <td className="py-3 px-4 font-semibold text-[#1A1A1A]">{row.location}</td>
                      <td className="py-3 px-3 text-[#666662]">{row.category}</td>
                      <td className="py-3 px-4 font-medium text-[#1A1A1A]">{row.title}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            row.urgency === 'High'
                              ? 'bg-rose-100 text-rose-900 border border-rose-200'
                              : row.urgency === 'Medium'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}
                        >
                          {row.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#1A1A1A]">{row.status}</td>
                      <td className="py-3 px-3 text-[#1A1A1A]">{row.requesterName}</td>
                      <td className="py-3 px-3 text-[#666662]">{row.assignedTechnician}</td>
                      <td className="py-3 px-3 font-mono text-[#666662]">{row.createdAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* 4. AUDIT & SECURITY LOGS TABLE */}
          {activeReport === 'audit' && (
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-[#1A1A1A] text-white uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-4">Event Title & Details</th>
                  <th className="py-3 px-3">User / Actor</th>
                  <th className="py-3 px-3">IP Address</th>
                  <th className="py-3 px-3">Browser & OS</th>
                  <th className="py-3 px-3">Device Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E1] bg-white">
                {filteredAuditLogRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#A3A39F] font-semibold">
                      No security or audit log entries found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogRows.map((row) => {
                    let badgeClass = 'bg-gray-100 text-gray-800 border-gray-200';
                    if (row.action === 'LOGIN') badgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-300';
                    else if (row.action === 'LOGOUT') badgeClass = 'bg-rose-100 text-rose-900 border-rose-300';
                    else if (row.action === 'ROLE_SWITCH') badgeClass = 'bg-amber-100 text-amber-900 border-amber-300';
                    else if (row.action === 'ASSIGN') badgeClass = 'bg-blue-100 text-blue-900 border-blue-300';
                    else if (row.action === 'MAINTENANCE_CREATE' || row.action === 'MAINTENANCE_UPDATE') badgeClass = 'bg-purple-100 text-purple-900 border-purple-300';

                    return (
                      <tr key={row.id} className="hover:bg-[#F9F9F8] transition-colors">
                        <td className="py-3 px-4 font-mono text-[#1A1A1A] font-semibold whitespace-nowrap">
                          {new Date(row.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${badgeClass}`}>
                            {row.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#1A1A1A]">{row.title}</div>
                          <div className="text-[#666662] text-[11px] mt-0.5 leading-snug">{row.details}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-bold text-[#1A1A1A]">{row.actor || 'System'}</div>
                          {row.actorEmail && <div className="text-[10px] text-[#A3A39F] font-mono">{row.actorEmail}</div>}
                          {row.actorRole && <div className="text-[9px] text-[#666662] uppercase font-semibold">{row.actorRole}</div>}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#1A1A1A] font-bold whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-[#F0F0EE] border border-[#E5E5E1] rounded-xs text-[11px]">
                            {row.ipAddress || '192.168.1.105'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#1A1A1A] font-medium whitespace-nowrap">
                          {row.browser || 'Chrome (macOS)'}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 border border-gray-200">
                            {row.deviceType || 'Desktop'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
