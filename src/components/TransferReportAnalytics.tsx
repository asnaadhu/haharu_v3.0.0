import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  PlaneTakeoff,
  PlaneLanding,
  Ship,
  Plane,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Layers,
  Sparkles,
  MapPin,
  Calendar,
  Ticket,
} from 'lucide-react';
import { TransferRecord } from '../types';

interface TransferReportAnalyticsProps {
  transferRecords: Array<{
    id: string;
    psaNo: string;
    fullName: string;
    employeeId: string;
    position: string;
    department: string;
    transport: string;
    nidWpNo: string;
    arrivalDate: string;
    departureDate: string;
    arrivalFlight: string;
    departureFlight: string;
    flightDetails: string;
    checkInTime: string;
    checkInClose: string;
    departureTime: string;
    rate: string;
    notes: string;
    status: string;
    createdAt: string;
  }>;
}

const COLORS = {
  seaplane: '#0EA5E9', // Sky blue
  domestic: '#8B5CF6', // Purple
  speedboat: '#10B981', // Emerald
  other: '#F59E0B', // Amber
  pending: '#F59E0B',
  completed: '#10B981',
  cancelled: '#EF4444',
};

export const TransferReportAnalytics: React.FC<TransferReportAnalyticsProps> = ({
  transferRecords,
}) => {
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [chartType, setChartType] = useState<'all' | 'transport' | 'pipeline' | 'timeline' | 'department'>('all');
  const [timelineMode, setTimelineMode] = useState<'arrival' | 'departure'>('arrival');

  // Filter records based on local analytics filter
  const analyticsRecords = useMemo(() => {
    if (selectedMode === 'all') return transferRecords;
    return transferRecords.filter(
      (r) => r.transport.toUpperCase() === selectedMode.toUpperCase()
    );
  }, [transferRecords, selectedMode]);

  // KPI Metrics
  const totalCount = analyticsRecords.length;
  const pendingCount = analyticsRecords.filter((r) => r.status === 'Pending').length;
  const completedCount = analyticsRecords.filter((r) => r.status === 'Completed').length;
  const cancelledCount = analyticsRecords.filter((r) => r.status === 'Cancelled').length;

  const ticketsLoggedCount = analyticsRecords.filter(
    (r) => r.arrivalFlight !== '-' || r.departureFlight !== '-'
  ).length;

  // 1. Transport Mode Data for Pie Chart
  const transportData = useMemo(() => {
    const counts: Record<string, number> = {
      SEAPLANE: 0,
      DOMESTIC: 0,
      'SPEED BOAT': 0,
      OTHER: 0,
    };

    analyticsRecords.forEach((r) => {
      const mode = (r.transport || 'OTHER').toUpperCase();
      if (counts[mode] !== undefined) {
        counts[mode]++;
      } else {
        counts['OTHER']++;
      }
    });

    return [
      { name: 'Seaplane', value: counts['SEAPLANE'], color: COLORS.seaplane },
      { name: 'Domestic Flight', value: counts['DOMESTIC'], color: COLORS.domestic },
      { name: 'Speed Boat', value: counts['SPEED BOAT'], color: COLORS.speedboat },
      ...(counts['OTHER'] > 0
        ? [{ name: 'Other Transport', value: counts['OTHER'], color: COLORS.other }]
        : []),
    ].filter((item) => item.value > 0);
  }, [analyticsRecords]);

  // 2. Status Distribution Data for Bar Chart
  const statusData = useMemo(() => {
    return [
      { name: 'Pending', count: pendingCount, fill: COLORS.pending },
      { name: 'Completed', count: completedCount, fill: COLORS.completed },
      { name: 'Cancelled', count: cancelledCount, fill: COLORS.cancelled },
    ];
  }, [pendingCount, completedCount, cancelledCount]);

  // 3. Timeline Trend Data (By Date)
  const timelineData = useMemo(() => {
    const map: Record<string, { date: string; arrivals: number; departures: number }> = {};

    analyticsRecords.forEach((r) => {
      const dateKey =
        timelineMode === 'arrival'
          ? r.arrivalDate !== '-'
            ? r.arrivalDate
            : r.createdAt
          : r.departureDate !== '-'
          ? r.departureDate
          : r.createdAt;

      if (!dateKey || dateKey === '-') return;

      if (!map[dateKey]) {
        map[dateKey] = { date: dateKey, arrivals: 0, departures: 0 };
      }

      if (r.arrivalDate !== '-') map[dateKey].arrivals++;
      if (r.departureDate !== '-') map[dateKey].departures++;
    });

    const sorted = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-14); // Last 14 active travel dates
  }, [analyticsRecords, timelineMode]);

  // 4. Department Distribution Data
  const departmentData = useMemo(() => {
    const counts: Record<string, number> = {};
    analyticsRecords.forEach((r) => {
      const dept = r.department || 'Unassigned';
      counts[dept] = (counts[dept] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([dept, count]) => ({ department: dept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [analyticsRecords]);

  return (
    <div className="bg-[#F9F9F8] border border-[#E5E5E1] p-5 space-y-6 font-sans">
      {/* Header & Graph Filter Options */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E5E1]">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-[#1A1A1A]">
              Transfer Analytics & Route Schematics
            </h3>
            <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
              Dynamic Visualizer
            </span>
          </div>
          <p className="text-xs text-[#666662] mt-0.5">
            Real-time movement metrics, transport mode breakdown, and travel workflow schematics
          </p>
        </div>

        {/* Analytics Filter Options Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Transport Mode Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E5E1] px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#A3A39F]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#666662]">
              Transport:
            </span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="font-bold text-[#1A1A1A] bg-transparent focus:outline-none text-xs"
            >
              <option value="all">All Modes</option>
              <option value="SEAPLANE">Seaplane Only</option>
              <option value="DOMESTIC">Domestic Flight Only</option>
              <option value="SPEED BOAT">Speed Boat Only</option>
            </select>
          </div>

          {/* View Filter Toggle */}
          <div className="flex items-center bg-white border border-[#E5E5E1] p-0.5 text-xs font-bold">
            <button
              onClick={() => setChartType('all')}
              className={`px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors ${
                chartType === 'all'
                  ? 'bg-[#1A1A1A] text-white shadow-2xs'
                  : 'text-[#666662] hover:text-[#1A1A1A]'
              }`}
            >
              All Views
            </button>
            <button
              onClick={() => setChartType('pipeline')}
              className={`px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors ${
                chartType === 'pipeline'
                  ? 'bg-[#1A1A1A] text-white shadow-2xs'
                  : 'text-[#666662] hover:text-[#1A1A1A]'
              }`}
            >
              Schematics
            </button>
            <button
              onClick={() => setChartType('transport')}
              className={`px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors ${
                chartType === 'transport'
                  ? 'bg-[#1A1A1A] text-white shadow-2xs'
                  : 'text-[#666662] hover:text-[#1A1A1A]'
              }`}
            >
              Transport
            </button>
            <button
              onClick={() => setChartType('timeline')}
              className={`px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors ${
                chartType === 'timeline'
                  ? 'bg-[#1A1A1A] text-white shadow-2xs'
                  : 'text-[#666662] hover:text-[#1A1A1A]'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setChartType('department')}
              className={`px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors ${
                chartType === 'department'
                  ? 'bg-[#1A1A1A] text-white shadow-2xs'
                  : 'text-[#666662] hover:text-[#1A1A1A]'
              }`}
            >
              Departments
            </button>
          </div>
        </div>
      </div>

      {/* Analytics KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 border border-[#E5E5E1] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#A3A39F] block">
            Filtered Transfers
          </span>
          <div className="text-xl font-bold text-[#1A1A1A] mt-1">{totalCount}</div>
          <span className="text-[10px] text-[#666662] mt-0.5 block">Active scope</span>
        </div>

        <div className="bg-white p-3 border border-[#E5E5E1] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Pending
          </span>
          <div className="text-xl font-bold text-amber-900 mt-1">{pendingCount}</div>
          <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">
            Awaiting action
          </span>
        </div>

        <div className="bg-white p-3 border border-[#E5E5E1] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Completed
          </span>
          <div className="text-xl font-bold text-emerald-900 mt-1">{completedCount}</div>
          <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
            Arrived & completed
          </span>
        </div>

        <div className="bg-white p-3 border border-[#E5E5E1] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
            Cancelled
          </span>
          <div className="text-xl font-bold text-rose-900 mt-1">{cancelledCount}</div>
          <span className="text-[10px] text-rose-700 font-semibold mt-0.5 block">
            Voided requests
          </span>
        </div>
      </div>

      {/* WORKFLOW PIPELINE & ROUTE SCHEMATICS */}
      {(chartType === 'all' || chartType === 'pipeline') && (
        <div className="space-y-4">
          <div className="bg-white p-5 border border-[#E5E5E1] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-600" />
                  Transfer Lifecycle Pipeline Schematic
                </h4>
                <p className="text-[11px] text-[#666662]">
                  Interactive movement workflow stages from request filing to completion
                </p>
              </div>
              <div className="text-[11px] font-mono text-[#666662] font-bold">
                Total System Scope: {totalCount} Records
              </div>
            </div>

            {/* Pipeline Workflow Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
              {/* Stage 1 */}
              <div className="bg-[#FAF9F6] border border-[#E5E5E1] p-3.5 relative rounded-xs hover:border-amber-400 transition-colors">
                <div className="flex items-center justify-between text-amber-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <span>1. Pending</span>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-2xl font-black text-amber-900">{pendingCount}</div>
                <div className="text-[10px] text-[#666662] mt-1 font-medium">
                  {totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}% of active
                </div>
                <div className="w-full bg-[#E5E5E1] h-1 mt-2">
                  <div
                    className="bg-amber-500 h-full"
                    style={{ width: `${totalCount > 0 ? (pendingCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Stage 2 */}
              <div className="bg-[#F0FDF4] border border-[#E5E5E1] p-3.5 relative rounded-xs hover:border-emerald-400 transition-colors">
                <div className="flex items-center justify-between text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <span>2. Completed</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-2xl font-black text-emerald-900">{completedCount}</div>
                <div className="text-[10px] text-[#666662] mt-1 font-medium">
                  {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}% of active
                </div>
                <div className="w-full bg-[#E5E5E1] h-1 mt-2">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Stage 3 */}
              <div className="bg-[#FFF1F2] border border-[#E5E5E1] p-3.5 relative rounded-xs hover:border-rose-400 transition-colors">
                <div className="flex items-center justify-between text-rose-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <span>3. Cancelled</span>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="text-2xl font-black text-rose-900">{cancelledCount}</div>
                <div className="text-[10px] text-[#666662] mt-1 font-medium">
                  {totalCount > 0 ? Math.round((cancelledCount / totalCount) * 100) : 0}% of active
                </div>
                <div className="w-full bg-[#E5E5E1] h-1 mt-2">
                  <div
                    className="bg-rose-500 h-full"
                    style={{ width: `${totalCount > 0 ? (cancelledCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Hub-to-Property Route Schematic Map Card */}
            <div className="bg-[#F5F5F3] border border-[#E5E5E1] p-4 space-y-3">
              <div className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                Transport Mode Route Schematic Connections
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Seaplane Hub */}
                <div className="bg-white p-3 border border-[#E5E5E1] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-xs">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1A1A1A]">Seaplane Terminal Hub</div>
                      <div className="text-[10px] text-[#666662]">Velana Int'l Seaplane Docks</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-sky-700">
                      {analyticsRecords.filter((r) => r.transport.toUpperCase() === 'SEAPLANE').length}
                    </div>
                    <div className="text-[9px] uppercase font-bold text-[#A3A39F]">Pass. Volume</div>
                  </div>
                </div>

                {/* Domestic Hub */}
                <div className="bg-white p-3 border border-[#E5E5E1] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xs">
                      <PlaneTakeoff className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1A1A1A]">Domestic Flight Terminal</div>
                      <div className="text-[10px] text-[#666662]">Dharavandhoo / Maamigili Regional</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-purple-700">
                      {analyticsRecords.filter((r) => r.transport.toUpperCase() === 'DOMESTIC').length}
                    </div>
                    <div className="text-[9px] uppercase font-bold text-[#A3A39F]">Pass. Volume</div>
                  </div>
                </div>

                {/* Speed Boat Hub */}
                <div className="bg-white p-3 border border-[#E5E5E1] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xs">
                      <Ship className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1A1A1A]">Speed Boat Harbor</div>
                      <div className="text-[10px] text-[#666662]">Male' Airport Jetty & Resort Dock</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-700">
                      {analyticsRecords.filter((r) => r.transport.toUpperCase() === 'SPEED BOAT').length}
                    </div>
                    <div className="text-[9px] uppercase font-bold text-[#A3A39F]">Pass. Volume</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Transport Mode Share (Pie Chart) */}
        {(chartType === 'all' || chartType === 'transport') && (
          <div className="bg-white p-5 border border-[#E5E5E1] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-sky-600" />
                  Transport Mode Distribution
                </h4>
                <p className="text-[11px] text-[#666662]">
                  Ratio of Seaplane vs Domestic Flight vs Speedboat transfers
                </p>
              </div>
            </div>

            {transportData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#A3A39F]">
                No transport data available for current filters
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={transportData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {transportData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`${val} Transfers`, 'Volume']}
                      contentStyle={{
                        backgroundColor: '#1A1A1A',
                        color: '#FFF',
                        fontSize: '11px',
                        borderRadius: '2px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* CHART 2: Transfer Status Breakdown (Bar Chart) */}
        {(chartType === 'all' || chartType === 'transport') && (
          <div className="bg-white p-5 border border-[#E5E5E1] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  Transfer Status Counts
                </h4>
                <p className="text-[11px] text-[#666662]">
                  Total record volume categorized by current operational status
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EE" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#666662' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#666662' }} />
                  <Tooltip
                    formatter={(val: number) => [`${val} Records`, 'Status Count']}
                    contentStyle={{
                      backgroundColor: '#1A1A1A',
                      color: '#FFF',
                      fontSize: '11px',
                      borderRadius: '2px',
                    }}
                  />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-status-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CHART 3: Timeline Trend (Area Chart) */}
        {(chartType === 'all' || chartType === 'timeline') && (
          <div className="bg-white p-5 border border-[#E5E5E1] shadow-2xs space-y-3 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Movement Timeline & Daily Travel Volume
                </h4>
                <p className="text-[11px] text-[#666662]">
                  Arrivals vs Departures trend grouped by date
                </p>
              </div>

              {/* Timeline Mode Toggle */}
              <div className="flex items-center gap-1 bg-[#F5F5F3] p-1 border border-[#E5E5E1] text-[10px] font-bold">
                <span className="text-[#666662] px-1">Grouping:</span>
                <button
                  onClick={() => setTimelineMode('arrival')}
                  className={`px-2 py-0.5 uppercase ${
                    timelineMode === 'arrival'
                      ? 'bg-emerald-700 text-white'
                      : 'text-[#666662] hover:text-[#1A1A1A]'
                  }`}
                >
                  Arrival Date
                </button>
                <button
                  onClick={() => setTimelineMode('departure')}
                  className={`px-2 py-0.5 uppercase ${
                    timelineMode === 'departure'
                      ? 'bg-purple-700 text-white'
                      : 'text-[#666662] hover:text-[#1A1A1A]'
                  }`}
                >
                  Departure Date
                </button>
              </div>
            </div>

            {timelineData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-[#A3A39F]">
                No travel dates available for selected timeline range
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorArrivals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDepartures" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EE" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666662' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#666662' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1A1A',
                        color: '#FFF',
                        fontSize: '11px',
                        borderRadius: '2px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="arrivals"
                      name="Arrival Movements"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorArrivals)"
                    />
                    <Area
                      type="monotone"
                      dataKey="departures"
                      name="Departure Movements"
                      stroke="#8B5CF6"
                      fillOpacity={1}
                      fill="url(#colorDepartures)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* CHART 4: Department Movement Volume */}
        {(chartType === 'all' || chartType === 'department') && (
          <div className="bg-white p-5 border border-[#E5E5E1] shadow-2xs space-y-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-700" />
                  Department Transfer Requests Breakdown
                </h4>
                <p className="text-[11px] text-[#666662]">
                  Top requesting departments and staff transfer counts
                </p>
              </div>
            </div>

            {departmentData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-[#A3A39F]">
                No department records found
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0EE" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#666662' }} />
                    <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: '#666662' }} width={90} />
                    <Tooltip
                      formatter={(val: number) => [`${val} Transfers`, 'Volume']}
                      contentStyle={{
                        backgroundColor: '#1A1A1A',
                        color: '#FFF',
                        fontSize: '11px',
                        borderRadius: '2px',
                      }}
                    />
                    <Bar dataKey="count" fill="#D97706" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
