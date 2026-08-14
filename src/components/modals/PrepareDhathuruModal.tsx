import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../../context/PropertyContext';
import { TransferRecord } from '../../types';
import { X, Printer, FileSpreadsheet, FileText, Image as ImageIcon, Plus, Trash2, CreditCard as Edit2, Calendar, PlaneLanding, PlaneTakeoff, Ship, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, UserPlus } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';

interface PrepareDhathuruModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface DhathuruItem {
  id: string;
  type: 'Arrival' | 'Departure';
  fullName: string;
  position: string;
  department?: string;
  transport?: string;
  flightDetails: string;
  checkInTime?: string;
  checkInClose?: string;
  departureTime?: string;
  psaNo?: string;
  employeeId?: string;
  nidWpNo?: string;
  rate?: string;
  notes?: string;
}

export const PrepareDhathuruModal: React.FC<PrepareDhathuruModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data, updateTransferRecord } = useProperty();
  const printSheetRef = useRef<HTMLDivElement>(null);

  // Default target date to Tomorrow
  const getTomorrowStr = () => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    const yyyy = tom.getFullYear();
    const mm = String(tom.getMonth() + 1).padStart(2, '0');
    const dd = String(tom.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowStr());
  const [dhathuruItems, setDhathuruItems] = useState<DhathuruItem[]>([]);
  
  // State for editing an item
  const [editingItem, setEditingItem] = useState<DhathuruItem | null>(null);
  const [editTransport, setEditTransport] = useState('');
  const [editFlightDetails, setEditFlightDetails] = useState('');
  const [editCheckInTime, setEditCheckInTime] = useState('');
  const [editCheckInClose, setEditCheckInClose] = useState('');
  const [editDepartureTime, setEditDepartureTime] = useState('');

  // State for adding a new item manually
  const [showAddForm, setShowAddForm] = useState(false);
  const [addType, setAddType] = useState<'Arrival' | 'Departure'>('Arrival');
  const [addFullName, setAddFullName] = useState('');
  const [addPosition, setAddPosition] = useState('');
  const [addDepartment, setAddDepartment] = useState('');
  const [addTransport, setAddTransport] = useState('');
  const [addFlightDetails, setAddFlightDetails] = useState('');
  const [addCheckInTime, setAddCheckInTime] = useState('');
  const [addCheckInClose, setAddCheckInClose] = useState('');
  const [addDepartureTime, setAddDepartureTime] = useState('');

  const [isExportingImage, setIsExportingImage] = useState(false);

  // Reload Dhathuru list based on selected date & status === 'Completed'
  useEffect(() => {
    if (!isOpen) return;

    const allRecords = data.transferRecords || [];
    // Filter ONLY status === 'Completed'
    const completedRecords = allRecords.filter((r) => r.status === 'Completed');

    const loadedItems: DhathuruItem[] = [];

    completedRecords.forEach((r) => {
      // Check if arrival date matches target date
      if (r.arrivalDate && r.arrivalDate === selectedDate) {
        loadedItems.push({
          id: `arr-${r.id}`,
          type: 'Arrival',
          fullName: r.fullName || '',
          position: r.position || '',
          department: r.department || '',
          transport: r.transport || '',
          flightDetails: r.flightDetails || r.arrivalFlight || '',
          checkInTime: r.checkInTime || '',
          checkInClose: r.checkInClose || '',
          departureTime: r.departureTime || '',
          psaNo: r.psaNo || '',
          employeeId: r.employeeId || '',
          nidWpNo: r.nidWpNo || '',
          rate: r.rate || 'STAFF',
          notes: r.notes || '',
        });
      }

      // Check if departure date matches target date
      if (r.departureDate && r.departureDate === selectedDate) {
        loadedItems.push({
          id: `dep-${r.id}`,
          type: 'Departure',
          fullName: r.fullName || '',
          position: r.position || '',
          department: r.department || '',
          transport: r.transport || '',
          flightDetails: r.flightDetails || r.departureFlight || '',
          checkInTime: r.checkInTime || '',
          checkInClose: r.checkInClose || '',
          departureTime: r.departureTime || '',
          psaNo: r.psaNo || '',
          employeeId: r.employeeId || '',
          nidWpNo: r.nidWpNo || '',
          rate: r.rate || 'STAFF',
          notes: r.notes || '',
        });
      }
    });

    setDhathuruItems(loadedItems);
  }, [isOpen, selectedDate, data.transferRecords]);

  if (!isOpen) return null;

  const arrivalItems = dhathuruItems.filter((i) => i.type === 'Arrival');
  const departureItems = dhathuruItems.filter((i) => i.type === 'Departure');

  // Delete an item from Dhathuru sheet
  const handleDeleteItem = (id: string) => {
    setDhathuruItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Start editing an item
  const handleStartEdit = (item: DhathuruItem) => {
    setEditingItem(item);
    setEditTransport(item.transport || '');
    setEditFlightDetails(item.flightDetails || '');
    setEditCheckInTime(item.checkInTime || '');
    setEditCheckInClose(item.checkInClose || '');
    setEditDepartureTime(item.departureTime || '');
  };

  // Save edited item
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updatedTransport = editTransport.trim();
    const updatedFlightDetails = editFlightDetails.trim();
    const updatedCheckInTime = editCheckInTime.trim();
    const updatedCheckInClose = editCheckInClose.trim();
    const updatedDepartureTime = editDepartureTime.trim();

    // 1. Update local state
    setDhathuruItems((prev) =>
      prev.map((i) => {
        if (i.id === editingItem.id) {
          return {
            ...i,
            transport: updatedTransport || undefined,
            flightDetails: updatedFlightDetails,
            checkInTime: updatedCheckInTime || undefined,
            checkInClose: updatedCheckInClose || undefined,
            departureTime: updatedDepartureTime || undefined,
          };
        }
        return i;
      })
    );

    // 2. Persist to database if it's a transfer record
    if (!editingItem.id.startsWith('manual-')) {
      const realId = editingItem.id.replace(/^(arr-|dep-)/, '');
      if (realId) {
        try {
          const updates: Partial<TransferRecord> = {
            transport: updatedTransport,
            flightDetails: updatedFlightDetails,
            checkInTime: updatedCheckInTime,
            checkInClose: updatedCheckInClose,
            departureTime: updatedDepartureTime,
          };
          if (editingItem.type === 'Arrival') {
            updates.arrivalFlight = updatedFlightDetails;
          } else if (editingItem.type === 'Departure') {
            updates.departureFlight = updatedFlightDetails;
          }
          await updateTransferRecord(realId, updates);
        } catch (err) {
          console.error('Failed to update transfer record:', err);
        }
      }
    }

    setEditingItem(null);
  };

  // Add new manual record to Dhathuru sheet
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFullName.trim()) return;

    const newItem: DhathuruItem = {
      id: `manual-${Date.now()}`,
      type: addType,
      fullName: addFullName.trim(),
      position: addPosition.trim() || 'Guest / Staff',
      department: addDepartment.trim() || undefined,
      transport: addTransport.trim() || undefined,
      flightDetails: addFlightDetails.trim() || 'N/A',
      checkInTime: addCheckInTime.trim() || undefined,
      checkInClose: addCheckInClose.trim() || undefined,
      departureTime: addDepartureTime.trim() || undefined,
    };

    setDhathuruItems((prev) => [...prev, newItem]);

    // Reset form
    setAddFullName('');
    setAddPosition('');
    setAddDepartment('');
    setAddTransport('');
    setAddFlightDetails('');
    setAddCheckInTime('');
    setAddCheckInClose('');
    setAddDepartureTime('');
    setShowAddForm(false);
  };

  // --- EXPORT PDF ---
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Title & Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('AVANI+ FARES MALDIVES RESORT', 14, 15);
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'normal');
    doc.text(`DHATHURU MOVEMENT MANIFEST — DATE: ${selectedDate}`, 14, 22);

    let currentY = 28;

    // SECTION 1: ARRIVALS
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 93, 56);
    doc.text(`1. ARRIVALS SCHEDULED FOR ${selectedDate} (${arrivalItems.length})`, 14, currentY);

    const arrivalRows = arrivalItems.map((item, idx) => [
      (idx + 1).toString(),
      item.fullName,
      item.department ? `${item.position || '—'} (${item.department})` : item.position || '—',
      item.transport || '—',
      item.flightDetails || '—',
      item.checkInTime || '—',
      item.checkInClose || '—',
      item.departureTime || '—',
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [
        [
          '#',
          'Full Name',
          'Position & Department',
          'Transport Mode',
          'Flight Details',
          'Check-in - Time',
          'Check-in Close',
          'Departure Time',
        ],
      ],
      body: arrivalRows.length > 0 ? arrivalRows : [['—', 'No Completed Arrival Requests', '—', '—', '—', '—', '—', '—']],
      theme: 'grid',
      headStyles: { fillColor: [30, 93, 56], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // SECTION 2: DEPARTURES
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(158, 42, 43);
    doc.text(`2. DEPARTURES SCHEDULED FOR ${selectedDate} (${departureItems.length})`, 14, currentY);

    const departureRows = departureItems.map((item, idx) => [
      (idx + 1).toString(),
      item.fullName,
      item.department ? `${item.position || '—'} (${item.department})` : item.position || '—',
      item.transport || '—',
      item.flightDetails || '—',
      item.checkInTime || '—',
      item.checkInClose || '—',
      item.departureTime || '—',
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [
        [
          '#',
          'Full Name',
          'Position & Department',
          'Transport Mode',
          'Flight Details',
          'Check-in - Time',
          'Check-in Close',
          'Departure Time',
        ],
      ],
      body: departureRows.length > 0 ? departureRows : [['—', 'No Completed Departure Requests', '—', '—', '—', '—', '—', '—']],
      theme: 'grid',
      headStyles: { fillColor: [158, 42, 43], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(
      '* Kindly present your handbags and luggage at the jetty for weight verification by the Security team at least two hours prior to departure.',
      14,
      currentY
    );
    doc.text(
      '* All Team Members Please keep your money with you at all times and not in your Hand Luggage when travelling.',
      14,
      currentY + 5
    );

    doc.save(`Avani_Dhathuru_Movement_${selectedDate}.pdf`);
  };

  // --- EXPORT EXCEL (CSV) ---
  const exportExcel = () => {
    let csv = `AVANI+ FARES MALDIVES RESORT - DHATHURU MOVEMENT MANIFEST (${selectedDate})\n\n`;

    csv += `1. ARRIVALS (${arrivalItems.length})\n`;
    csv += `#,"Full Name","Position & Department","Transport Mode","Flight Details","Check-in - Time","Check-in Close","Departure Time"\n`;
    arrivalItems.forEach((i, idx) => {
      const posDept = i.department ? `${i.position || ''} (${i.department})` : i.position || '';
      csv += `"${idx + 1}","${i.fullName}","${posDept}","${i.transport || ''}","${i.flightDetails || ''}","${i.checkInTime || ''}","${i.checkInClose || ''}","${i.departureTime || ''}"\n`;
    });

    csv += `\n2. DEPARTURES (${departureItems.length})\n`;
    csv += `#,"Full Name","Position & Department","Transport Mode","Flight Details","Check-in - Time","Check-in Close","Departure Time"\n`;
    departureItems.forEach((i, idx) => {
      const posDept = i.department ? `${i.position || ''} (${i.department})` : i.position || '';
      csv += `"${idx + 1}","${i.fullName}","${posDept}","${i.transport || ''}","${i.flightDetails || ''}","${i.checkInTime || ''}","${i.checkInClose || ''}","${i.departureTime || ''}"\n`;
    });

    csv += `\n"* Kindly present your handbags and luggage at the jetty for weight verification by the Security team at least two hours prior to departure."\n`;
    csv += `"* All Team Members Please keep your money with you at all times and not in your Hand Luggage when travelling."\n`;

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Avani_Dhathuru_Movement_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- EXPORT PHOTO (PNG) ---
  const exportPhoto = async () => {
    if (!printSheetRef.current) return;
    setIsExportingImage(true);
    try {
      const dataUrl = await toPng(printSheetRef.current, {
        cacheBust: true,
        skipFonts: true,
        backgroundColor: '#ffffff',
        filter: (node) => {
          // Exclude delete/actions column and buttons from exported photo image
          const element = node as HTMLElement;
          if (element.tagName === 'TH' && (element.textContent?.trim().includes('Remove') || element.textContent?.trim().includes('Actions'))) {
            return false;
          }
          if (element.tagName === 'BUTTON' && (element.getAttribute('title')?.includes('Remove') || element.getAttribute('title')?.includes('Edit'))) {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Avani_Dhathuru_Movement_${selectedDate}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to export photo image:', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  // --- PRINT FUNCTION ---
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs font-sans overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white border border-[#E5E5E1] shadow-2xl rounded-xs w-full max-w-5xl my-6 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#E5E5E1] bg-[#F9F9F8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1A1A1A] text-white rounded-xs">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1A1A1A] tracking-tight uppercase">
                Prepare Dhathuru Movement Manifest
              </h2>
              <p className="text-xs text-[#666662]">
                Speedboat & transfer manifest generator for completed requests
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Target Date Picker */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-[#E5E5E1] rounded-xs shadow-2xs">
              <Calendar className="w-4 h-4 text-[#A3A39F]" />
              <label className="text-[10px] font-bold uppercase text-[#666662]">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-[#1A1A1A] focus:outline-none bg-transparent"
              />
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#666662] hover:text-[#1A1A1A] hover:bg-[#E5E5E1] rounded-xs transition-colors ml-auto sm:ml-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar (Export Options & Add Record button) */}
        <div className="px-6 py-3 border-b border-[#E5E5E1] bg-[#F0F0EE] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#666662]">
              Export Manifest Options:
            </span>

            {/* PDF Export */}
            <button
              onClick={exportPDF}
              className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] text-white font-bold rounded-xs transition-colors flex items-center gap-1.5 uppercase text-[11px] shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>Export PDF</span>
            </button>

            {/* Excel / CSV Export */}
            <button
              onClick={exportExcel}
              className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] text-white font-bold rounded-xs transition-colors flex items-center gap-1.5 uppercase text-[11px] shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Excel</span>
            </button>

            {/* Photo / Image Export */}
            <button
              onClick={exportPhoto}
              disabled={isExportingImage}
              className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] text-white font-bold rounded-xs transition-colors flex items-center gap-1.5 uppercase text-[11px] shadow-2xs disabled:opacity-50"
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>{isExportingImage ? 'Generating Image...' : 'Export Photo'}</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 border border-[#E5E5E1] bg-white hover:bg-[#E5E5E1] text-[#1A1A1A] font-bold rounded-xs transition-colors flex items-center gap-1.5 uppercase text-[11px]"
            >
              <Printer className="w-3.5 h-3.5 text-[#666662]" />
              <span>Print</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xs transition-colors flex items-center gap-1.5 uppercase text-[11px] ml-auto shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Dhathuru Entry</span>
          </button>
        </div>

        {/* Inline Add Record Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            className="mx-6 mt-4 p-4 bg-[#F9F9F8] border border-[#E5E5E1] rounded-xs space-y-3 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E1]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Add Custom Entry to Dhathuru Manifest</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-[#666662] hover:text-[#1A1A1A]"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Movement Type
                </label>
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value as 'Arrival' | 'Departure')}
                  className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-xs text-[#1A1A1A] bg-white rounded-xs focus:outline-none"
                >
                  <option value="Arrival">Arrival</option>
                  <option value="Departure">Departure</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  placeholder="eg : Mohamed Hassan"
                  className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-xs text-[#1A1A1A] bg-white rounded-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={addPosition}
                  onChange={(e) => setAddPosition(e.target.value)}
                  placeholder="eg : Executive Chef"
                  className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-xs text-[#1A1A1A] bg-white rounded-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={addDepartment}
                  onChange={(e) => setAddDepartment(e.target.value)}
                  placeholder="eg : Culinary / F&B"
                  className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-xs text-[#1A1A1A] bg-white rounded-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Transport Mode
                </label>
                <select
                  value={addTransport}
                  onChange={(e) => setAddTransport(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-xs text-[#1A1A1A] bg-white rounded-xs focus:outline-none"
                >
                  <option value="">-- Mode --</option>
                  <option value="SEAPLANE">SEAPLANE</option>
                  <option value="DOMESTIC">DOMESTIC</option>
                  <option value="SPEED BOAT">SPEED BOAT</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Flight Details
                </label>
                <input
                  type="text"
                  value={addFlightDetails}
                  onChange={(e) => setAddFlightDetails(e.target.value)}
                  placeholder="eg : EK652"
                  className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-xs text-[#1A1A1A] bg-white rounded-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Check-in - Time
                </label>
                <input
                  type="text"
                  value={addCheckInTime}
                  onChange={(e) => setAddCheckInTime(e.target.value)}
                  placeholder="eg : 08:00 AM"
                  className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-xs text-[#1A1A1A] bg-white rounded-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Check-in Close
                </label>
                <input
                  type="text"
                  value={addCheckInClose}
                  onChange={(e) => setAddCheckInClose(e.target.value)}
                  placeholder="eg : 08:45 AM"
                  className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-xs text-[#1A1A1A] bg-white rounded-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Departure Time
                </label>
                <input
                  type="text"
                  value={addDepartureTime}
                  onChange={(e) => setAddDepartureTime(e.target.value)}
                  placeholder="eg : 09:30 AM"
                  className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-xs text-[#1A1A1A] bg-white rounded-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-bold rounded-xs uppercase tracking-wider"
              >
                Add Record to Dhathuru
              </button>
            </div>
          </form>
        )}

        {/* Printable Manifest Printable Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6" id="dhathuru-printable-sheet" ref={printSheetRef}>
          {/* Manifest Header Banner */}
          <div className="p-4 bg-[#1A1A1A] text-white rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F]">
                Avani+ Fares Maldives Resort
              </div>
              <h3 className="text-lg font-bold tracking-tight uppercase">
                Dhathuru Movement Manifest — {selectedDate}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-400">
                Total Movements: {dhathuruItems.length}
              </div>
              <div className="text-[10px] text-[#A3A39F]">
                ({arrivalItems.length} Arrivals • {departureItems.length} Departures)
              </div>
            </div>
          </div>

          {/* Section 1: ALL ARRIVALS (FIRST) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E1]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-900 rounded-xs">
                  <PlaneLanding className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">
                  1. ALL ARRIVALS ({arrivalItems.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200 uppercase">
                Completed Status
              </span>
            </div>

            {arrivalItems.length === 0 ? (
              <div className="p-6 border border-dashed border-[#E5E5E1] text-center text-[#666662] rounded-xs">
                <p className="text-xs font-bold">No Completed Arrival Requests for {selectedDate}</p>
                <p className="text-[11px] text-[#A3A39F] mt-0.5">
                  Only transfer requests marked as "Completed" with arrival date {selectedDate} appear here.
                </p>
              </div>
            ) : (
              <div className="border border-[#E5E5E1] rounded-xs overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F9F9F8] border-b border-[#E5E5E1] text-[10px] font-bold uppercase tracking-widest text-[#A3A39F]">
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Position & Department</th>
                      <th className="py-2.5 px-3">Transport Mode</th>
                      <th className="py-2.5 px-3">Flight Details</th>
                      <th className="py-2.5 px-3">Check-in - Time</th>
                      <th className="py-2.5 px-3">Check-in Close</th>
                      <th className="py-2.5 px-3">Departure Time</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E1]">
                    {arrivalItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-[#F9F9F8]">
                        <td className="py-2.5 px-3 font-mono text-[#A3A39F]">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-[#1A1A1A]">{item.fullName}</td>
                        <td className="py-2.5 px-3 text-[#1A1A1A]">
                          <div className="font-medium">{item.position || '—'}</div>
                          {item.department && (
                            <span className="text-[#666662] block text-[10px]">
                              {item.department}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {item.transport ? (
                            <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-xs">
                              {item.transport}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#1A1A1A]">{item.flightDetails || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-[#1A1A1A]">{item.checkInTime || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-[#1A1A1A]">{item.checkInClose || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-[#1A1A1A]">{item.departureTime || '—'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1 text-amber-700 hover:bg-amber-100/80 rounded-xs transition-colors"
                              title="Edit Transport Mode, Flight, Check-in & Departure Times"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-xs transition-colors"
                              title="Remove from Dhathuru sheet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: ALL DEPARTURES (BELOW ARRIVALS) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E1]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-100 text-rose-900 rounded-xs">
                  <PlaneTakeoff className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">
                  2. ALL DEPARTURES ({departureItems.length})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 border border-rose-200 uppercase">
                Completed Status
              </span>
            </div>

            {departureItems.length === 0 ? (
              <div className="p-6 border border-dashed border-[#E5E5E1] text-center text-[#666662] rounded-xs">
                <p className="text-xs font-bold">No Completed Departure Requests for {selectedDate}</p>
                <p className="text-[11px] text-[#A3A39F] mt-0.5">
                  Only transfer requests marked as "Completed" with departure date {selectedDate} appear here.
                </p>
              </div>
            ) : (
              <div className="border border-[#E5E5E1] rounded-xs overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F9F9F8] border-b border-[#E5E5E1] text-[10px] font-bold uppercase tracking-widest text-[#A3A39F]">
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Position & Department</th>
                      <th className="py-2.5 px-3">Transport Mode</th>
                      <th className="py-2.5 px-3">Flight Details</th>
                      <th className="py-2.5 px-3">Check-in - Time</th>
                      <th className="py-2.5 px-3">Check-in Close</th>
                      <th className="py-2.5 px-3">Departure Time</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E1]">
                    {departureItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-[#F9F9F8]">
                        <td className="py-2.5 px-3 font-mono text-[#A3A39F]">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-[#1A1A1A]">{item.fullName}</td>
                        <td className="py-2.5 px-3 text-[#1A1A1A]">
                          <div className="font-medium">{item.position || '—'}</div>
                          {item.department && (
                            <span className="text-[#666662] block text-[10px]">
                              {item.department}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {item.transport ? (
                            <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-xs">
                              {item.transport}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#1A1A1A]">{item.flightDetails || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-[#1A1A1A]">{item.checkInTime || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-[#1A1A1A]">{item.checkInClose || '—'}</td>
                        <td className="py-2.5 px-3 font-mono text-[#1A1A1A]">{item.departureTime || '—'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1 text-amber-700 hover:bg-amber-100/80 rounded-xs transition-colors"
                              title="Edit Transport Mode, Flight, Check-in & Departure Times"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-xs transition-colors"
                              title="Remove from Dhathuru sheet"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom Mandatory Notes */}
          <div className="p-3.5 bg-[#FAF9F6] border border-[#E5E5E1] rounded-xs space-y-1.5 text-xs text-[#1A1A1A] font-medium mt-4">
            <p className="flex items-start gap-1.5">
              <span className="font-bold text-amber-700 shrink-0">*</span>
              <span>Kindly present your handbags and luggage at the jetty for weight verification by the Security team at least two hours prior to departure.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <span className="font-bold text-amber-700 shrink-0">*</span>
              <span>All Team Members Please keep your money with you at all times and not in your Hand Luggage when travelling.</span>
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#E5E5E1] bg-[#F9F9F8] flex items-center justify-between text-xs text-[#666662]">
          <span>
            Showing <strong>{dhathuruItems.length}</strong> movements ({arrivalItems.length} Arrivals, {departureItems.length} Departures)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white font-bold rounded-xs uppercase tracking-wider text-xs"
          >
            Close Manifest
          </button>
        </div>

        {/* EDIT DHATHURU ITEM OVERLAY SUB-MODAL */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-[#E5E5E1] rounded-xs shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-3.5 bg-[#1A1A1A] text-white flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Edit Movement Details
                  </h3>
                  <p className="text-[11px] text-[#A3A39F] font-medium mt-0.5">
                    {editingItem.fullName} ({editingItem.type} • {editingItem.position})
                  </p>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-white/70 hover:text-white p-1 rounded-xs transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
                {/* Transport Mode */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Transport Mode
                  </label>
                  <select
                    value={editTransport}
                    onChange={(e) => setEditTransport(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E5E1] text-xs text-[#1A1A1A] bg-white rounded-xs focus:outline-none focus:border-[#1A1A1A]"
                  >
                    <option value="">Select Transport Mode...</option>
                    <option value="SEAPLANE">SEAPLANE</option>
                    <option value="DOMESTIC">DOMESTIC</option>
                    <option value="SPEED BOAT">SPEED BOAT</option>
                  </select>
                </div>

                {/* Flight Details */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Flight Details
                  </label>
                  <input
                    type="text"
                    value={editFlightDetails}
                    onChange={(e) => setEditFlightDetails(e.target.value)}
                    placeholder="eg : EK652"
                    className="w-full px-3 py-2 border border-[#E5E5E1] text-xs text-[#1A1A1A] rounded-xs focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>

                {/* Check-in & Departure Times */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#1A1A1A] mb-1">
                      Check-in - Time
                    </label>
                    <input
                      type="text"
                      value={editCheckInTime}
                      onChange={(e) => setEditCheckInTime(e.target.value)}
                      placeholder="eg : 08:00 AM"
                      className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-xs text-[#1A1A1A] rounded-xs focus:outline-none focus:border-[#1A1A1A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#1A1A1A] mb-1">
                      Check-in Close
                    </label>
                    <input
                      type="text"
                      value={editCheckInClose}
                      onChange={(e) => setEditCheckInClose(e.target.value)}
                      placeholder="eg : 08:45 AM"
                      className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-xs text-[#1A1A1A] rounded-xs focus:outline-none focus:border-[#1A1A1A]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#1A1A1A] mb-1">
                      Departure Time
                    </label>
                    <input
                      type="text"
                      value={editDepartureTime}
                      onChange={(e) => setEditDepartureTime(e.target.value)}
                      placeholder="eg : 09:30 AM"
                      className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-xs text-[#1A1A1A] rounded-xs focus:outline-none focus:border-[#1A1A1A]"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-3 border-t border-[#E5E5E1] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 border border-[#E5E5E1] text-[#666662] hover:bg-[#F9F9F8] font-bold rounded-xs uppercase tracking-wider text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white font-bold rounded-xs uppercase tracking-wider text-[11px]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
