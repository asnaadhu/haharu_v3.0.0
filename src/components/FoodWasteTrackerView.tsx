import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { FoodWasteLog, MealServiceType, WasteReason } from '../types';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Download,
  Calendar,
  Filter,
  Trash2,
  Edit,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Coffee,
  Sun,
  Moon,
  Clock,
  PieChart as PieIcon,
  BarChart3,
  Building,
  CheckCircle2,
  X,
  Scale,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type ReportTab = 'daily-logs' | 'daily-breakdown' | 'weekly-report' | 'monthly-report';

const MEAL_SERVICES: MealServiceType[] = ['Breakfast', 'Lunch', 'Dinner', 'Night Snack / Other'];

const WASTE_REASONS: WasteReason[] = [
  'Over-preparation',
  'Plate waste',
  'Expired ingredients',
  'Quality / Cooking issue',
  'Spoilage & Storage',
  'Customer / Guest refusal',
  'Other',
];

const REASON_COLORS: Record<string, string> = {
  'Over-preparation': '#ef4444',
  'Plate waste': '#f59e0b',
  'Expired ingredients': '#8b5cf6',
  'Quality / Cooking issue': '#ec4899',
  'Spoilage & Storage': '#06b6d4',
  'Customer / Guest refusal': '#3b82f6',
  Other: '#6b7280',
};

