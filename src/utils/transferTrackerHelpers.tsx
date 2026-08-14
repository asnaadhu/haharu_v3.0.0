import React from 'react';
import { TransferRecord, TransferStatus } from '../types';

export type DateFilterType = 'travel' | 'arrival' | 'departure' | 'created';
export type ActivePreset = 'today' | 'tomorrow' | 'next7Days' | 'custom' | 'none';

export const formatShortDate = (isoString?: string) => {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
};

export const getDateFilterLabel = (type: string) => {
  switch (type) {
    case 'arrival':
      return 'Arrival Date';
    case 'departure':
      return 'Departure Date';
    case 'created':
      return 'Creation Date';
    case 'travel':
    default:
      return 'Travel Date (Arrival or Departure)';
  }
};

export const getPresetDateRange = (
  preset: 'today' | 'tomorrow' | 'next7Days' | 'clear'
): { startDate: string; endDate: string; activePreset: ActivePreset } => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  if (preset === 'clear') {
    return { startDate: '', endDate: '', activePreset: 'none' };
  }

  if (preset === 'today') {
    return { startDate: todayStr, endDate: todayStr, activePreset: 'today' };
  }

  if (preset === 'tomorrow') {
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    return { startDate: tomorrowStr, endDate: tomorrowStr, activePreset: 'tomorrow' };
  }

  if (preset === 'next7Days') {
    const future = new Date();
    future.setDate(today.getDate() + 7);
    return { startDate: todayStr, endDate: future.toISOString().split('T')[0], activePreset: 'next7Days' };
  }

  return { startDate: '', endDate: '', activePreset: 'none' };
};

export const getStatusBadge = (status: TransferStatus) => {
  switch (status) {
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Completed
        </span>
      );
    case 'Cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-xs bg-rose-50 text-rose-800 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          Cancelled
        </span>
      );
    case 'Pending':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-xs bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending
        </span>
      );
  }
};

export const exportTransferCSV = (records: TransferRecord[]) => {
  if (records.length === 0) return;
  const headers = [
    'Request ID',
    'PSA No',
    'Full Name',
    'Team Member ID',
    'Position',
    'Department',
    'Transport',
    'NID/WP No',
    'Leave Type',
    'Leg Type',
    'Arrival Date',
    'Arrival Ticket & Time',
    'Departure Date',
    'Departure Ticket & Time',
    'Preferred Flight Timing',
    'Rate',
    'Status',
    'Notes',
  ];

  const rows = records.map((r) => [
    `"${r.requestId || ''}"`,
    `"${r.psaNo || ''}"`,
    `"${r.fullName || ''}"`,
    `"${r.employeeId || ''}"`,
    `"${r.position || ''}"`,
    `"${r.department || ''}"`,
    `"${r.transport || ''}"`,
    `"${r.nidWpNo || ''}"`,
    `"${r.leaveType || ''}"`,
    `"${r.legType || ''}"`,
    `"${r.arrivalDate || ''}"`,
    `"${r.arrivalFlight || ''}"`,
    `"${r.departureDate || ''}"`,
    `"${r.departureFlight || ''}"`,
    `"${r.preferredFlightTiming || 'ANY'}"`,
    `"${r.rate || ''}"`,
    `"${r.status || 'Pending'}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `Avani_Transfer_Tracker_${new Date().toISOString().split('T')[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
