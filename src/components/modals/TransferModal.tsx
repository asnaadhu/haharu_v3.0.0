import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import { TransferRecord, TransferStatus } from '../../types';
import { X, PlaneTakeoff, PlaneLanding, Repeat, Link, Save, AlertCircle, UserCheck, Sparkles, Search } from 'lucide-react';
import { calculateCheckInTimes } from '../../utils/timeUtils';

export const DEPARTMENT_OPTIONS = [
  'Engineering',
  'Executive Office',
  'F&B Kitchen',
  'F&B Service',
  'Finance',
  'Front Office',
  'Housekeeping',
  'IT',
  'Kids Club',
  'People & Culture',
  'Recreation',
  'Reservations',
  'Sales & Marketing',
  'Security',
  'Spa',
  'Aquafanatics',
];

export const TRANSPORT_OPTIONS = ['SEAPLANE', 'DOMESTIC', 'SPEED BOAT'];
export const LEAVE_TYPE_OPTIONS = ['DO', 'AL', 'BT', 'R&R'];

const cleanPersonName = (rawName: string | undefined | null): string => {
  if (!rawName) return '';
  // Remove parenthetical role info like "(Admin)", "(Housing Manager)", "(Staff)" etc.
  return rawName.replace(/\s*\([^)]*\)/g, '').trim();
};

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit?: TransferRecord | null;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  recordToEdit,
}) => {
  const { data, addTransferRecord, updateTransferRecord } = useProperty();
  const { currentUser } = useAuth();

  const [psaNo, setPsaNo] = useState('');
  const [tripType, setTripType] = useState<'ROUND_TRIP' | 'OUTBOUND' | 'INBOUND'>('ROUND_TRIP');
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [position, setPosition] = useState('');
  const [departmentSelect, setDepartmentSelect] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [transport, setTransport] = useState('');
  const [nidWpNo, setNidWpNo] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [arrivalFlight, setArrivalFlight] = useState('');
  const [departureFlight, setDepartureFlight] = useState('');
  const [flightDetails, setFlightDetails] = useState('');
  const [preferredFlightTiming, setPreferredFlightTiming] = useState('ANY');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkInClose, setCheckInClose] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<TransferStatus>('Pending');
  const [showFlightTickets, setShowFlightTickets] = useState(false);

  const [matchedNotice, setMatchedNotice] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compile database of previous travelers across transferRecords, users, and bed assignments
  const travelerDatabase = useMemo(() => {
    const map = new Map<string, {
      employeeId: string;
      fullName: string;
      position: string;
      department: string;
      nidWpNo: string;
    }>();

    // 1. From past Transfer Records (most recent records)
    if (data?.transferRecords) {
      [...data.transferRecords].reverse().forEach((tr) => {
        if (tr.employeeId && tr.employeeId.trim()) {
          const key = tr.employeeId.trim().toLowerCase();
          if (!map.has(key)) {
            map.set(key, {
              employeeId: tr.employeeId.trim(),
              fullName: cleanPersonName(tr.fullName),
              position: tr.position || '',
              department: tr.department || '',
              nidWpNo: tr.nidWpNo || '',
            });
          }
        }
      });
    }

    // 2. From UserProfiles
    if (data?.users) {
      data.users.forEach((u) => {
        if (u.employeeId && u.employeeId.trim()) {
          const key = u.employeeId.trim().toLowerCase();
          const existing = map.get(key);
          map.set(key, {
            employeeId: u.employeeId.trim(),
            fullName: cleanPersonName(u.name) || existing?.fullName || '',
            position: existing?.position || 'Staff',
            department: u.department || existing?.department || '',
            nidWpNo: existing?.nidWpNo || '',
          });
        }
      });
    }

    // 3. From Bed Assignments
    if (data?.beds) {
      data.beds.forEach((b) => {
        if (b.assignedTo?.employeeId && b.assignedTo.employeeId.trim()) {
          const key = b.assignedTo.employeeId.trim().toLowerCase();
          const existing = map.get(key);
          map.set(key, {
            employeeId: b.assignedTo.employeeId.trim(),
            fullName: cleanPersonName(b.assignedTo.fullName) || existing?.fullName || '',
            position: b.assignedTo.position || existing?.position || '',
            department: b.assignedTo.department || existing?.department || '',
            nidWpNo: b.assignedTo.nationalId || b.assignedTo.workPermit || b.assignedTo.passport || existing?.nidWpNo || '',
          });
        }
      });
    }

    return Array.from(map.values());
  }, [data]);

  const applyTravelerData = (person: {
    employeeId: string;
    fullName: string;
    position: string;
    department?: string;
    nidWpNo?: string;
  }) => {
    const cleanedName = cleanPersonName(person.fullName);
    if (person.employeeId) setEmployeeId(person.employeeId);
    if (cleanedName) setFullName(cleanedName);
    if (person.position) setPosition(person.position);
    if (person.nidWpNo) setNidWpNo(person.nidWpNo);

    const dept = person.department || '';
    if (!dept) {
      setDepartmentSelect('');
      setCustomDepartment('');
    } else if (DEPARTMENT_OPTIONS.includes(dept)) {
      setDepartmentSelect(dept);
      setCustomDepartment('');
    } else {
      setDepartmentSelect('CUSTOM');
      setCustomDepartment(dept);
    }

    setMatchedNotice(`Matched record for ID #${person.employeeId} (${cleanedName}). Auto-filled details.`);
  };

  const handleEmployeeIdInputChange = (val: string) => {
    setEmployeeId(val);
    setMatchedNotice('');

    if (!val.trim()) {
      setShowSuggestions(false);
      return;
    }

    const query = val.trim().toLowerCase();
    const exactMatch = travelerDatabase.find((t) => t.employeeId.toLowerCase() === query);

    if (exactMatch && !recordToEdit) {
      applyTravelerData(exactMatch);
      setShowSuggestions(false);
    } else {
      setShowSuggestions(true);
    }
  };

  const handleFullNameInputChange = (val: string) => {
    setFullName(val);
    if (!val.trim()) {
      setShowSuggestions(false);
      return;
    }
    setShowSuggestions(true);
  };

  const handleDepartureTimeChange = (val: string) => {
    setDepartureTime(val);
    const calculated = calculateCheckInTimes(val);
    if (calculated) {
      setCheckInTime(calculated.checkInTime);
      setCheckInClose(calculated.checkInClose);
    }
  };

  const filteredSuggestions = useMemo(() => {
    if (!employeeId.trim() && !fullName.trim()) return [];
    const empQ = employeeId.trim().toLowerCase();
    const nameQ = fullName.trim().toLowerCase();

    return travelerDatabase.filter((t) => {
      const empMatch = empQ && t.employeeId.toLowerCase().includes(empQ);
      const nameMatch = nameQ && t.fullName.toLowerCase().includes(nameQ);
      return empMatch || nameMatch;
    }).slice(0, 6);
  }, [employeeId, fullName, travelerDatabase]);

  useEffect(() => {
    setMatchedNotice('');
    setShowSuggestions(false);

    if (recordToEdit) {
      setPsaNo(recordToEdit.psaNo || '');
      if (recordToEdit.legType === 'Inbound') {
        setTripType('INBOUND');
      } else if (recordToEdit.legType === 'Outbound') {
        setTripType('OUTBOUND');
      } else {
        setTripType('OUTBOUND');
      }
      setFullName(cleanPersonName(recordToEdit.fullName) || '');
      setEmployeeId(recordToEdit.employeeId || '');
      setPosition(recordToEdit.position || '');
      setTransport(recordToEdit.transport || '');
      setNidWpNo(recordToEdit.nidWpNo || '');
      setLeaveType(recordToEdit.leaveType || '');
      setArrivalDate(recordToEdit.arrivalDate || '');
      setDepartureDate(recordToEdit.departureDate || '');
      setArrivalFlight(recordToEdit.arrivalFlight || '');
      setDepartureFlight(recordToEdit.departureFlight || '');
      setFlightDetails(recordToEdit.flightDetails || '');
      setPreferredFlightTiming(recordToEdit.preferredFlightTiming || 'ANY');
      setCheckInTime(recordToEdit.checkInTime || '');
      setCheckInClose(recordToEdit.checkInClose || '');
      setDepartureTime(recordToEdit.departureTime || '');
      setRate(recordToEdit.rate?.toString() || '');
      setNotes(recordToEdit.notes || '');
      setStatus(recordToEdit.status || 'Pending');
      setShowFlightTickets(Boolean(recordToEdit.arrivalFlight || recordToEdit.departureFlight));

      const dept = recordToEdit.department || '';
      if (!dept) {
        setDepartmentSelect('');
        setCustomDepartment('');
      } else if (DEPARTMENT_OPTIONS.includes(dept)) {
        setDepartmentSelect(dept);
        setCustomDepartment('');
      } else {
        setDepartmentSelect('CUSTOM');
        setCustomDepartment(dept);
      }
    } else {
      // Clear PSA No for new request
      setPsaNo('');
      setTripType('ROUND_TRIP');
      setFullName('');
      setEmployeeId('');
      setPosition('');
      setDepartmentSelect('');
      setCustomDepartment('');
      setTransport('');
      setNidWpNo('');
      setLeaveType('');
      setArrivalDate('');
      setDepartureDate('');
      setArrivalFlight('');
      setDepartureFlight('');
      setFlightDetails('');
      setPreferredFlightTiming('ANY');
      setCheckInTime('');
      setCheckInClose('');
      setDepartureTime('');
      setRate('');
      setNotes('');
      setStatus('Pending');
      setShowFlightTickets(false);
    }
    setErrorMsg('');
  }, [recordToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!employeeId.trim()) {
      setErrorMsg('Team Member ID is required.');
      return;
    }
    if (!position.trim()) {
      setErrorMsg('Position / Job Title is required.');
      return;
    }
    if (departmentSelect === 'CUSTOM' && !customDepartment.trim()) {
      setErrorMsg('Please specify the custom department name.');
      return;
    }
    if (!nidWpNo.trim()) {
      setErrorMsg('NID/WP No is required.');
      return;
    }
    if (!rate.trim()) {
      setErrorMsg('Rate is required.');
      return;
    }

    const finalDepartment =
      departmentSelect === 'CUSTOM'
        ? customDepartment.trim()
        : departmentSelect.trim();

    setIsSubmitting(true);
    try {
      if (recordToEdit) {
        await updateTransferRecord(recordToEdit.id, {
          psaNo: psaNo.trim(),
          fullName: fullName.trim(),
          employeeId: employeeId.trim(),
          position: position.trim(),
          department: finalDepartment,
          transport: transport.trim(),
          nidWpNo: nidWpNo.trim(),
          leaveType: leaveType.trim(),
          legType: tripType === 'INBOUND' ? 'Inbound' : tripType === 'OUTBOUND' ? 'Outbound' : 'One-Way',
          arrivalDate: arrivalDate.trim(),
          departureDate: departureDate.trim(),
          arrivalFlight: arrivalFlight.trim(),
          departureFlight: departureFlight.trim(),
          flightDetails: flightDetails.trim(),
          preferredFlightTiming: preferredFlightTiming || 'ANY',
          checkInTime: checkInTime.trim(),
          checkInClose: checkInClose.trim(),
          departureTime: departureTime.trim(),
          rate: rate.trim(),
          notes: notes.trim(),
          status,
          lastModifiedBy: currentUser?.name || currentUser?.email || 'System User',
        });
      } else {
        const random6Digit = Math.floor(100000 + Math.random() * 900000);
        const currentYear = new Date().getFullYear();
        const baseRequestId = `VFAR-${random6Digit}-${currentYear}`;
        const userPsa = psaNo.trim();
        const userModifier = currentUser?.name || currentUser?.email || 'System User';

        if (tripType === 'ROUND_TRIP') {
          const outboundReqId = `${baseRequestId}-DEP`;
          const inboundReqId = `${baseRequestId}-RET`;

          // 1. Outbound Leg (Departure: Resort -> Airport)
          await addTransferRecord({
            requestId: outboundReqId,
            linkedRequestId: inboundReqId,
            psaNo: userPsa,
            linkedPsaNo: userPsa,
            fullName: fullName.trim(),
            employeeId: employeeId.trim(),
            position: position.trim(),
            department: finalDepartment,
            transport: transport.trim(),
            nidWpNo: nidWpNo.trim(),
            leaveType: leaveType.trim(),
            legType: 'Outbound',
            tripGroupId: baseRequestId,
            departureDate: departureDate.trim(),
            departureFlight: departureFlight.trim(),
            flightDetails: flightDetails.trim(),
            preferredFlightTiming: preferredFlightTiming || 'ANY',
            checkInTime: checkInTime.trim(),
            checkInClose: checkInClose.trim(),
            departureTime: departureTime.trim(),
            rate: rate.trim(),
            notes: notes.trim(),
            status,
            createdBy: userModifier,
            lastModifiedBy: userModifier,
          });

          // 2. Inbound Leg (Return: Airport -> Resort)
          await addTransferRecord({
            requestId: inboundReqId,
            linkedRequestId: outboundReqId,
            psaNo: userPsa,
            linkedPsaNo: userPsa,
            fullName: fullName.trim(),
            employeeId: employeeId.trim(),
            position: position.trim(),
            department: finalDepartment,
            transport: transport.trim(),
            nidWpNo: nidWpNo.trim(),
            leaveType: leaveType.trim(),
            legType: 'Inbound',
            tripGroupId: baseRequestId,
            arrivalDate: arrivalDate.trim(),
            arrivalFlight: arrivalFlight.trim(),
            flightDetails: flightDetails.trim(),
            preferredFlightTiming: preferredFlightTiming || 'ANY',
            rate: rate.trim(),
            notes: notes.trim(),
            status: 'Pending', // Stays Pending until staff member returns
            createdBy: userModifier,
            lastModifiedBy: userModifier,
          });
        } else {
          await addTransferRecord({
            requestId: baseRequestId,
            psaNo: userPsa,
            fullName: fullName.trim(),
            employeeId: employeeId.trim(),
            position: position.trim(),
            department: finalDepartment,
            transport: transport.trim(),
            nidWpNo: nidWpNo.trim(),
            leaveType: leaveType.trim(),
            legType: tripType === 'INBOUND' ? 'Inbound' : 'Outbound',
            arrivalDate: arrivalDate.trim(),
            departureDate: departureDate.trim(),
            arrivalFlight: arrivalFlight.trim(),
            departureFlight: departureFlight.trim(),
            flightDetails: flightDetails.trim(),
            preferredFlightTiming: preferredFlightTiming || 'ANY',
            checkInTime: checkInTime.trim(),
            checkInClose: checkInClose.trim(),
            departureTime: departureTime.trim(),
            rate: rate.trim(),
            notes: notes.trim(),
            status,
            createdBy: userModifier,
            lastModifiedBy: userModifier,
          });
        }
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save transfer request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white border border-[#E5E5E1] shadow-2xl rounded-xs w-full max-w-2xl my-8 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5E5E1] flex items-center justify-between bg-[#F9F9F8]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1A1A1A] text-white rounded-xs">
              <PlaneTakeoff className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A1A1A] tracking-tight">
                {recordToEdit ? 'Edit Transfer Request' : 'New Transfer Request Form'}
              </h2>
              <p className="text-xs text-[#666662]">
                Fill in team member travel details, flight ticket timings, and transfer rates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#666662] hover:text-[#1A1A1A] hover:bg-[#E5E5E1] rounded-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Transfer Type & Leg Structure Selector */}
          {!recordToEdit && (
            <div className="p-3 bg-[#F9F9F8] border border-[#E5E5E1] rounded-xs space-y-2">
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center justify-between">
                <span>Transfer Structure</span>
                <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600 shrink-0" /> Strategy 3: Auto Leg Split
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTripType('ROUND_TRIP')}
                  className={`px-3 py-2 text-xs font-bold rounded-xs border text-left flex flex-col gap-1 transition-all ${
                    tripType === 'ROUND_TRIP'
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                      : 'bg-white text-[#666662] border-[#E5E5E1] hover:border-[#1A1A1A]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Repeat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>🔄 Round Trip</span>
                  </div>
                  <span className="text-[10px] font-normal opacity-80 leading-tight">
                    Auto-creates 2 linked legs (Outbound & Inbound)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTripType('OUTBOUND')}
                  className={`px-3 py-2 text-xs font-bold rounded-xs border text-left flex flex-col gap-1 transition-all ${
                    tripType === 'OUTBOUND'
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                      : 'bg-white text-[#666662] border-[#E5E5E1] hover:border-[#1A1A1A]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <PlaneTakeoff className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>🛫 Outbound Only</span>
                  </div>
                  <span className="text-[10px] font-normal opacity-80 leading-tight">
                    Departure: Resort → Airport
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTripType('INBOUND')}
                  className={`px-3 py-2 text-xs font-bold rounded-xs border text-left flex flex-col gap-1 transition-all ${
                    tripType === 'INBOUND'
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                      : 'bg-white text-[#666662] border-[#E5E5E1] hover:border-[#1A1A1A]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <PlaneLanding className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>🛬 Inbound Only</span>
                  </div>
                  <span className="text-[10px] font-normal opacity-80 leading-tight">
                    Return: Airport → Resort
                  </span>
                </button>
              </div>

              {tripType === 'ROUND_TRIP' && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xs text-[11px] leading-relaxed flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Automatic Round-Trip Leg Split:</strong>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[10px] text-emerald-900 font-medium">
                      <li><strong>Outbound Leg (VFAR-XXXXXX-YYYY-DEP)</strong>: Resort → Airport (Tracked for departure)</li>
                      <li><strong>Inbound Return Leg (VFAR-XXXXXX-YYYY-RET)</strong>: Airport → Resort (Remains Pending until return!)</li>
                      <li className="text-emerald-950 font-bold mt-0.5">Note: Your PSA No remains unchanged. System Request ID is generated on submit.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Row 1: PSA No & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                PSA No
              </label>
              <input
                type="text"
                value={psaNo}
                onChange={(e) => setPsaNo(e.target.value)}
                placeholder="eg : PSA-2026-001"
                className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A] rounded-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TransferStatus)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] rounded-xs"
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Matched Record Banner */}
          {matchedNotice && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xs text-xs flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{matchedNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setMatchedNotice('')}
                className="text-emerald-600 hover:text-emerald-900 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Row 2: Full Name & Team Member ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => handleFullNameInputChange(e.target.value)}
                placeholder="eg : Ahmed Asnad"
                className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] rounded-xs"
                required
              />
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Team Member ID <span className="text-rose-600">*</span>
                </label>
                {travelerDatabase.length > 0 && (
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Auto-fill enabled
                  </span>
                )}
              </div>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => handleEmployeeIdInputChange(e.target.value)}
                onFocus={() => {
                  if (employeeId.trim() || fullName.trim()) setShowSuggestions(true);
                }}
                placeholder="eg : 30034"
                className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] rounded-xs"
                required
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E5E5E1] shadow-xl rounded-xs z-50 max-h-48 overflow-y-auto">
                  <div className="px-3 py-1.5 bg-[#F9F9F8] border-b border-[#E5E5E1] text-[10px] font-bold text-[#666662] uppercase tracking-wider flex items-center justify-between">
                    <span>Matched Previous Travelers ({filteredSuggestions.length})</span>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-[#666662] hover:text-[#1A1A1A]"
                    >
                      Close
                    </button>
                  </div>
                  {filteredSuggestions.map((person) => (
                    <button
                      key={person.employeeId + person.fullName}
                      type="button"
                      onClick={() => {
                        applyTravelerData(person);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-amber-50/80 border-b border-[#E5E5E1]/50 last:border-0 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#1A1A1A] group-hover:text-amber-900">
                          {person.fullName}
                        </div>
                        <div className="text-[11px] text-[#666662] flex items-center gap-2 mt-0.5">
                          <span className="font-mono bg-[#E5E5E1]/60 px-1 py-0.2 rounded-2xs text-[#1A1A1A] text-[10px]">
                            ID: {person.employeeId}
                          </span>
                          <span>{person.position}</span>
                          {person.department && <span>• {person.department}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-700 font-bold opacity-0 group-hover:opacity-100 uppercase tracking-wider shrink-0 ml-2">
                        Select & Fill
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Position & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                Position <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="eg : IT Manager"
                className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] rounded-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={departmentSelect}
                onChange={(e) => setDepartmentSelect(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] rounded-xs"
              >
                <option value="">-- Select Department --</option>
                {DEPARTMENT_OPTIONS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
                <option value="CUSTOM">+ Other / Custom Department...</option>
              </select>

              {departmentSelect === 'CUSTOM' && (
                <input
                  type="text"
                  value={customDepartment}
                  onChange={(e) => setCustomDepartment(e.target.value)}
                  placeholder="Enter custom department name..."
                  className="w-full mt-2 px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] rounded-xs bg-[#F9F9F8]"
                  required
                />
              )}
            </div>
          </div>

          {/* Row 4: NID / WP No, Transport & Leave Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                NID / WP No <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={nidWpNo}
                onChange={(e) => setNidWpNo(e.target.value)}
                placeholder="eg : A289124 / WP-88192"
                className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] rounded-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                Transport Mode
              </label>
              <select
                value={transport}
                onChange={(e) => setTransport(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] rounded-xs"
              >
                <option value="">-- Select Transport --</option>
                {TRANSPORT_OPTIONS.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                Leave Type
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] rounded-xs font-medium"
              >
                <option value="">-- Select Leave Type --</option>
                {LEAVE_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Arrival Date & Departure Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                Arrival Date
              </label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] rounded-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                Departure Date
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] rounded-xs"
              />
            </div>
          </div>

          {/* Preferred Flight Timing & Flight Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                Preferred Flight Timing
              </label>
              <select
                value={preferredFlightTiming}
                onChange={(e) => setPreferredFlightTiming(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] rounded-xs font-medium"
              >
                <option value="ANY">ANY</option>
                <option value="MORNING FLIGHT">MORNING FLIGHT</option>
                <option value="AFTERNOON FLIGHT">AFTERNOON FLIGHT</option>
                <option value="LAST FLIGHT">LAST FLIGHT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                Flight Details
              </label>
              <input
                type="text"
                value={flightDetails}
                onChange={(e) => setFlightDetails(e.target.value)}
                placeholder="eg : NR1234"
                className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] rounded-xs"
              />
            </div>
          </div>

          {/* Check-in & Departure Times */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                  Check-in - Time
                </label>
                <input
                  type="text"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  placeholder="eg : 08:00 AM"
                  className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] rounded-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                  Check-in Close
                </label>
                <input
                  type="text"
                  value={checkInClose}
                  onChange={(e) => setCheckInClose(e.target.value)}
                  placeholder="eg : 08:45 AM"
                  className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] rounded-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                  Departure Time
                </label>
                <input
                  type="text"
                  value={departureTime}
                  onChange={(e) => handleDepartureTimeChange(e.target.value)}
                  placeholder="eg : 09:30 AM"
                  className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] rounded-xs"
                />
              </div>
            </div>
            <div className="text-[10px] text-[#A3A39F] flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Updating Departure Time auto-fills Check-in Time (-2h) and Check-in Close (-1h).</span>
            </div>
          </div>

          {/* Rate */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
              Rate <span className="text-rose-600">*</span>
            </label>
            <select
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] rounded-xs font-medium"
              required
            >
              <option value="">-- Select Rate Option --</option>
              <option value="STAFF">STAFF</option>
              <option value="FOC/CIP">FOC/CIP</option>
              <option value="SUPPLIER">SUPPLIER</option>
              {rate && !['STAFF', 'FOC/CIP', 'SUPPLIER'].includes(rate) && (
                <option value={rate}>{rate}</option>
              )}
            </select>
          </div>

          {/* Toggle Checkbox for International Ticket & Time */}
          <div className="pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={showFlightTickets}
                onChange={(e) => {
                  setShowFlightTickets(e.target.checked);
                  if (!e.target.checked) {
                    setArrivalFlight('');
                    setDepartureFlight('');
                  }
                }}
                className="w-4 h-4 text-[#1A1A1A] border-[#E5E5E1] rounded focus:ring-0 cursor-pointer accent-[#1A1A1A]"
              />
              <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                Include International Flight Ticket & Time
              </span>
            </label>
          </div>

          {showFlightTickets && (
            <div className="space-y-4 p-3.5 bg-[#FAF9F6] border border-[#E5E5E1] rounded-xs transition-all">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                  Arrival From Int. TKT & Time
                </label>
                <input
                  type="text"
                  value={arrivalFlight}
                  onChange={(e) => setArrivalFlight(e.target.value)}
                  placeholder="eg : EK652 @ 14:30 / MLE -> Resort"
                  className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] rounded-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
                  Departure from Int. TKT & Time
                </label>
                <input
                  type="text"
                  value={departureFlight}
                  onChange={(e) => setDepartureFlight(e.target.value)}
                  placeholder="eg : EK653 @ 22:15 / Resort -> MLE"
                  className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] rounded-xs"
                />
              </div>
            </div>
          )}

          {/* Row 7: Note */}
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1">
              Note
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="eg : Onsite IT infrastructure audit & maintenance notes"
              className="w-full px-3 py-2 border border-[#E5E5E1] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] rounded-xs resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E5E5E1] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#666662] hover:bg-[#F0F0EE] rounded-xs transition-colors uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-bold rounded-xs transition-colors uppercase tracking-wider flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : recordToEdit ? 'Update Request' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