export const FoodWasteTrackerView: React.FC = () => {
  const { data, addFoodWasteLog, updateFoodWasteLog, deleteFoodWasteLog } = useProperty();
  const { currentUser, canAccessModule } = useAuth();

  // Access control
  const hasFullAccess =
    currentUser.role === 'Admin' ||
    currentUser.role === 'Property Manager' ||
    currentUser.role === 'Staff';

  // Filters state
  const [datePreset, setDatePreset] = useState<'today' | '7days' | '30days' | 'all' | 'custom'>('7days');
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedMeal, setSelectedMeal] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reportTab, setReportTab] = useState<ReportTab>('daily-logs');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<FoodWasteLog | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formMeal, setFormMeal] = useState<MealServiceType>('Lunch');
  const [formWeightKg, setFormWeightKg] = useState<string>('');
  const [formLocation, setFormLocation] = useState<string>('Bite');
  const [formReason, setFormReason] = useState<WasteReason>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick Preset Handlers
  const handlePresetChange = (preset: 'today' | '7days' | '30days' | 'all' | 'custom') => {
    setDatePreset(preset);
    const todayStr = new Date().toISOString().split('T')[0];

    if (preset === 'today') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setFromDate(d.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setFromDate(d.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (preset === 'all') {
      setFromDate('');
      setToDate('');
    }
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const logs = data.foodWasteLogs || [];
    return logs.filter((log) => {
      // Date filter
      if (fromDate && log.date < fromDate) return false;
      if (toDate && log.date > toDate) return false;

      // Meal service filter
      if (selectedMeal !== 'all' && log.mealService !== selectedMeal) return false;

      // Search filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchLoc = log.diningHallLocation.toLowerCase().includes(q);
        const matchBy = log.loggedBy.toLowerCase().includes(q);
        const matchReason = log.wasteReason.toLowerCase().includes(q);
        const matchNotes = (log.shiftNotes || '').toLowerCase().includes(q);
        if (!matchLoc && !matchBy && !matchReason && !matchNotes) return false;
      }

      return true;
    });
  }, [data.foodWasteLogs, fromDate, toDate, selectedMeal, searchQuery]);

  // Statistics & KPI calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = (data.foodWasteLogs || []).filter((l) => l.date === todayStr);

  const todayTotalKg = todayLogs.reduce((acc, curr) => acc + (curr.weightKg || 0), 0);
  const filteredTotalKg = filteredLogs.reduce((acc, curr) => acc + (curr.weightKg || 0), 0);

  // Per-meal totals in filtered range
  const breakfastKg = filteredLogs
    .filter((l) => l.mealService === 'Breakfast')
    .reduce((a, b) => a + (b.weightKg || 0), 0);

  const lunchKg = filteredLogs
    .filter((l) => l.mealService === 'Lunch')
    .reduce((a, b) => a + (b.weightKg || 0), 0);

  const dinnerKg = filteredLogs
    .filter((l) => l.mealService === 'Dinner')
    .reduce((a, b) => a + (b.weightKg || 0), 0);

  const otherMealKg = filteredLogs
    .filter((l) => l.mealService === 'Night Snack / Other')
    .reduce((a, b) => a + (b.weightKg || 0), 0);

  // Per-meal averages
  const mealCounts = useMemo(() => {
    const counts = { Breakfast: 0, Lunch: 0, Dinner: 0, 'Night Snack / Other': 0 };
    filteredLogs.forEach((l) => {
      if (counts[l.mealService] !== undefined) {
        counts[l.mealService]++;
      }
    });
    return counts;
  }, [filteredLogs]);

  // Reason Distribution for Pie Chart & Primary Cause
  const reasonBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLogs.forEach((log) => {
      map[log.wasteReason] = (map[log.wasteReason] || 0) + log.weightKg;
    });
    return Object.entries(map).map(([reason, value]) => ({
      name: reason,
      value: Number(value.toFixed(1)),
      color: REASON_COLORS[reason] || '#6b7280',
    }));
  }, [filteredLogs]);

  const primaryCause = useMemo(() => {
    if (reasonBreakdown.length === 0) return { name: 'None', value: 0 };
    return [...reasonBreakdown].sort((a, b) => b.value - a.value)[0];
  }, [reasonBreakdown]);

  // Daily Trend Data for Charts
  const dailyChartData = useMemo(() => {
    const map: Record<string, { date: string; Breakfast: number; Lunch: number; Dinner: number; Other: number; Total: number }> = {};

    filteredLogs.forEach((log) => {
      if (!map[log.date]) {
        map[log.date] = { date: log.date, Breakfast: 0, Lunch: 0, Dinner: 0, Other: 0, Total: 0 };
      }
      const val = log.weightKg || 0;
      if (log.mealService === 'Breakfast') map[log.date].Breakfast += val;
      else if (log.mealService === 'Lunch') map[log.date].Lunch += val;
      else if (log.mealService === 'Dinner') map[log.date].Dinner += val;
      else map[log.date].Other += val;
      map[log.date].Total += val;
    });

    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        ...item,
        Breakfast: Number(item.Breakfast.toFixed(1)),
        Lunch: Number(item.Lunch.toFixed(1)),
        Dinner: Number(item.Dinner.toFixed(1)),
        Other: Number(item.Other.toFixed(1)),
        Total: Number(item.Total.toFixed(1)),
      }));
  }, [filteredLogs]);

  // Weekly Report Aggregation
  const weeklyChartData = useMemo(() => {
    const map: Record<string, { weekLabel: string; totalKg: number; count: number }> = {};

    filteredLogs.forEach((log) => {
      const d = new Date(log.date);
      // Start of week (Sunday or Monday)
      const firstDay = new Date(d.setDate(d.getDate() - d.getDay()));
      const weekKey = firstDay.toISOString().split('T')[0];
      const weekLabel = `Wk of ${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      if (!map[weekKey]) {
        map[weekKey] = { weekLabel, totalKg: 0, count: 0 };
      }
      map[weekKey].totalKg += log.weightKg || 0;
      map[weekKey].count += 1;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, v]) => ({
        week: v.weekLabel,
        TotalWasteKg: Number(v.totalKg.toFixed(1)),
        AveragePerEntry: Number((v.totalKg / (v.count || 1)).toFixed(1)),
      }));
  }, [filteredLogs]);

  // Monthly Report Aggregation
  const monthlyChartData = useMemo(() => {
    const map: Record<string, { monthLabel: string; totalKg: number; entries: number }> = {};

    filteredLogs.forEach((log) => {
      const monthKey = log.date.substring(0, 7); // YYYY-MM
      const dateObj = new Date(`${monthKey}-01`);
      const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (!map[monthKey]) {
        map[monthKey] = { monthLabel, totalKg: 0, entries: 0 };
      }
      map[monthKey].totalKg += log.weightKg || 0;
      map[monthKey].entries += 1;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, v]) => ({
        month: v.monthLabel,
        TotalKg: Number(v.totalKg.toFixed(1)),
        AvgKgPerDay: Number((v.totalKg / 30).toFixed(1)),
      }));
  }, [filteredLogs]);

  // Handle Modal Open (Create or Edit)
  const handleOpenModal = (logToEdit?: FoodWasteLog) => {
    if (logToEdit) {
      setEditingLog(logToEdit);
      setFormDate(logToEdit.date);
      setFormMeal(logToEdit.mealService);
      setFormWeightKg(logToEdit.weightKg.toString());
      setFormLocation(logToEdit.diningHallLocation || 'Bite');
      setFormReason(logToEdit.wasteReason || '');
      setFormNotes(logToEdit.shiftNotes || '');
    } else {
      setEditingLog(null);
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormMeal('Lunch');
      setFormWeightKg('');
      setFormLocation('Bite');
      setFormReason('');
      setFormNotes('');
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveWasteLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(formWeightKg);

    if (isNaN(weightNum) || weightNum <= 0) {
      setFormError('Please enter a valid waste weight in Kg (greater than 0).');
      return;
    }

    if (!formLocation.trim()) {
      setFormError('Please specify the kitchen location.');
      return;
    }

    if (!formReason.trim()) {
      setFormError('Please enter a primary cause / waste reason.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        date: formDate,
        mealService: formMeal,
        weightKg: Number(weightNum.toFixed(2)),
        diningHallLocation: formLocation.trim(),
        wasteReason: formReason.trim(),
        shiftNotes: formNotes.trim() || undefined,
        loggedBy: currentUser.name || 'Staff Member',
        loggedByUserId: currentUser.id,
        loggedByRole: currentUser.role,
      };

      if (editingLog) {
        await updateFoodWasteLog(editingLog.id, payload);
      } else {
        await addFoodWasteLog(payload);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save food waste record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await deleteFoodWasteLog(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Record ID',
      'Date',
      'Meal Service',
      'Weight (Kg)',
      'Dining Location',
      'Prepared Servings',
      'Unconsumed Servings',
      'Waste Reason',
      'Shift Notes',
      'Logged By',
      'Logged By Role',
    ];

    const rows = filteredLogs.map((log) => [
      log.id,
      log.date,
      log.mealService,
      log.weightKg.toFixed(2),
      `"${log.diningHallLocation.replace(/"/g, '""')}"`,
      log.preparedServings ?? '',
      log.unconsumedServings ?? '',
      `"${log.wasteReason.replace(/"/g, '""')}"`,
      `"${(log.shiftNotes || '').replace(/"/g, '""')}"`,
      `"${log.loggedBy.replace(/"/g, '""')}"`,
      log.loggedByRole || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `food_waste_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-[#F9F9F8] min-h-screen text-[#1A1A1A] font-sans">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E5E1]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#A3A39F] mb-1">
            <UtensilsCrossed className="w-4 h-4 text-[#1A1A1A]" />
            <span>Dining & Operations Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1A1A]">
            Food Waste Tracker
          </h1>
          <p className="text-sm text-[#666662] mt-1">
            Monitor, record, and optimize daily meal service waste across dining halls strictly in Kilograms (Kg)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white text-[#1A1A1A] border border-[#E5E5E1] rounded-xs text-xs font-semibold hover:bg-[#F0F0EE] transition-colors flex items-center gap-2 shadow-2xs"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#666662]" />
            <span>Export CSV</span>
          </button>

          {hasFullAccess ? (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-[#1A1A1A] text-white rounded-xs text-xs font-semibold hover:bg-[#333331] transition-colors flex items-center gap-2 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Log Daily Waste</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 bg-[#F0F0EE] border border-[#E5E5E1] rounded-xs text-xs text-[#666662] font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#A3A39F]" />
              <span>View Only Mode</span>
            </div>
          )}
        </div>
      </div>

      {/* Daily Meal Breakdown Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Waste Card */}
        <div className="p-5 bg-white border border-[#E5E5E1] rounded-xs shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#666662]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A3A39F]">
              Today's Waste (Kg)
            </span>
            <div className="p-2 bg-amber-50 rounded-xs text-amber-700">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1A1A]">
            {todayTotalKg.toFixed(1)} <span className="text-sm font-normal text-[#666662]">Kg</span>
          </div>
          <div className="text-xs text-[#666662] flex items-center justify-between pt-1 border-t border-[#F0F0EE]">
            <span>{todayLogs.length} service entries today</span>
            <span className="font-semibold text-amber-700">Live Today</span>
          </div>
        </div>

        {/* Total Range Waste Card */}
        <div className="p-5 bg-white border border-[#E5E5E1] rounded-xs shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#666662]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A3A39F]">
              Filtered Total (Kg)
            </span>
            <div className="p-2 bg-blue-50 rounded-xs text-blue-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1A1A]">
            {filteredTotalKg.toFixed(1)} <span className="text-sm font-normal text-[#666662]">Kg</span>
          </div>
          <div className="text-xs text-[#666662] flex items-center justify-between pt-1 border-t border-[#F0F0EE]">
            <span>Across {filteredLogs.length} records</span>
            <span className="font-semibold text-blue-700">Range Sum</span>
          </div>
        </div>

        {/* Meal Services Breakdown Card */}
        <div className="p-5 bg-white border border-[#E5E5E1] rounded-xs shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#666662]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A3A39F]">
              Meal Breakdown (Kg)
            </span>
            <div className="p-2 bg-emerald-50 rounded-xs text-emerald-700">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-1 text-center">
            <div className="p-1 bg-[#F9F9F8] rounded-2xs">
              <div className="text-[10px] text-[#A3A39F] uppercase font-bold">B-fast</div>
              <div className="text-xs font-bold text-[#1A1A1A]">{breakfastKg.toFixed(0)} Kg</div>
            </div>
            <div className="p-1 bg-[#F9F9F8] rounded-2xs">
              <div className="text-[10px] text-[#A3A39F] uppercase font-bold">Lunch</div>
              <div className="text-xs font-bold text-[#1A1A1A]">{lunchKg.toFixed(0)} Kg</div>
            </div>
            <div className="p-1 bg-[#F9F9F8] rounded-2xs">
              <div className="text-[10px] text-[#A3A39F] uppercase font-bold">Dinner</div>
              <div className="text-xs font-bold text-[#1A1A1A]">{dinnerKg.toFixed(0)} Kg</div>
            </div>
          </div>
          <div className="text-[11px] text-[#666662] flex justify-between pt-1 border-t border-[#F0F0EE]">
            <span>Night/Other: {otherMealKg.toFixed(0)} Kg</span>
            <span>4 Meal Slots</span>
          </div>
        </div>

        {/* Primary Waste Cause Card */}
        <div className="p-5 bg-white border border-[#E5E5E1] rounded-xs shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#666662]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A3A39F]">
              Primary Waste Cause
            </span>
            <div className="p-2 bg-rose-50 rounded-xs text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold tracking-tight text-[#1A1A1A] truncate">
            {primaryCause.name}
          </div>
          <div className="text-xs text-[#666662] flex items-center justify-between pt-1 border-t border-[#F0F0EE]">
            <span>{primaryCause.value.toFixed(1)} Kg loss share</span>
            <span className="font-semibold text-rose-700">Top Cause</span>
          </div>
        </div>
      </div>

      {/* Date & Filter Control Bar */}
      <div className="p-4 bg-white border border-[#E5E5E1] rounded-xs shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-[#A3A39F] uppercase tracking-wider mr-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Range:
            </span>
            <button
              onClick={() => handlePresetChange('today')}
              className={`px-3 py-1.5 rounded-xs text-xs font-medium transition-colors ${
                datePreset === 'today'
                  ? 'bg-[#1A1A1A] text-white font-bold'
                  : 'bg-[#F0F0EE] text-[#666662] hover:bg-[#E5E5E1] hover:text-[#1A1A1A]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handlePresetChange('7days')}
              className={`px-3 py-1.5 rounded-xs text-xs font-medium transition-colors ${
                datePreset === '7days'
                  ? 'bg-[#1A1A1A] text-white font-bold'
                  : 'bg-[#F0F0EE] text-[#666662] hover:bg-[#E5E5E1] hover:text-[#1A1A1A]'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handlePresetChange('30days')}
              className={`px-3 py-1.5 rounded-xs text-xs font-medium transition-colors ${
                datePreset === '30days'
                  ? 'bg-[#1A1A1A] text-white font-bold'
                  : 'bg-[#F0F0EE] text-[#666662] hover:bg-[#E5E5E1] hover:text-[#1A1A1A]'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handlePresetChange('all')}
              className={`px-3 py-1.5 rounded-xs text-xs font-medium transition-colors ${
                datePreset === 'all'
                  ? 'bg-[#1A1A1A] text-white font-bold'
                  : 'bg-[#F0F0EE] text-[#666662] hover:bg-[#E5E5E1] hover:text-[#1A1A1A]'
              }`}
            >
              All Dates
            </button>
          </div>

          {/* Custom Date Inputs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#F9F9F8] border border-[#E5E5E1] rounded-xs px-2 py-1 text-xs">
              <span className="text-[#A3A39F] font-semibold text-[10px] uppercase">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setFromDate(e.target.value);
                }}
                className="bg-transparent text-[#1A1A1A] focus:outline-hidden font-mono text-xs"
              />
            </div>
            <span className="text-[#A3A39F] text-xs">to</span>
            <div className="flex items-center gap-1.5 bg-[#F9F9F8] border border-[#E5E5E1] rounded-xs px-2 py-1 text-xs">
              <span className="text-[#A3A39F] font-semibold text-[10px] uppercase">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setToDate(e.target.value);
                }}
                className="bg-transparent text-[#1A1A1A] focus:outline-hidden font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Meal Service Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#F0F0EE]">
          {/* Meal filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-bold text-[#A3A39F] uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Service:
            </span>
            <button
              onClick={() => setSelectedMeal('all')}
              className={`px-2.5 py-1 text-xs rounded-xs font-medium transition-colors ${
                selectedMeal === 'all'
                  ? 'bg-amber-400 text-[#1A1A1A] font-bold'
                  : 'bg-[#F0F0EE] text-[#666662] hover:bg-[#E5E5E1]'
              }`}
            >
              All Meals
            </button>
            {MEAL_SERVICES.map((meal) => (
              <button
                key={meal}
                onClick={() => setSelectedMeal(meal)}
                className={`px-2.5 py-1 text-xs rounded-xs font-medium transition-colors ${
                  selectedMeal === meal
                    ? 'bg-amber-400 text-[#1A1A1A] font-bold'
                    : 'bg-[#F0F0EE] text-[#666662] hover:bg-[#E5E5E1]'
                }`}
              >
                {meal}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#A3A39F] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search location, logger, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#F9F9F8] border border-[#E5E5E1] rounded-xs text-xs text-[#1A1A1A] focus:outline-hidden focus:border-[#1A1A1A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#A3A39F] hover:text-[#1A1A1A]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Mode Tabs */}
      <div className="border-b border-[#E5E5E1] flex items-center gap-6 overflow-x-auto">
        <button
          onClick={() => setReportTab('daily-logs')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap ${
            reportTab === 'daily-logs'
              ? 'text-[#1A1A1A] border-b-2 border-[#1A1A1A]'
              : 'text-[#A3A39F] hover:text-[#1A1A1A]'
          }`}
        >
          Daily Waste Log ({filteredLogs.length})
        </button>
        <button
          onClick={() => setReportTab('daily-breakdown')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap ${
            reportTab === 'daily-breakdown'
              ? 'text-[#1A1A1A] border-b-2 border-[#1A1A1A]'
              : 'text-[#A3A39F] hover:text-[#1A1A1A]'
          }`}
        >
          Daily Meal Trend (Kg)
        </button>
        <button
          onClick={() => setReportTab('weekly-report')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap ${
            reportTab === 'weekly-report'
              ? 'text-[#1A1A1A] border-b-2 border-[#1A1A1A]'
              : 'text-[#A3A39F] hover:text-[#1A1A1A]'
          }`}
        >
          Weekly Aggregated Report
        </button>
        <button
          onClick={() => setReportTab('monthly-report')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap ${
            reportTab === 'monthly-report'
              ? 'text-[#1A1A1A] border-b-2 border-[#1A1A1A]'
              : 'text-[#A3A39F] hover:text-[#1A1A1A]'
          }`}
        >
          Monthly Waste Analytics
        </button>
      </div>

      {/* Tab 1: Detailed Daily Waste Log Table */}
      {reportTab === 'daily-logs' && (
        <div className="bg-white border border-[#E5E5E1] rounded-xs shadow-2xs overflow-hidden">
          <div className="p-4 bg-[#F9F9F8] border-b border-[#E5E5E1] flex items-center justify-between">
            <div className="text-xs font-bold text-[#A3A39F] uppercase tracking-wider">
              Recorded Service Logs
            </div>
            <div className="text-xs text-[#666662]">
              Total Range Waste: <span className="font-bold text-[#1A1A1A]">{filteredTotalKg.toFixed(1)} Kg</span>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <UtensilsCrossed className="w-10 h-10 text-[#A3A39F] mx-auto opacity-50" />
              <div className="text-base font-semibold text-[#1A1A1A]">No food waste records found</div>
              <p className="text-xs text-[#666662] max-w-sm mx-auto">
                No logs match your selected date range or search parameters. Adjust filters or click "Log Daily Waste" to create a record.
              </p>
              {hasFullAccess && (
                <button
                  onClick={() => handleOpenModal()}
                  className="px-4 py-2 bg-[#1A1A1A] text-white rounded-xs text-xs font-semibold hover:bg-[#333331] inline-flex items-center gap-2 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log First Entry</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F9F9F8] text-[#A3A39F] uppercase font-bold text-[10px] tracking-wider border-b border-[#E5E5E1]">
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Meal Service</th>
                    <th className="p-3.5 text-right">Waste Weight (Kg)</th>
                    <th className="p-3.5">Dining Location</th>
                    <th className="p-3.5">Reason & Notes</th>
                    <th className="p-3.5">Logged By</th>
                    {hasFullAccess && <th className="p-3.5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E1]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F9F9F8] transition-colors">
                      <td className="p-3.5 font-mono text-[#1A1A1A] whitespace-nowrap">
                        <div className="font-bold">{log.date}</div>
                        <div className="text-[10px] text-[#A3A39F]">
                          {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recorded'}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-semibold ${
                            log.mealService === 'Breakfast'
                              ? 'bg-amber-100 text-amber-800'
                              : log.mealService === 'Lunch'
                              ? 'bg-blue-100 text-blue-800'
                              : log.mealService === 'Dinner'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {log.mealService === 'Breakfast' && <Coffee className="w-3 h-3" />}
                          {log.mealService === 'Lunch' && <Sun className="w-3 h-3" />}
                          {log.mealService === 'Dinner' && <Moon className="w-3 h-3" />}
                          {log.mealService}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-bold font-mono text-[#1A1A1A] text-sm whitespace-nowrap">
                        {log.weightKg.toFixed(1)} <span className="text-xs font-normal text-[#666662]">Kg</span>
                      </td>

                      <td className="p-3.5 font-medium text-[#1A1A1A]">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-[#A3A39F] shrink-0" />
                          <span className="truncate max-w-[180px]">{log.diningHallLocation}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-medium text-[#1A1A1A]">{log.wasteReason}</div>
                        {log.shiftNotes && (
                          <div className="text-[10px] text-[#666662] truncate max-w-[200px]" title={log.shiftNotes}>
                            {log.shiftNotes}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-medium text-[#1A1A1A]">{log.loggedBy}</div>
                        <div className="text-[10px] text-[#A3A39F]">{log.loggedByRole || 'Staff'}</div>
                      </td>

                      {hasFullAccess && (
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenModal(log)}
                              className="p-1.5 text-[#666662] hover:text-[#1A1A1A] hover:bg-[#E5E5E1] rounded-xs transition-colors"
                              title="Edit Record"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(log.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xs transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Daily Meal Trend Chart */}
      {reportTab === 'daily-breakdown' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E5E1] p-5 rounded-xs shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A]">Daily Waste Trend by Meal Service (Kg)</h3>
                <p className="text-xs text-[#666662]">
                  Daily breakdown comparing Breakfast, Lunch, Dinner, and Night Snack services
                </p>
              </div>
              <div className="text-xs text-[#666662]">
                Total Days: <span className="font-bold text-[#1A1A1A]">{dailyChartData.length}</span>
              </div>
            </div>

            {dailyChartData.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A3A39F]">
                No daily data available in selected range.
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E1" />
                    <XAxis dataKey="date" stroke="#A3A39F" fontSize={11} tickLine={false} />
                    <YAxis stroke="#A3A39F" fontSize={11} tickLine={false} unit=" Kg" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff', borderRadius: '4px', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="Breakfast" stackId="a" fill="#f59e0b" name="Breakfast (Kg)" />
                    <Bar dataKey="Lunch" stackId="a" fill="#3b82f6" name="Lunch (Kg)" />
                    <Bar dataKey="Dinner" stackId="a" fill="#8b5cf6" name="Dinner (Kg)" />
                    <Bar dataKey="Other" stackId="a" fill="#9ca3af" name="Night/Other (Kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Weekly Aggregated Report */}
      {reportTab === 'weekly-report' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Bar Chart */}
          <div className="lg:col-span-2 bg-white border border-[#E5E5E1] p-5 rounded-xs shadow-2xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Weekly Waste Distribution</h3>
              <p className="text-xs text-[#666662]">Aggregated Kilograms of waste per calendar week</p>
            </div>

            {weeklyChartData.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A3A39F]">No weekly data available.</div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E1" />
                    <XAxis dataKey="week" stroke="#A3A39F" fontSize={11} />
                    <YAxis stroke="#A3A39F" fontSize={11} unit=" Kg" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#333', color: '#fff', borderRadius: '4px', fontSize: '12px' }}
                    />
                    <Bar dataKey="TotalWasteKg" fill="#1A1A1A" radius={[2, 2, 0, 0]} name="Total Waste (Kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Reason Breakdown Pie Chart */}
          <div className="bg-white border border-[#E5E5E1] p-5 rounded-xs shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Waste Reason Share</h3>
              <p className="text-xs text-[#666662]">Primary causes for meal loss in selected range</p>
            </div>

            {reasonBreakdown.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A3A39F]">No reason data.</div>
            ) : (
              <div className="h-56 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reasonBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {reasonBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1A1A', color: '#fff', borderRadius: '4px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-1.5 pt-2 border-t border-[#F0F0EE]">
              {reasonBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[#1A1A1A] font-medium truncate max-w-[140px]">{item.name}</span>
                  </div>
                  <span className="font-bold text-[#1A1A1A]">{item.value.toFixed(1)} Kg</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Monthly Waste Analytics */}
      {reportTab === 'monthly-report' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E5E1] p-5 rounded-xs shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A]">Monthly Overview & Multi-Month Analytics</h3>
                <p className="text-xs text-[#666662]">Long-term trends and monthly overall waste in Kg</p>
              </div>
              <div className="p-2 bg-amber-50 text-amber-800 rounded-xs text-xs font-semibold flex items-center gap-1">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Monthly Executive Report</span>
              </div>
            </div>

            {monthlyChartData.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#A3A39F]">No monthly records found.</div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E1" />
                    <XAxis dataKey="month" stroke="#A3A39F" fontSize={11} />
                    <YAxis stroke="#A3A39F" fontSize={11} unit=" Kg" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1A1A', color: '#fff', borderRadius: '4px', fontSize: '12px' }}
                    />
                    <Bar dataKey="TotalKg" fill="#f59e0b" radius={[2, 2, 0, 0]} name="Monthly Waste (Kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Log / Edit Food Waste Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white border border-[#E5E5E1] rounded-xs shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto font-sans"
          >
            <div className="p-5 bg-[#F9F9F8] border-b border-[#E5E5E1] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-[#1A1A1A]" />
                <h2 className="text-lg font-bold text-[#1A1A1A]">
                  {editingLog ? 'Edit Food Waste Record' : 'Log Daily Food Waste'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#A3A39F] hover:text-[#1A1A1A] rounded-xs"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWasteLog} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666662] mb-1">
                    Date of Waste <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2 bg-[#F9F9F8] border border-[#E5E5E1] rounded-xs text-xs font-mono focus:border-[#1A1A1A] focus:outline-hidden"
                  />
                </div>

                {/* Meal Service */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666662] mb-1">
                    Meal Service Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formMeal}
                    onChange={(e) => setFormMeal(e.target.value as MealServiceType)}
                    className="w-full p-2 bg-[#F9F9F8] border border-[#E5E5E1] rounded-xs text-xs focus:border-[#1A1A1A] focus:outline-hidden"
                  >
                    {MEAL_SERVICES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Waste Weight in Kg (Critical!) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666662] mb-1">
                  Waste Weight (Strictly in Kilograms - Kg) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 12.5"
                    value={formWeightKg}
                    onChange={(e) => setFormWeightKg(e.target.value)}
                    className="w-full p-2 pr-12 bg-[#F9F9F8] border border-[#E5E5E1] rounded-xs text-sm font-bold font-mono focus:border-[#1A1A1A] focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-[#A3A39F]">
                    Kg
                  </span>
                </div>
              </div>

              {/* Kitchen Location */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666662] mb-1">
                  Kitchen Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bite"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full p-2 bg-[#F9F9F8] border border-[#E5E5E1] rounded-xs text-xs focus:border-[#1A1A1A] focus:outline-hidden"
                />
              </div>

              {/* Primary Cause / Waste Reason */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666662] mb-1">
                  Primary Cause / Waste Reason <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Over-preparation, Expired ingredients, Spoilage, etc."
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full p-2 bg-[#F9F9F8] border border-[#E5E5E1] rounded-xs text-xs focus:border-[#1A1A1A] focus:outline-hidden"
                />
              </div>

              {/* Shift Notes */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#666662] mb-1">
                  Shift Notes / Observations
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional context e.g., weather changes, group event attendance shift, kitchen equipment notes..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2 bg-[#F9F9F8] border border-[#E5E5E1] rounded-xs text-xs focus:border-[#1A1A1A] focus:outline-hidden"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E5E1]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E5E1] rounded-xs text-xs font-semibold text-[#666662] hover:bg-[#F0F0EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1A1A1A] text-white rounded-xs text-xs font-semibold hover:bg-[#333331] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Record...' : editingLog ? 'Update Waste Record' : 'Save Waste Record'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal 2: Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white border border-[#E5E5E1] rounded-xs p-6 max-w-sm w-full space-y-4 shadow-2xl font-sans"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-full">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Delete Food Waste Log?</h3>
            </div>
            <p className="text-xs text-[#666662]">
              Are you sure you want to delete this waste log entry? This action will write an audit log entry (`FOOD_WASTE_DELETE`).
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 border border-[#E5E5E1] text-xs font-semibold rounded-xs text-[#666662] hover:bg-[#F0F0EE]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteLog(deleteConfirmId)}
                className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xs hover:bg-rose-700 transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
