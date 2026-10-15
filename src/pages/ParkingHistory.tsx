import React, { useState, useMemo } from 'react';
import { useParking } from '../context/ParkingContext';
import { useToast } from '../context/ToastContext';
import { ParkingHistoryRecord, VehicleType, ZoneId } from '../types/parking';
import { quickSort, mergeSort } from '../data-structures/Algorithms';
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  getVehicleTypeLabel,
} from '../utils/formatters';
import {
  History,
  Search,
  ArrowUpDown,
  Download,
  Trash2,
  DollarSign,
  Clock,
  Car,
  Filter,
} from 'lucide-react';

export const ParkingHistory: React.FC = () => {
  const { history, clearAllHistory } = useParking();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<
    'exitTimeDesc' | 'exitTimeAsc' | 'durationDesc' | 'durationAsc' | 'feeDesc' | 'feeAsc' | 'plateAsc'
  >('exitTimeDesc');

  // Filter records
  const filteredRecords = useMemo(() => {
    return history.filter((record) => {
      if (selectedType !== 'ALL' && record.vehicleType !== selectedType) {
        return false;
      }
      if (selectedZone !== 'ALL' && record.zone !== selectedZone) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toUpperCase();
        return (
          record.vehiclePlate.includes(q) ||
          record.ticketId.includes(q) ||
          record.slotId.includes(q)
        );
      }
      return true;
    });
  }, [history, selectedType, selectedZone, searchQuery]);

  // Sort records using custom QuickSort / MergeSort implementation
  const sortedRecords = useMemo(() => {
    const list = [...filteredRecords];

    switch (sortBy) {
      case 'exitTimeDesc':
        return quickSort(list, (a, b) => b.exitTime - a.exitTime);
      case 'exitTimeAsc':
        return quickSort(list, (a, b) => a.exitTime - b.exitTime);
      case 'durationDesc':
        return mergeSort(list, (a, b) => b.durationMinutes - a.durationMinutes);
      case 'durationAsc':
        return mergeSort(list, (a, b) => a.durationMinutes - b.durationMinutes);
      case 'feeDesc':
        return quickSort(list, (a, b) => b.totalFee - a.totalFee);
      case 'feeAsc':
        return quickSort(list, (a, b) => a.totalFee - b.totalFee);
      case 'plateAsc':
        return mergeSort(list, (a, b) => a.vehiclePlate.localeCompare(b.vehiclePlate));
      default:
        return list;
    }
  }, [filteredRecords, sortBy]);

  // Aggregate statistics
  const totalRevenue = useMemo(() => {
    return sortedRecords.reduce((sum, r) => sum + r.totalFee, 0);
  }, [sortedRecords]);

  const avgDurationMinutes = useMemo(() => {
    if (sortedRecords.length === 0) return 0;
    const total = sortedRecords.reduce((sum, r) => sum + r.durationMinutes, 0);
    return Math.round(total / sortedRecords.length);
  }, [sortedRecords]);

  // Export to CSV
  const handleExportCSV = () => {
    if (sortedRecords.length === 0) {
      showToast('warning', 'No Records', 'There are no records to export.');
      return;
    }

    const headers = [
      'Ticket ID',
      'Vehicle Plate',
      'Vehicle Category',
      'Bay ID',
      'Zone',
      'Entry Time',
      'Exit Time',
      'Duration (Mins)',
      'Hourly Rate ($)',
      'Total Fee ($)',
      'Payment Method',
      'Payment Status',
    ];

    const csvRows = sortedRecords.map((r) => [
      `"${r.ticketId}"`,
      `"${r.vehiclePlate}"`,
      `"${r.vehicleType}"`,
      `"${r.slotId}"`,
      `"${r.zone}"`,
      `"${new Date(r.entryTime).toISOString()}"`,
      `"${new Date(r.exitTime).toISOString()}"`,
      r.durationMinutes,
      r.hourlyRate.toFixed(2),
      r.totalFee.toFixed(2),
      `"${r.paymentMethod}"`,
      `"${r.paymentStatus}"`,
    ]);

    const csvContent = [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ParkPulse_History_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'CSV Exported', 'Parking history file downloaded successfully.');
  };

  const handleClear = () => {
    if (window.confirm('Clear all recorded parking history logs? This cannot be undone.')) {
      clearAllHistory();
      showToast('info', 'History Cleared', 'Parking transaction history has been cleared.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Parking Transaction History & Audit Log
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              QuickSort & MergeSort
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete audit trail with timestamps, allocated bays, dwell duration, and calculated tariffs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Log
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Vehicles Logged</span>
            <Car className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{sortedRecords.length}</div>
          <p className="text-xs text-slate-400 mt-0.5">Sessions recorded</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Collected Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{formatCurrency(totalRevenue)}</div>
          <p className="text-xs text-slate-400 mt-0.5">Total parking fees</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase">Avg Stay Duration</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600">{formatDuration(avgDurationMinutes)}</div>
          <p className="text-xs text-slate-400 mt-0.5">Turnover dwell time</p>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plate number, ticket ID, or bay..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Vehicle Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="FOUR_WHEELER">Four-Wheeler</option>
            <option value="TWO_WHEELER">Two-Wheeler</option>
            <option value="EV_FOUR_WHEELER">EV Four-Wheeler</option>
            <option value="ACCESSIBLE">Accessible</option>
          </select>

          {/* Zone Filter */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Zones</option>
            <option value="A">Zone A</option>
            <option value="B">Zone B</option>
            <option value="C">Zone C</option>
            <option value="D">Zone D</option>
          </select>
        </div>

        {/* Custom Sorting Selector */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200 rounded-xl cursor-pointer"
          >
            <option value="exitTimeDesc">Exit Time (Latest First)</option>
            <option value="exitTimeAsc">Exit Time (Oldest First)</option>
            <option value="durationDesc">Duration (Longest First)</option>
            <option value="durationAsc">Duration (Shortest First)</option>
            <option value="feeDesc">Fee (Highest First)</option>
            <option value="feeAsc">Fee (Lowest First)</option>
            <option value="plateAsc">Plate Number (A - Z)</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {sortedRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <p className="text-base font-semibold text-slate-700">No parking history records found.</p>
            <p className="text-xs">Completed vehicle exits will automatically appear here with duration and fee breakdowns.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Vehicle Plate</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Allocated Bay</th>
                  <th className="py-3 px-4">Entry Time</th>
                  <th className="py-3 px-4">Exit Time</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Tariff</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRecords.map((r) => (
                  <tr key={r.ticketId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                      {r.ticketId}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {r.vehiclePlate}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      {getVehicleTypeLabel(r.vehicleType)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold font-mono text-xs border border-blue-200">
                        {r.slotId} (Zone {r.zone})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {formatDateTime(r.entryTime)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {formatDateTime(r.exitTime)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-800">
                      {formatDuration(r.durationMinutes)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-extrabold text-emerald-600">
                      {formatCurrency(r.totalFee)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                      {r.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {r.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
