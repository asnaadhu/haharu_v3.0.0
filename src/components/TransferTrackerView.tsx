import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { TransferRecord, TransferStatus } from '../types';
import { TransferModal } from './modals/TransferModal';
import { PrepareDhathuruModal } from './modals/PrepareDhathuruModal';
import { TransferAuditLogModal } from './modals/TransferAuditLogModal';
import { DailyTransferSummaryModal } from './modals/DailyTransferSummaryModal';
import { TransferBulkEditModal } from './modals/TransferBulkEditModal';
import { TransferDeleteModal } from './modals/TransferDeleteModal';
import {
  formatShortDate,
  getDateFilterLabel,
  getPresetDateRange,
  getStatusBadge,
  exportTransferCSV,
  type ActivePreset,
} from '../utils/transferTrackerHelpers';
import { PlaneTakeoff, Plus, Search, ListFilter as Filter, Download, Calendar, Clock, CreditCard as Edit2, Trash2, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, FileText, User, ArrowUpDown, PlaneLanding, Ship, SquareCheck as CheckSquare, X, Layers, Sparkles, Repeat, Link, History, Share2 } from 'lucide-react';

export const TransferTrackerView: React.FC = () => {
  const { data, deleteTransferRecord, updateTransferRecord } = useProperty();
  const { canEditModule, currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [legFilter, setLegFilter] = useState<'All' | 'Outbound' | 'Inbound' | 'Linked'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilterType, setDateFilterType] = useState<'travel' | 'arrival' | 'departure' | 'created'>('travel');
  const [activePreset, setActivePreset] = useState<ActivePreset>('none');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TransferRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<TransferRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDhathuruModalOpen, setIsDhathuruModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Audit Log History Modal State
  const [auditLogRecord, setAuditLogRecord] = useState<TransferRecord | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Daily Transfer Summary Share Modal State
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const handleOpenAuditLogs = (record: TransferRecord) => {
    setAuditLogRecord(record);
    setIsAuditModalOpen(true);
  };

  const transferRecords = data.transferRecords || [];

  const handlePresetDate = (preset: 'today' | 'tomorrow' | 'next7Days' | 'clear') => {
    const { startDate: s, endDate: e, activePreset: p } = getPresetDateRange(preset);
    setStartDate(s);
    setEndDate(e);
    setActivePreset(p);
  };

  // Filtering
  const filteredRecords = transferRecords.filter((record) => {
    const matchesSearch =
      record.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.psaNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.requestId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.linkedRequestId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.transport || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.nidWpNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || record.status === statusFilter;

    let matchesDateRange = true;
    if (startDate || endDate) {
      const checkInRange = (dateStr?: string) => {
        if (!dateStr) return false;
        const d = dateStr.slice(0, 10);
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      };

      if (dateFilterType === 'arrival') {
        matchesDateRange = checkInRange(record.arrivalDate);
      } else if (dateFilterType === 'departure') {
        matchesDateRange = checkInRange(record.departureDate);
      } else if (dateFilterType === 'created') {
        matchesDateRange = checkInRange(record.createdAt);
      } else {
        matchesDateRange = checkInRange(record.arrivalDate) || checkInRange(record.departureDate);
      }
    }

    let matchesLeg = true;
    if (legFilter === 'Outbound') {
      matchesLeg = record.legType === 'Outbound' || (!record.legType && Boolean(record.departureDate || record.departureFlight));
    } else if (legFilter === 'Inbound') {
      matchesLeg = record.legType === 'Inbound' || (!record.legType && Boolean(record.arrivalDate || record.arrivalFlight) && !record.departureDate);
    } else if (legFilter === 'Linked') {
      matchesLeg = Boolean(record.linkedPsaNo || record.tripGroupId || record.psaNo.includes('-DEP') || record.psaNo.includes('-RET'));
    }

    return matchesSearch && matchesStatus && matchesDateRange && matchesLeg;
  });

  // Bulk Selection Logic
  const isAllSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedIds.includes(r.id));

  const isSomeSelected =
    selectedIds.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = async (newStatus: TransferStatus) => {
    if (selectedIds.length === 0) return;
    setIsBulkUpdating(true);
    const userModifier = currentUser?.name || currentUser?.email || 'System User';
    try {
      await Promise.all(
        selectedIds.map((id) =>
          updateTransferRecord(id, {
            status: newStatus,
            lastModifiedBy: userModifier,
          })
        )
      );
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to update transfer records:', err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Bulk Edit Modal State
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditFocusField, setBulkEditFocusField] = useState<'flightDetails' | 'departureTime' | 'all' | null>(null);

  const openBulkEditModal = (focusField?: 'flightDetails' | 'departureTime' | 'all') => {
    setBulkEditFocusField(focusField || 'all');
    setIsBulkEditModalOpen(true);
  };

  const handleApplyBulkEdit = async (updates: Partial<TransferRecord>) => {
    if (selectedIds.length === 0) return;

    setIsBulkUpdating(true);
    try {
      await Promise.all(
        selectedIds.map((id) => updateTransferRecord(id, updates))
      );
      setSelectedIds([]);
      setIsBulkEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update transfer records:', err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // KPI Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const totalCount = transferRecords.length;
  const pendingCount = transferRecords.filter((r) => r.status === 'Pending').length;
  const activeReturnCount = transferRecords.filter(
    (r) => r.status === 'Pending' && (r.legType === 'Inbound' || r.psaNo.endsWith('-RET'))
  ).length;
  const todaysArrivalsCount = transferRecords.filter(
    (r) => r.status !== 'Cancelled' && r.arrivalDate && r.arrivalDate === todayStr
  ).length;
  const todaysDeparturesCount = transferRecords.filter(
    (r) => r.status !== 'Cancelled' && r.departureDate && r.departureDate === todayStr
  ).length;

  const handleCreateNew = () => {
    setSelectedRecord(null);
    setIsModalOpen(true);
  };

  const handleEdit = (record: TransferRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleAddReturnLeg = (record: TransferRecord) => {
    const random6Digit = Math.floor(100000 + Math.random() * 900000);
    const currentYear = new Date().getFullYear();
    const returnReqId = record.requestId
      ? `${record.requestId.replace(/-DEP$/i, '')}-RET`
      : `VFAR-${random6Digit}-${currentYear}-RET`;

    setSelectedRecord({
      id: '', // new record creation
      requestId: returnReqId,
      linkedRequestId: record.requestId || `VFAR-${random6Digit}-${currentYear}-DEP`,
      psaNo: record.psaNo, // Keep exact PSA No entered by user
      fullName: record.fullName,
      employeeId: record.employeeId,
      position: record.position,
      department: record.department,
      transport: record.transport,
      nidWpNo: record.nidWpNo,
      leaveType: record.leaveType,
      legType: 'Inbound',
      linkedPsaNo: record.psaNo,
      tripGroupId: record.tripGroupId || record.requestId || `VFAR-${random6Digit}-${currentYear}`,
      arrivalDate: record.arrivalDate || '',
      arrivalFlight: record.arrivalFlight || '',
      preferredFlightTiming: record.preferredFlightTiming || 'ANY',
      rate: record.rate,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: record.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (record: TransferRecord) => {
    setRecordToDelete(record);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTransferRecord(recordToDelete.id);
      setRecordToDelete(null);
    } catch (err) {
      console.error('Failed to delete transfer record:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusQuickChange = async (record: TransferRecord, newStatus: TransferStatus) => {
    await updateTransferRecord(record.id, {
      status: newStatus,
      lastModifiedBy: currentUser?.name || currentUser?.email || 'System User',
    });
  };

  const userModifier = currentUser?.name || currentUser?.email || 'System User';

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & KPI Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => {
            setStatusFilter('All');
            setLegFilter('All');
            handlePresetDate('clear');
          }}
          className="bg-white p-4 border border-[#E5E5E1] hover:border-[#1A1A1A] rounded-xs shadow-2xs cursor-pointer transition-colors"
          title="Click to view all transfers"
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F] mb-1">
            Total Requests
          </div>
          <div className="text-2xl font-bold text-[#1A1A1A]">{totalCount}</div>
          <p className="text-[11px] text-[#666662] mt-0.5">All transfers logged</p>
        </div>

        <div
          onClick={() => {
            setStatusFilter('Pending');
            setLegFilter('All');
          }}
          className="bg-white p-4 border border-[#E5E5E1] hover:border-purple-300 rounded-xs shadow-2xs cursor-pointer transition-colors"
          title="Click to filter by Pending Approval"
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F] mb-1">
            Pending Approval
          </div>
          <div className="text-2xl font-bold text-purple-700">{pendingCount}</div>
          <p className="text-[11px] text-[#666662] mt-0.5">Awaiting ticket confirmation</p>
        </div>

        <div
          onClick={() => {
            setLegFilter('Inbound');
            setStatusFilter('Pending');
          }}
          className="bg-white p-4 border border-[#E5E5E1] hover:border-amber-400 rounded-xs shadow-2xs cursor-pointer transition-colors"
          title="Click to view staff currently away awaiting return transfer"
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F] mb-1 flex items-center justify-between">
            <span>Awaiting Return</span>
            <PlaneLanding className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-800">{activeReturnCount}</div>
          <p className="text-[11px] text-[#666662] mt-0.5">Staff away on leave</p>
        </div>

        <div
          onClick={() => {
            setStartDate(todayStr);
            setEndDate(todayStr);
            setDateFilterType('arrival');
            setActivePreset('today');
          }}
          className="bg-white p-4 border border-[#E5E5E1] hover:border-emerald-300 rounded-xs shadow-2xs cursor-pointer transition-colors"
          title="Click to filter by Today's Arrivals"
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F] mb-1">
            Today's Arrivals
          </div>
          <div className="text-2xl font-bold text-emerald-700">{todaysArrivalsCount}</div>
          <p className="text-[11px] text-[#666662] mt-0.5">
            {todaysArrivalsCount > 0
              ? `${todaysArrivalsCount} arrival${todaysArrivalsCount > 1 ? 's' : ''} today`
              : 'No arrivals scheduled'}
          </p>
        </div>

        <div
          onClick={() => {
            setStartDate(todayStr);
            setEndDate(todayStr);
            setDateFilterType('departure');
            setActivePreset('today');
          }}
          className="bg-white p-4 border border-[#E5E5E1] hover:border-rose-300 rounded-xs shadow-2xs cursor-pointer transition-colors"
          title="Click to filter by Today's Departures"
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F] mb-1">
            Today's Departures
          </div>
          <div className="text-2xl font-bold text-rose-700">{todaysDeparturesCount}</div>
          <p className="text-[11px] text-[#666662] mt-0.5">
            {todaysDeparturesCount > 0
              ? `${todaysDeparturesCount} departure${todaysDeparturesCount > 1 ? 's' : ''} today`
              : 'No departures scheduled'}
          </p>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Export & Request Form Button */}
      <div className="bg-white p-3 border border-[#E5E5E1] rounded-xs shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A3A39F]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Name, Team Member ID, PSA No, Position, NID/WP..."
                className="w-full pl-8 pr-2.5 py-1 h-8 border border-[#E5E5E1] text-xs text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] rounded-xs bg-[#F9F9F8]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-[#A3A39F] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 h-8 border border-[#E5E5E1] text-xs text-[#1A1A1A] bg-[#F9F9F8] focus:outline-none focus:border-[#1A1A1A] rounded-xs font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {/* Leg Type Filter */}
              <select
                value={legFilter}
                onChange={(e) => setLegFilter(e.target.value as any)}
                className="px-2.5 py-1 h-8 border border-[#E5E5E1] text-xs text-[#1A1A1A] bg-[#F9F9F8] focus:outline-none focus:border-[#1A1A1A] rounded-xs font-semibold"
              >
                <option value="All">All Leg Types</option>
                <option value="Outbound">🛫 Outbound (Resort → Airport)</option>
                <option value="Inbound">🛬 Inbound (Airport → Resort)</option>
                <option value="Linked">🔄 Round Trip Linked</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export CSV Button */}
            <button
              onClick={() => exportTransferCSV(filteredRecords)}
              disabled={filteredRecords.length === 0}
              className="px-3 h-8 border border-[#E5E5E1] hover:bg-[#F0F0EE] text-[#1A1A1A] text-xs font-bold rounded-xs transition-colors flex items-center gap-1.5 uppercase tracking-wider disabled:opacity-40"
              title="Export transfer list to CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#666662]" />
              <span className="hidden md:inline">Export</span>
            </button>

            {/* SHARE Schedule Button */}
            <button
              type="button"
              onClick={() => setIsSummaryModalOpen(true)}
              className="px-3 h-8 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-xs transition-all flex items-center gap-1.5 uppercase tracking-wider shadow-2xs cursor-pointer"
              title="Share Daily Transfer Schedule Summary"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-700" />
              <span>SHARE</span>
            </button>

            {/* Request Form Button */}
            {canEditModule('transferTracker') && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsDhathuruModalOpen(true)}
                  className="px-3 h-8 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xs transition-colors flex items-center gap-1.5 uppercase tracking-wider shadow-xs"
                  title="Prepare Dhathuru movement manifest for completed requests"
                >
                  <Ship className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Prepare Dhathuru</span>
                </button>

                <button
                  onClick={handleCreateNew}
                  className="px-3 h-8 bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-bold rounded-xs transition-colors flex items-center gap-1.5 uppercase tracking-wider shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Request Form</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Range-Based Date Picker Section */}
        <div className="pt-2 border-t border-[#E5E5E1] space-y-2">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2">
            {/* Left: From Date, To Date, and Date Field Selector */}
            <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider shrink-0 mr-1">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Date Range:</span>
              </div>

              {/* From Date Input */}
              <div className="flex items-center gap-1 bg-[#F9F9F8] border border-[#E5E5E1] px-2 h-7 rounded-xs shadow-2xs">
                <span className="text-[9px] font-bold text-[#A3A39F] uppercase">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="text-xs text-[#1A1A1A] font-mono focus:outline-none bg-transparent cursor-pointer"
                />
                {startDate && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setActivePreset('custom');
                    }}
                    className="text-[#A3A39F] hover:text-[#1A1A1A] text-[10px] font-bold pl-0.5"
                    title="Clear start date"
                  >
                    ✕
                  </button>
                )}
              </div>

              <span className="text-xs font-bold text-[#A3A39F] hidden sm:inline">—</span>

              {/* To Date Input */}
              <div className="flex items-center gap-1 bg-[#F9F9F8] border border-[#E5E5E1] px-2 h-7 rounded-xs shadow-2xs">
                <span className="text-[9px] font-bold text-[#A3A39F] uppercase">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActivePreset('custom');
                  }}
                  className="text-xs text-[#1A1A1A] font-mono focus:outline-none bg-transparent cursor-pointer"
                />
                {endDate && (
                  <button
                    onClick={() => {
                      setEndDate('');
                      setActivePreset('custom');
                    }}
                    className="text-[#A3A39F] hover:text-[#1A1A1A] text-[10px] font-bold pl-0.5"
                    title="Clear end date"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Date Field Type Selector */}
              <div className="flex items-center gap-1 bg-[#F9F9F8] border border-[#E5E5E1] px-2 h-7 rounded-xs shadow-2xs">
                <span className="text-[9px] font-bold text-[#A3A39F] uppercase">Field</span>
                <select
                  value={dateFilterType}
                  onChange={(e) => setDateFilterType(e.target.value as any)}
                  className="text-xs font-semibold text-[#1A1A1A] focus:outline-none bg-transparent cursor-pointer"
                >
                  <option value="travel">Travel Date (Arrival / Departure)</option>
                  <option value="arrival">Arrival Date Only</option>
                  <option value="departure">Departure Date Only</option>
                  <option value="created">Creation Date</option>
                </select>
              </div>
            </div>

            {/* Right: Quick Date Range Presets */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[9px] font-bold text-[#A3A39F] uppercase tracking-wider mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => handlePresetDate('today')}
                className={`px-2 h-6 text-[10px] font-bold rounded-xs transition-colors uppercase tracking-wider border ${
                  activePreset === 'today'
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-[#F9F9F8] text-[#666662] border-[#E5E5E1] hover:bg-[#F0F0EE]'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handlePresetDate('tomorrow')}
                className={`px-2 h-6 text-[10px] font-bold rounded-xs transition-colors uppercase tracking-wider border ${
                  activePreset === 'tomorrow'
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-[#F9F9F8] text-[#666662] border-[#E5E5E1] hover:bg-[#F0F0EE]'
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handlePresetDate('next7Days')}
                className={`px-2 h-6 text-[10px] font-bold rounded-xs transition-colors uppercase tracking-wider border ${
                  activePreset === 'next7Days'
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-[#F9F9F8] text-[#666662] border-[#E5E5E1] hover:bg-[#F0F0EE]'
                }`}
              >
                Next 7 Days
              </button>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => handlePresetDate('clear')}
                  className="px-2 h-6 text-[10px] font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xs transition-colors uppercase tracking-wider ml-1 flex items-center gap-1"
                >
                  <X className="w-2.5 h-2.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Active Date Filter Summary Bar */}
          {(startDate || endDate) && (
            <div className="pt-1.5 border-t border-[#E5E5E1] flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-[#666662]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>
                  Filtering by <strong>{getDateFilterLabel(dateFilterType)}</strong>:
                  {' '}
                  <strong className="text-[#1A1A1A] font-mono">{startDate || 'Start Date'}</strong>
                  {' to '}
                  <strong className="text-[#1A1A1A] font-mono">{endDate || 'End Date'}</strong>
                </span>
              </div>
              <div className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-xs border border-amber-200">
                {filteredRecords.length} record{filteredRecords.length === 1 ? '' : 's'} found
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Banner */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1A1A] text-white p-3 rounded-xs border border-[#333333] flex flex-wrap items-center justify-between gap-3 shadow-md font-sans"
        >
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-mono font-extrabold text-sm">{selectedIds.length}</span>
            <span className="uppercase tracking-wider">Transfer Request(s) Selected</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canEditModule('transferTracker') && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Quick Actions */}
                <div className="flex items-center gap-1 border-r border-[#444444] pr-2.5">
                  <span className="text-[10px] text-[#A3A39F] font-bold uppercase tracking-wider mr-1">
                    Status:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleBulkStatusChange('Pending')}
                    disabled={isBulkUpdating}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-extrabold rounded-xs transition-colors uppercase tracking-wider disabled:opacity-50 shadow-xs"
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatusChange('Completed')}
                    disabled={isBulkUpdating}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-xs transition-colors uppercase tracking-wider disabled:opacity-50 shadow-xs"
                  >
                    Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatusChange('Cancelled')}
                    disabled={isBulkUpdating}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold rounded-xs transition-colors uppercase tracking-wider disabled:opacity-50 shadow-xs"
                  >
                    Cancelled
                  </button>
                </div>

                {/* Bulk Detail Action Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openBulkEditModal('flightDetails')}
                    disabled={isBulkUpdating}
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-extrabold rounded-xs transition-colors uppercase tracking-wider flex items-center gap-1 shadow-xs disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Flight Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openBulkEditModal('departureTime')}
                    disabled={isBulkUpdating}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold rounded-xs transition-colors uppercase tracking-wider flex items-center gap-1 shadow-xs disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Departure Time</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openBulkEditModal('all')}
                    disabled={isBulkUpdating}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-extrabold rounded-xs transition-colors uppercase tracking-wider flex items-center gap-1 shadow-xs disabled:opacity-50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Bulk Edit...</span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-xs transition-colors uppercase tracking-wider ml-1 border border-white/10"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Transfers Table */}
      <div className="bg-white border border-[#E5E5E1] rounded-xs shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9F9F8] border-b border-[#E5E5E1] text-[10px] font-bold uppercase tracking-widest text-[#A3A39F]">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 accent-[#1A1A1A] rounded-xs cursor-pointer border-[#E5E5E1]"
                    title={isAllSelected ? 'Deselect All' : 'Select All Filtered Transfers'}
                  />
                </th>
                <th className="py-3 px-4">Request ID & PSA</th>
                <th className="py-3 px-4">Team Member Details</th>
                <th className="py-3 px-4">Arrival (Int. TKT & Time)</th>
                <th className="py-3 px-4">Departure (Int. TKT & Time)</th>
                <th className="py-3 px-4">Rate</th>
                <th className="py-3 px-4">Note</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1] text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#666662]">
                    <PlaneTakeoff className="w-8 h-8 text-[#A3A39F] mx-auto mb-2 opacity-50" />
                    <p className="font-bold text-sm text-[#1A1A1A]">No Transfer Requests Found</p>
                    <p className="text-xs text-[#A3A39F] mt-1">
                      {searchTerm || statusFilter !== 'All'
                        ? 'Try adjusting your search criteria or status filter.'
                        : 'Click "New Request Form" above to submit a new transfer request.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className={`transition-colors ${
                      selectedIds.includes(record.id)
                        ? 'bg-amber-50/70 hover:bg-amber-50'
                        : 'hover:bg-[#F9F9F8]'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <td className="py-3.5 px-3 align-top text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(record.id)}
                        onChange={() => handleToggleSelect(record.id)}
                        className="w-4 h-4 accent-[#1A1A1A] rounded-xs cursor-pointer border-[#E5E5E1] mt-1"
                      />
                    </td>
                    {/* Request ID & PSA No & Status */}
                    <td className="w-[136px] min-w-[136px] py-3.5 px-4 align-top [&>div:first-child]:w-full [&>div:first-child]:max-w-full [&>div:first-child]:whitespace-normal [&>div:first-child]:break-words [&>div:last-child]:w-full [&>div:last-child]:items-stretch [&>div:last-child>span]:w-full [&>div:last-child>span]:min-w-0 [&>div:last-child>span]:justify-start [&>div:last-child>span]:break-words">
                      {/* System Generated Request ID */}
                      <div className="font-mono font-bold text-amber-950 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-xs text-[11px] inline-flex items-center gap-1.5 shadow-2xs">
                        <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{record.requestId || `VFAR-${record.id.slice(-6).toUpperCase()}-2026`}</span>
                      </div>

                      {/* PSA No as entered */}
                      {record.psaNo && (
                        <div className="text-[11px] text-[#666662] font-mono mt-1">
                          PSA: <span className="font-bold text-[#1A1A1A]">{record.psaNo}</span>
                        </div>
                      )}

                      <div className="mt-1 flex flex-col gap-1 items-start">
                        {getStatusBadge(record.status)}

                        {/* Leg Type Badge */}
                        {record.legType === 'Outbound' || (record.requestId && record.requestId.endsWith('-DEP')) || record.psaNo.endsWith('-DEP') ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold rounded-xs">
                            <PlaneTakeoff className="w-3 h-3 text-indigo-600 shrink-0" /> Outbound
                          </span>
                        ) : record.legType === 'Inbound' || (record.requestId && record.requestId.endsWith('-RET')) || record.psaNo.endsWith('-RET') ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold rounded-xs">
                            <PlaneLanding className="w-3 h-3 text-teal-600 shrink-0" /> Inbound
                          </span>
                        ) : null}

                        {/* Linked Request Badge */}
                        {(record.linkedRequestId || record.linkedPsaNo) && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#555550] bg-[#F0F0EE] border border-[#E5E5E1] px-1.5 py-0.5 rounded-xs font-mono font-semibold" title={`Linked Request ${record.linkedRequestId || record.linkedPsaNo}`}>
                            <Link className="w-2.5 h-2.5 text-amber-700 shrink-0" /> {record.linkedRequestId || record.linkedPsaNo}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Team Member Details */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-[#1A1A1A] text-sm flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#A3A39F] shrink-0" />
                        <span>{record.fullName}</span>
                      </div>
                      <div className="text-[11px] text-[#666662] mt-0.5">
                        ID: <span className="font-mono text-[#1A1A1A] font-semibold">{record.employeeId}</span> • Position: <span className="text-[#1A1A1A]">{record.position}</span>
                        {record.department && (
                          <span className="text-[#666662] ml-1">({record.department})</span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#A3A39F] mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>NID/WP: <span className="font-mono text-[#666662]">{record.nidWpNo}</span></span>
                        {record.transport && (
                          <span className="px-1.5 py-0.2 bg-sky-100 text-sky-800 text-[9px] font-bold uppercase rounded-xs">
                            {record.transport}
                          </span>
                        )}
                        {record.leaveType && (
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-900 text-[9px] font-extrabold uppercase rounded-xs border border-purple-200">
                            Leave: {record.leaveType}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Arrival Details */}
                    <td className="py-3.5 px-4 align-top max-w-[200px]">
                      {record.arrivalDate || record.arrivalFlight ? (
                        <div>
                          {record.arrivalDate && (
                            <div className="font-semibold text-[#1A1A1A] flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#A3A39F]" />
                              <span>{record.arrivalDate}</span>
                            </div>
                          )}
                          {record.arrivalFlight && (
                            <div className="text-[11px] text-[#666662] mt-1 bg-[#F0F0EE] p-1.5 rounded-xs font-mono break-words">
                              {record.arrivalFlight}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#A3A39F] text-[11px] font-mono">—</span>
                      )}
                    </td>

                    {/* Departure Details */}
                    <td className="py-3.5 px-4 align-top max-w-[200px]">
                      {record.departureDate || record.departureFlight || record.departureTime ? (
                        <div>
                          {record.departureDate && (
                            <div className="font-semibold text-[#1A1A1A] flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#A3A39F]" />
                              <span>{record.departureDate}</span>
                            </div>
                          )}
                          {record.departureFlight && (
                            <div className="text-[11px] text-[#666662] mt-1 bg-[#F0F0EE] p-1.5 rounded-xs font-mono break-words">
                              {record.departureFlight}
                            </div>
                          )}
                          {record.departureTime && (
                            <div className="text-[10px] text-amber-900 font-bold font-mono mt-1 bg-amber-50 p-1 rounded-xs border border-amber-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Dep Time: {record.departureTime}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#A3A39F] text-[11px] font-mono">—</span>
                      )}
                    </td>

                    {/* Rate */}
                    <td className="py-3.5 px-4 align-top">
                      {record.rate === 'FOC/CIP' || record.rate === 'VIP' ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xs bg-amber-100 text-amber-900 border border-amber-300">
                          FOC/CIP
                        </span>
                      ) : record.rate === 'SUPPLIER' ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xs bg-purple-100 text-purple-900 border border-purple-300">
                          SUPPLIER
                        </span>
                      ) : record.rate === 'STAFF' ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xs bg-sky-100 text-sky-900 border border-sky-300">
                          STAFF
                        </span>
                      ) : (
                        <span className="font-bold text-[#1A1A1A]">
                          {record.rate || '—'}
                        </span>
                      )}
                    </td>

                    {/* Note */}
                    <td className="py-3.5 px-4 align-top max-w-[180px] text-[11px] text-[#666662] italic break-words">
                      {/* Preferred Flight Timing Badge - Always displayed */}
                      <div className="not-italic text-[10px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-xs mb-1.5 inline-block uppercase tracking-wider">
                        ✈️ {record.preferredFlightTiming || 'ANY'}
                      </div>
                      {record.flightDetails && (
                        <div className="not-italic text-[10px] text-[#1A1A1A] bg-[#F5F5F3] p-1.5 rounded-xs border border-[#E5E5E1] mb-1 font-mono">
                          <span className="font-bold text-[9px] text-[#888880] uppercase block font-sans">Flight Details:</span>
                          {record.flightDetails}
                        </div>
                      )}
                      {record.notes ? record.notes : !record.flightDetails && <span className="text-[#A3A39F] not-italic block mt-0.5">—</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                      {canEditModule('transferTracker') && (
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick Add Return Leg Button if Outbound with no return leg linked yet */}
                          {(record.legType === 'Outbound' || record.psaNo.endsWith('-DEP')) && !record.linkedPsaNo && (
                            <button
                              type="button"
                              onClick={() => handleAddReturnLeg(record)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold rounded-xs transition-colors flex items-center gap-1 mr-1"
                              title="Create Return Leg (Airport → Resort)"
                            >
                              <Plus className="w-3 h-3 text-amber-700" />
                              <span>Return Leg</span>
                            </button>
                          )}

                          {/* Quick Status Dropdown */}
                          <select
                            value={record.status}
                            onChange={(e) =>
                              handleStatusQuickChange(record, e.target.value as TransferStatus)
                            }
                            className="text-[10px] py-1 px-1.5 border border-[#E5E5E1] bg-white rounded-xs focus:outline-none text-[#1A1A1A] font-semibold mr-1"
                            title="Quick Change Status"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>

                          <button
                            onClick={() => handleEdit(record)}
                            className="p-1.5 text-[#666662] hover:text-[#1A1A1A] hover:bg-[#F0F0EE] rounded-xs transition-colors"
                            title="Edit Request"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(record)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xs transition-colors"
                            title="Delete Request"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Clickable Last Modified Text in Bottom Right Corner of Listing */}
                      <div className="mt-2.5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleOpenAuditLogs(record)}
                          className="text-[10px] text-[#777772] hover:text-[#1A1A1A] font-medium inline-flex items-center gap-1.5 hover:underline cursor-pointer transition-all bg-[#F5F5F3] hover:bg-amber-50 hover:border-amber-300 border border-[#E5E5E1] px-2 py-1 rounded-xs shadow-2xs group"
                          title="Click to view change logs for this request"
                        >
                          <History className="w-3 h-3 text-amber-600 shrink-0 group-hover:rotate-12 transition-transform" />
                          <span>
                            Modified: <span className="font-mono font-semibold text-[#555550]">{formatShortDate(record.updatedAt || record.createdAt)}</span> by <strong className="text-[#1A1A1A] font-bold">{record.lastModifiedBy || record.createdBy || 'System User'}</strong>
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#F9F9F8] border-t border-[#E5E5E1] flex items-center justify-between text-[11px] text-[#666662]">
          <span>Showing {filteredRecords.length} of {totalCount} transfer requests</span>
          <span className="font-semibold uppercase tracking-wider text-[#A3A39F]">Avani+ Fares Maldives Resort • Transfer Tracker</span>
        </div>
      </div>

      {/* Prepare Dhathuru Modal */}
      <PrepareDhathuruModal
        isOpen={isDhathuruModalOpen}
        onClose={() => setIsDhathuruModalOpen(false)}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recordToEdit={selectedRecord}
      />

      {/* Transfer Change Audit Log History Modal */}
      <TransferAuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        record={auditLogRecord}
      />

      {/* Daily Transfer Summary Share Modal */}
      <DailyTransferSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <TransferDeleteModal
        record={recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      {/* Bulk Edit Modal */}
      <TransferBulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedIds={selectedIds}
        focusField={bulkEditFocusField}
        onApply={handleApplyBulkEdit}
        isBulkUpdating={isBulkUpdating}
        userModifier={userModifier}
      />
    </div>
  );
};
