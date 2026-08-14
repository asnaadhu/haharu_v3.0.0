import React, { useState, useRef } from 'react';
import { TransferRecord } from '../../types';
import { useProperty } from '../../context/PropertyContext';
import html2canvas from 'html2canvas';
import {
  X,
  PlaneTakeoff,
  PlaneLanding,
  Calendar,
  Copy,
  Check,
  Filter,
  Share2,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

interface DailyTransferSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyTransferSummaryModal: React.FC<DailyTransferSummaryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data } = useProperty();
  const contentRef = useRef<HTMLDivElement>(null);

  // Helper to calculate tomorrow's date string YYYY-MM-DD
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowDate());
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedExcel, setCopiedExcel] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);

  if (!isOpen) return null;

  const transferRecords = data.transferRecords || [];
  const employees = data.employees || [];

  // Enriches record with employee details if needed
  const getEnrichedRecord = (record: TransferRecord) => {
    const emp = employees.find(
      (e) => e.id === record.employeeId || e.employeeId === record.employeeId
    );
    return {
      id: record.id,
      staffId: record.employeeId || emp?.employeeId || '—',
      fullName: record.fullName || emp?.name || '—',
      position: record.position || emp?.position || '—',
      nidWp: record.nidWpNo || emp?.nidWp || emp?.passportNo || emp?.workPermitNo || '—',
      departureDate: record.departureDate || '—',
      arrivalDate: record.arrivalDate || '—',
      preferredFlightTiming: record.preferredFlightTiming || 'ANY',
      rate: record.rate !== undefined && record.rate !== '' ? String(record.rate) : '—',
      status: record.status || 'Pending',
      legType: record.legType || 'Outbound',
    };
  };

  // Filter records based on selected status
  const filterByStatus = (rec: TransferRecord) => {
    if (statusFilter === 'All') return true;
    return (rec.status || 'Pending').toLowerCase() === statusFilter.toLowerCase();
  };

  // Departures (DEPARTURE VFAR - MLE)
  const departures = transferRecords
    .filter((r) => {
      const isOutbound =
        r.legType === 'Outbound' ||
        (!r.legType && Boolean(r.departureDate));
      const isDateMatch = r.departureDate === selectedDate;
      return isOutbound && isDateMatch && filterByStatus(r);
    })
    .map(getEnrichedRecord);

  // Arrivals (ARRIVAL MLE - VFAR)
  const arrivals = transferRecords
    .filter((r) => {
      const isInbound =
        r.legType === 'Inbound' ||
        (!r.legType && Boolean(r.arrivalDate));
      const isDateMatch = r.arrivalDate === selectedDate;
      return isInbound && isDateMatch && filterByStatus(r);
    })
    .map(getEnrichedRecord);

  // Download Schedule as Image PNG
  const handleDownloadImage = async () => {
    if (!contentRef.current) return;
    setIsDownloadingImage(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Transfer_Schedule_${selectedDate}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating schedule image', err);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  // Copy formatted table directly for Microsoft Excel / Google Sheets
  const handleCopyExcelTable = async () => {
    let html = `
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Calibri, Arial, sans-serif;">
        <h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 10px;">DAILY TRANSFER SCHEDULE - ${selectedDate} (Status: ${statusFilter})</h3>
        
        <p style="font-size: 12pt; font-weight: bold; background-color: #dbeafe; padding: 6px; border: 1px solid #93c5fd; margin-top: 12px; margin-bottom: 4px;">
          DEPARTURE VFAR - MLE (${departures.length} Requests)
        </p>
        <table border="1" style="border-collapse: collapse; width: 100%; border: 1px solid #475569; text-align: left; font-size: 11pt;">
          <thead>
            <tr style="background-color: #e2e8f0; font-weight: bold;">
              <th style="border: 1px solid #475569; padding: 8px; font-weight: bold;">Team Member ID</th>
              <th style="border: 1px solid #475569; padding: 8px; font-weight: bold;">Full Name</th>
              <th style="border: 1px solid #475569; padding: 8px; font-weight: bold;">Position</th>
              <th style="border: 1px solid #475569; padding: 8px; font-weight: bold;">NID / WP No</th>
              <th style="border: 1px solid #475569; padding: 8px; font-weight: bold;">Departure Date</th>
              <th style="border: 1px solid #475569; padding: 8px; font-weight: bold;">Preferred Flight Timing</th>
              <th style="border: 1px solid #475569; padding: 8px; font-weight: bold;">Rate</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (departures.length === 0) {
      html += `<tr><td colspan="7" style="border: 1px solid #475569; padding: 8px; color: #64748b; font-style: italic;">No departure requests found for this date.</td></tr>`;
    } else {
      departures.forEach((d) => {
        html += `<tr>
          <td style="border: 1px solid #475569; padding: 8px;">${d.staffId}</td>
          <td style="border: 1px solid #475569; padding: 8px; font-weight: bold;">${d.fullName}</td>
          <td style="border: 1px solid #475569; padding: 8px;">${d.position}</td>
          <td style="border: 1px solid #475569; padding: 8px;">${d.nidWp}</td>
          <td style="border: 1px solid #475569; padding: 8px;">${d.departureDate}</td>
          <td style="border: 1px solid #475569; padding: 8px; font-weight: bold;">${d.preferredFlightTiming}</td>
          <td style="border: 1px solid #475569; padding: 8px; font-weight: bold;">${d.rate}</td>
        </tr>`;
      });
    }

    html += `
          </tbody>
        </table>
        <br/>
        <p style="font-size: 12pt; font-weight: bold; background-color: #e0e7ff; padding: 6px; border: 1px solid #a5b4fc; margin-top: 16px; margin-bottom: 4px;">
          ARRIVAL MLE - VFAR (${arrivals.length} Requests)
        </p>
        <table border="1" style="border-collapse: collapse; width: 100%; border: 1px solid #475569; text-align: left; font-size: 11pt;">
          <thead>
            <tr style="background-color: #e2e8f0; font-weight: bold;">
              <th style="border: 1px solid #475569; padding: 8px; font-weight: bold;">Team Member ID</th>
              <th style="border: 1px solid #475569; padding: 8px; font-weight: bold;">Full Name</th>
              <th style="border: 1px solid #475569; padding: 8px; font-weight: bold;">Position</th>
              <th style="border: 1px solid #475569; padding: 8px; font-weight: bold;">NID / WP No</th>
              <th style="border: 1px solid #475569; padding: 8px; font-weight: bold;">Arrival Date</th>
              <th style="border: 1px solid #475569; padding: 8px; font-weight: bold;">Preferred Flight Timing</th>
              <th style="border: 1px solid #475569; padding: 8px; font-weight: bold;">Rate</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (arrivals.length === 0) {
      html += `<tr><td colspan="7" style="border: 1px solid #475569; padding: 8px; color: #64748b; font-style: italic;">No arrival requests found for this date.</td></tr>`;
    } else {
      arrivals.forEach((a) => {
        html += `<tr>
          <td style="border: 1px solid #475569; padding: 8px;">${a.staffId}</td>
          <td style="border: 1px solid #475569; padding: 8px; font-weight: bold;">${a.fullName}</td>
          <td style="border: 1px solid #475569; padding: 8px;">${a.position}</td>
          <td style="border: 1px solid #475569; padding: 8px;">${a.nidWp}</td>
          <td style="border: 1px solid #475569; padding: 8px;">${a.arrivalDate}</td>
          <td style="border: 1px solid #475569; padding: 8px; font-weight: bold;">${a.preferredFlightTiming}</td>
          <td style="border: 1px solid #475569; padding: 8px; font-weight: bold;">${a.rate}</td>
        </tr>`;
      });
    }

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    // TSV plain text backup for standard pasting
    let tsv = `DAILY TRANSFER SCHEDULE - ${selectedDate} (Status: ${statusFilter})\n\n`;
    tsv += `DEPARTURE VFAR - MLE (${departures.length})\n`;
    tsv += `Team Member ID\tFull Name\tPosition\tNID / WP No\tDeparture Date\tPreferred Flight Timing\tRate\n`;
    departures.forEach((d) => {
      tsv += `${d.staffId}\t${d.fullName}\t${d.position}\t${d.nidWp}\t${d.departureDate}\t${d.preferredFlightTiming}\t${d.rate}\n`;
    });
    tsv += `\nARRIVAL MLE - VFAR (${arrivals.length})\n`;
    tsv += `Team Member ID\tFull Name\tPosition\tNID / WP No\tArrival Date\tPreferred Flight Timing\tRate\n`;
    arrivals.forEach((a) => {
      tsv += `${a.staffId}\t${a.fullName}\t${a.position}\t${a.nidWp}\t${a.arrivalDate}\t${a.preferredFlightTiming}\t${a.rate}\n`;
    });

    try {
      if (typeof ClipboardItem !== 'undefined') {
        const blobHtml = new Blob([html], { type: 'text/html' });
        const blobText = new Blob([tsv], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(tsv);
      }
      setCopiedExcel(true);
      setTimeout(() => setCopiedExcel(false), 2000);
    } catch (err) {
      console.error('Copy to Excel failed, falling back to plain text', err);
      await navigator.clipboard.writeText(tsv);
      setCopiedExcel(true);
      setTimeout(() => setCopiedExcel(false), 2000);
    }
  };

  const handleShareText = async () => {
    let text = `DAILY TRANSFER SCHEDULE - ${selectedDate} (Status: ${statusFilter})\n\n`;
    text += `=== DEPARTURE VFAR - MLE (${departures.length}) ===\n`;
    if (departures.length === 0) {
      text += `No departure requests found.\n`;
    } else {
      departures.forEach((d, idx) => {
        text += `${idx + 1}. ID: ${d.staffId} | Name: ${d.fullName} | Position: ${d.position} | NID/WP: ${d.nidWp} | Departure Date: ${d.departureDate} | Pref. Timing: ${d.preferredFlightTiming} | Rate: ${d.rate}\n`;
      });
    }

    text += `\n=== ARRIVAL MLE - VFAR (${arrivals.length}) ===\n`;
    if (arrivals.length === 0) {
      text += `No arrival requests found.\n`;
    } else {
      arrivals.forEach((a, idx) => {
        text += `${idx + 1}. ID: ${a.staffId} | Name: ${a.fullName} | Position: ${a.position} | NID/WP: ${a.nidWp} | Arrival Date: ${a.arrivalDate} | Pref. Timing: ${a.preferredFlightTiming} | Rate: ${a.rate}\n`;
      });
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Daily Transfer Schedule - ${selectedDate}`,
          text: text,
        });
        return;
      } catch (e) {
        console.log('Share canceled or failed, fallback to copy', e);
      }
    }

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#1A1A1A]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-sans">
      <div className="bg-white border border-[#E5E5E1] shadow-2xl rounded-xs w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E1] bg-[#FAF9F5] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xs bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-800">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1A1A1A] tracking-tight">
                Share Transfer Schedule
              </h2>
              <p className="text-xs text-[#777772]">
                Daily departures & arrivals for selected date and status
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Copy Table for Excel Button */}
            <button
              type="button"
              onClick={handleCopyExcelTable}
              className="px-3 py-1.5 border border-emerald-600 text-xs font-extrabold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Copy formatted table for pasting into Microsoft Excel or Google Sheets"
            >
              {copiedExcel ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />}
              <span>{copiedExcel ? 'Table Copied!' : 'Copy Table for Excel'}</span>
            </button>

            {/* Download Image Button */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isDownloadingImage}
              className="px-3 py-1.5 border border-amber-300 text-xs font-extrabold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              title="Download schedule image as PNG"
            >
              <Download className="w-3.5 h-3.5 text-amber-700" />
              <span>{isDownloadingImage ? 'Generating Image...' : 'Download Image'}</span>
            </button>

            {/* Share / Copy Text */}
            <button
              type="button"
              onClick={handleShareText}
              className="px-3 py-1.5 border border-[#E5E5E1] text-xs font-bold text-[#1A1A1A] bg-white hover:bg-[#F5F5F3] rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Share or copy schedule text"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Text Copied!' : 'Copy Text'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#777772] hover:text-[#1A1A1A] hover:bg-[#F5F5F3] rounded-xs transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 bg-[#F5F5F3] border-b border-[#E5E5E1] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">
                Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-[#E5E5E1] text-xs text-[#1A1A1A] bg-white rounded-xs font-mono font-bold focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            {/* Quick Date Shortcuts */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayDate())}
                className={`px-2.5 py-1 text-xs font-bold rounded-xs border cursor-pointer transition-colors ${
                  selectedDate === getTodayDate()
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-white text-[#555550] border-[#E5E5E1] hover:bg-[#FAF9F5]'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(getTomorrowDate())}
                className={`px-2.5 py-1 text-xs font-bold rounded-xs border cursor-pointer transition-colors ${
                  selectedDate === getTomorrowDate()
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-white text-[#555550] border-[#E5E5E1] hover:bg-[#FAF9F5]'
                }`}
              >
                Tomorrow
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 ml-2 border-l border-[#E5E5E1] pl-3">
              <Filter className="w-3.5 h-3.5 text-[#777772]" />
              <label className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-[#E5E5E1] text-xs text-[#1A1A1A] bg-white rounded-xs font-bold focus:outline-none focus:border-[#1A1A1A]"
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="All">All Statuses</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-[#777772] font-medium">
            Total Requests: <strong className="text-[#1A1A1A] font-extrabold">{departures.length + arrivals.length}</strong>
          </div>
        </div>

        {/* Content Body (Captured by html2canvas for image download) */}
        <div ref={contentRef} className="p-6 overflow-y-auto space-y-8 flex-1 bg-white">
          <div className="hidden border-b border-[#E5E5E1] pb-3 mb-4 print:block">
            <h1 className="text-lg font-extrabold text-[#1A1A1A]">
              DAILY TRANSFER SCHEDULE - {selectedDate}
            </h1>
            <p className="text-xs text-[#666660]">Status: {statusFilter}</p>
          </div>

          {/* SECTION 1: DEPARTURE VFAR - MLE */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-purple-300">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-xs bg-purple-100 text-purple-700 flex items-center justify-center">
                  <PlaneTakeoff className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-purple-950 uppercase tracking-wider">
                  DEPARTURE VFAR - MLE
                </h3>
                <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                  {departures.length}
                </span>
              </div>
            </div>

            {departures.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[#E5E5E1] bg-[#FAF9F5] rounded-xs text-xs text-[#888880] italic">
                No departure requests found for {selectedDate} ({statusFilter} status).
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#E5E5E1] rounded-xs shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5F5F3] border-b border-[#E5E5E1] text-[#1A1A1A] uppercase text-[10px] tracking-wider font-extrabold">
                      <th className="py-2.5 px-3 font-extrabold border-r border-[#E5E5E1]/60">Team Member ID</th>
                      <th className="py-2.5 px-3 font-extrabold border-r border-[#E5E5E1]/60">Full Name</th>
                      <th className="py-2.5 px-3 font-extrabold border-r border-[#E5E5E1]/60">Position</th>
                      <th className="py-2.5 px-3 font-extrabold border-r border-[#E5E5E1]/60">NID / WP No</th>
                      <th className="py-2.5 px-3 font-extrabold border-r border-[#E5E5E1]/60">Departure Date</th>
                      <th className="py-2.5 px-3 font-extrabold border-r border-[#E5E5E1]/60">Preferred Flight Timing</th>
                      <th className="py-2.5 px-3 font-extrabold">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E1]">
                    {departures.map((d, index) => (
                      <tr key={d.id || index} className="hover:bg-[#FAF9F5] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1A1A1A] border-r border-[#E5E5E1]/40">{d.staffId}</td>
                        <td className="py-2.5 px-3 font-extrabold text-[#1A1A1A] border-r border-[#E5E5E1]/40">{d.fullName}</td>
                        <td className="py-2.5 px-3 text-[#444440] font-medium border-r border-[#E5E5E1]/40">{d.position}</td>
                        <td className="py-2.5 px-3 font-mono text-[#444440] border-r border-[#E5E5E1]/40">{d.nidWp}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1A1A1A] border-r border-[#E5E5E1]/40">{d.departureDate}</td>
                        <td className="py-2.5 px-3 border-r border-[#E5E5E1]/40">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-950 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-xs uppercase tracking-wider">
                            ✈️ {d.preferredFlightTiming}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-900 bg-amber-50/40">{d.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 2: ARRIVAL MLE - VFAR */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-indigo-300">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-xs bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <PlaneLanding className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-indigo-950 uppercase tracking-wider">
                  ARRIVAL MLE - VFAR
                </h3>
                <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                  {arrivals.length}
                </span>
              </div>
            </div>

            {arrivals.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[#E5E5E1] bg-[#FAF9F5] rounded-xs text-xs text-[#888880] italic">
                No arrival requests found for {selectedDate} ({statusFilter} status).
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#E5E5E1] rounded-xs shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5F5F3] border-b border-[#E5E5E1] text-[#1A1A1A] uppercase text-[10px] tracking-wider font-extrabold">
                      <th className="py-2.5 px-3 font-extrabold border-r border-[#E5E5E1]/60">Team Member ID</th>
                      <th className="py-2.5 px-3 font-extrabold border-r border-[#E5E5E1]/60">Full Name</th>
                      <th className="py-2.5 px-3 font-extrabold border-r border-[#E5E5E1]/60">Position</th>
                      <th className="py-2.5 px-3 font-extrabold border-r border-[#E5E5E1]/60">NID / WP No</th>
                      <th className="py-2.5 px-3 font-extrabold border-r border-[#E5E5E1]/60">Arrival Date</th>
                      <th className="py-2.5 px-3 font-extrabold border-r border-[#E5E5E1]/60">Preferred Flight Timing</th>
                      <th className="py-2.5 px-3 font-extrabold">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E1]">
                    {arrivals.map((a, index) => (
                      <tr key={a.id || index} className="hover:bg-[#FAF9F5] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1A1A1A] border-r border-[#E5E5E1]/40">{a.staffId}</td>
                        <td className="py-2.5 px-3 font-extrabold text-[#1A1A1A] border-r border-[#E5E5E1]/40">{a.fullName}</td>
                        <td className="py-2.5 px-3 text-[#444440] font-medium border-r border-[#E5E5E1]/40">{a.position}</td>
                        <td className="py-2.5 px-3 font-mono text-[#444440] border-r border-[#E5E5E1]/40">{a.nidWp}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1A1A1A] border-r border-[#E5E5E1]/40">{a.arrivalDate}</td>
                        <td className="py-2.5 px-3 border-r border-[#E5E5E1]/40">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-950 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-xs uppercase tracking-wider">
                            ✈️ {a.preferredFlightTiming}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-900 bg-amber-50/40">{a.rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E5E5E1] bg-[#FAF9F5] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#E5E5E1] text-xs font-extrabold text-[#1A1A1A] bg-white hover:bg-[#F5F5F3] rounded-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
