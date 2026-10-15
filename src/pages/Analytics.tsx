import React, { useMemo } from 'react';
import { useParking } from '../context/ParkingContext';
import { ZONE_INFO, ZoneId, VehicleType } from '../types/parking';
import {
  formatCurrency,
  formatDuration,
  getVehicleTypeLabel,
} from '../utils/formatters';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  Car,
  Clock,
  Zap,
  Accessibility,
  Bike,
  Activity,
  Layers,
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { slots, activeTickets, history, todayRevenue, occupancyRate, totalSlots } = useParking();

  // Zone Breakdown
  const zoneStats = useMemo(() => {
    return (['A', 'B', 'C', 'D'] as ZoneId[]).map((zoneId) => {
      const zoneSlots = slots.filter((s) => s.zone === zoneId);
      const total = zoneSlots.length;
      const occupied = zoneSlots.filter((s) => s.status === 'OCCUPIED').length;
      const reserved = zoneSlots.filter((s) => s.status === 'RESERVED').length;
      const available = zoneSlots.filter((s) => s.status === 'AVAILABLE').length;
      const percent = Math.round(((occupied + reserved) / total) * 100);

      // Revenue collected in this zone from history
      const zoneRevenue = history
        .filter((h) => h.zone === zoneId)
        .reduce((sum, h) => sum + h.totalFee, 0);

      return {
        id: zoneId,
        info: ZONE_INFO[zoneId],
        total,
        occupied,
        reserved,
        available,
        percent,
        zoneRevenue,
      };
    });
  }, [slots, history]);

  // Vehicle Categories Breakdown across current + history
  const vehicleStats = useMemo(() => {
    const categories: { type: VehicleType; label: string; icon: any; color: string }[] = [
      { type: 'FOUR_WHEELER', label: 'Four-Wheeler (Standard)', icon: Car, color: 'bg-blue-600' },
      { type: 'TWO_WHEELER', label: 'Two-Wheeler (Bikes)', icon: Bike, color: 'bg-amber-500' },
      { type: 'EV_FOUR_WHEELER', label: 'EV Electric Bays', icon: Zap, color: 'bg-purple-600' },
      { type: 'ACCESSIBLE', label: 'Accessible Bays', icon: Accessibility, color: 'bg-emerald-600' },
    ];

    const totalHistoricalCount = history.length || 1;

    return categories.map((cat) => {
      const currentActive = activeTickets.filter((t) => t.vehicleType === cat.type).length;
      const totalServed = history.filter((h) => h.vehicleType === cat.type).length;
      const revenue = history
        .filter((h) => h.vehicleType === cat.type)
        .reduce((sum, h) => sum + h.totalFee, 0);
      const percentage = Math.round((totalServed / totalHistoricalCount) * 100);

      return {
        ...cat,
        currentActive,
        totalServed,
        revenue,
        percentage,
      };
    });
  }, [activeTickets, history]);

  // Total Historical Revenue
  const totalHistoricalRevenue = useMemo(() => {
    return history.reduce((sum, h) => sum + h.totalFee, 0);
  }, [history]);

  // Average stay duration in history
  const avgStayMinutes = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.round(history.reduce((sum, h) => sum + h.durationMinutes, 0) / history.length);
  }, [history]);

  // Simulated Peak Hours Distribution
  const hourlyTraffic = [
    { hour: '07:00 AM', load: 20 },
    { hour: '08:00 AM', load: 65 },
    { hour: '09:00 AM', load: 92 },
    { hour: '10:00 AM', load: 88 },
    { hour: '11:00 AM', load: 78 },
    { hour: '12:00 PM', load: 85 },
    { hour: '01:00 PM', load: 72 },
    { hour: '02:00 PM', load: 80 },
    { hour: '03:00 PM', load: 68 },
    { hour: '04:00 PM', load: 75 },
    { hour: '05:00 PM', load: 94 },
    { hour: '06:00 PM', load: 55 },
    { hour: '07:00 PM', load: 35 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Parking Utilization & Revenue Analytics
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Real-Time Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Key operational metrics, zone occupancy distribution, vehicle category breakdown, and revenue collection.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Current Occupancy</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1">
            {occupancyRate}%
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{totalSlots - Math.round(totalSlots * (occupancyRate / 100))} bays currently open</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Today's Revenue</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
            {formatCurrency(todayRevenue)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Billed since 00:00 AM</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Lifetime Revenue</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(totalHistoricalRevenue)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Across {history.length} completed sessions</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Average Dwell Time</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 mt-1">
            {formatDuration(avgStayMinutes)}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Average session duration</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Utilization Comparison */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Zone-Wise Capacity & Utilization
            </h3>
            <span className="text-xs text-slate-500">Live Status</span>
          </div>

          <div className="space-y-4">
            {zoneStats.map((z) => (
              <div key={z.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    {z.info.name}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {z.occupied + z.reserved} / {z.total} Bays ({z.percent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                  <div
                    className="bg-blue-600 h-full"
                    style={{ width: `${(z.occupied / z.total) * 100}%` }}
                    title="Occupied"
                  />
                  <div
                    className="bg-amber-400 h-full"
                    style={{ width: `${(z.reserved / z.total) * 100}%` }}
                    title="Reserved"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Revenue: {formatCurrency(z.zoneRevenue)}</span>
                  <span>{z.available} bays available</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              Vehicle Categories & Tariff Breakdown
            </h3>
            <span className="text-xs text-slate-500">Volume Share</span>
          </div>

          <div className="space-y-3.5">
            {vehicleStats.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.type} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg text-white ${cat.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-800 text-xs">{cat.label}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      {formatCurrency(cat.revenue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Active Now: <strong className="text-slate-800">{cat.currentActive}</strong></span>
                    <span>Total Historical: <strong className="text-slate-800">{cat.totalServed}</strong></span>
                    <span>Share: <strong className="text-slate-800">{cat.percentage}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hourly Peak Load Simulated Traffic Profile */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Campus Hourly Peak Parking Traffic Profile
            </h3>
            <p className="text-xs text-slate-500">
              Occupancy trend across operating hours (07:00 AM - 07:00 PM)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            Peak: 09:00 AM & 05:00 PM (Rush Hours)
          </span>
        </div>

        {/* Bar chart representation */}
        <div className="pt-4 flex items-end justify-between gap-1 sm:gap-2 h-44 overflow-x-auto pb-2">
          {hourlyTraffic.map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 min-w-[36px]">
              <span className="text-[10px] font-mono font-semibold text-slate-500">{bar.load}%</span>
              <div className="w-full bg-slate-100 rounded-t-lg h-32 relative overflow-hidden flex items-end">
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    bar.load > 90
                      ? 'bg-rose-500'
                      : bar.load > 75
                      ? 'bg-amber-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ height: `${bar.load}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-500 whitespace-nowrap rotate-[-30deg] origin-top-left mt-1">
                {bar.hour.slice(0, 5)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
