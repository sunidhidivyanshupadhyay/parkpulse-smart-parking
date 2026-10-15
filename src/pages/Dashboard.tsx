import React from 'react';
import { useParking } from '../context/ParkingContext';
import { NavigationTab } from '../components/layout/Sidebar';
import { ZONE_INFO, ZoneId } from '../types/parking';
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  getVehicleTypeLabel,
} from '../utils/formatters';
import {
  Car,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  LogIn,
  LogOut,
  CalendarCheck,
  ListOrdered,
  DollarSign,
  Zap,
  Accessibility,
  Bike,
  ShieldAlert,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenExitWithPlate?: (plate: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenExitWithPlate }) => {
  const {
    totalSlots,
    availableCount,
    occupiedCount,
    reservedCount,
    maintenanceCount,
    occupancyRate,
    todayRevenue,
    activeTickets,
    waitingQueue,
    slots,
    currentTime,
  } = useParking();

  // Zone Breakdown
  const zoneStats = (['A', 'B', 'C', 'D'] as ZoneId[]).map((zoneId) => {
    const zoneSlots = slots.filter((s) => s.zone === zoneId);
    const available = zoneSlots.filter((s) => s.status === 'AVAILABLE').length;
    const occupied = zoneSlots.filter((s) => s.status === 'OCCUPIED').length;
    const reserved = zoneSlots.filter((s) => s.status === 'RESERVED').length;
    const maintenance = zoneSlots.filter((s) => s.status === 'MAINTENANCE').length;
    const rate = Math.round(((occupied + reserved) / zoneSlots.length) * 100);

    return {
      info: ZONE_INFO[zoneId],
      total: zoneSlots.length,
      available,
      occupied,
      reserved,
      maintenance,
      rate,
    };
  });

  // Accessible & EV statistics
  const accessibleSlots = slots.filter((s) => s.type === 'ACCESSIBLE');
  const accessibleAvailable = accessibleSlots.filter((s) => s.status === 'AVAILABLE').length;

  const evSlots = slots.filter((s) => s.type === 'EV_CHARGING');
  const evAvailable = evSlots.filter((s) => s.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Waiting Queue Alert Banner if vehicles waiting */}
      {waitingQueue.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {waitingQueue.length} {waitingQueue.length === 1 ? 'Vehicle' : 'Vehicles'} Waiting in Queue
              </h3>
              <p className="text-xs text-slate-600">
                Next in line: <span className="font-mono font-bold">{waitingQueue[0].vehiclePlate}</span> ({getVehicleTypeLabel(waitingQueue[0].vehicleType)})
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('queue')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer"
          >
            Manage Queue <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Spaces */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Spaces</span>
            <Car className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalSlots}</div>
          <p className="text-[11px] text-slate-500 mt-1">Bays in 4 Zones</p>
        </div>

        {/* Available Spaces */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Available</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{availableCount}</div>
          <p className="text-[11px] text-emerald-700/80 mt-1">Ready to allocate</p>
        </div>

        {/* Occupied Spaces */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Occupied</span>
            <Car className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">{occupiedCount}</div>
          <p className="text-[11px] text-rose-700/80 mt-1">{activeTickets.length} active sessions</p>
        </div>

        {/* Reserved Spaces */}
        <div className="bg-white rounded-2xl p-4 border border-purple-200 bg-purple-50/20 shadow-xs">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reserved</span>
            <CalendarCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600">{reservedCount}</div>
          <p className="text-[11px] text-purple-700/80 mt-1">Advance bookings</p>
        </div>

        {/* Occupancy % */}
        <div className="bg-white rounded-2xl p-4 border border-blue-200 bg-blue-50/20 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Occupancy</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">{occupancyRate}%</div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                occupancyRate > 85 ? 'bg-rose-500' : occupancyRate > 60 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{formatCurrency(todayRevenue)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Simulated Tariff</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Quick Operational Actions</h3>
          <p className="text-xs text-slate-500">Fast vehicle dispatch, checkout, and parking reservation workflows</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('entry-exit')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Check-In Vehicle
          </button>

          <button
            onClick={() => onNavigate('entry-exit')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Process Exit
          </button>

          <button
            onClick={() => onNavigate('reservations')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" />
            New Reservation
          </button>

          <button
            onClick={() => onNavigate('find-parking')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors cursor-pointer"
          >
            Find Best Space
          </button>
        </div>
      </div>

      {/* Accessible & EV Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Accessibility className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Accessible & Handicap Spaces</h4>
              <p className="text-xs text-slate-500">Close to elevators & main ground entrance</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-extrabold text-blue-700">
              {accessibleAvailable} / {accessibleSlots.length}
            </span>
            <span className="block text-[11px] text-slate-500">Available</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Electric Vehicle Fast Charging</h4>
              <p className="text-xs text-slate-500">Level 1 Hub & Dedicated EV charging stations</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-extrabold text-purple-700">
              {evAvailable} / {evSlots.length}
            </span>
            <span className="block text-[11px] text-slate-500">Available</span>
          </div>
        </div>
      </div>

      {/* Zone-by-Zone Progress Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">Zone-Wise Availability & Capacity</h3>
          <button
            onClick={() => onNavigate('availability')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            View Live Grid <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {zoneStats.map((z) => (
            <div
              key={z.info.id}
              onClick={() => onNavigate('availability')}
              className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{z.info.name}</h4>
                  <p className="text-[11px] text-slate-500">{z.info.levelName}</p>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {z.rate}% Full
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                <div className="bg-rose-500 h-full" style={{ width: `${(z.occupied / z.total) * 100}%` }} title="Occupied" />
                <div className="bg-purple-500 h-full" style={{ width: `${(z.reserved / z.total) * 100}%` }} title="Reserved" />
                <div className="bg-slate-300 h-full" style={{ width: `${(z.maintenance / z.total) * 100}%` }} title="Maintenance" />
              </div>

              {/* Counts */}
              <div className="grid grid-cols-3 gap-1 text-center text-xs pt-1 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">FREE</span>
                  <span className="font-bold text-emerald-600">{z.available}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">BUSY</span>
                  <span className="font-bold text-rose-600">{z.occupied}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">HOLD</span>
                  <span className="font-bold text-purple-600">{z.reserved}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Currently Parked Vehicles Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Active Parked Vehicles ({activeTickets.length})</h3>
            <p className="text-xs text-slate-500">Live duration and running tariff computed in real-time</p>
          </div>
          <button
            onClick={() => onNavigate('entry-exit')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
          >
            Manage Check-Ins & Check-Outs <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeTickets.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No active parked vehicles right now. All bays are ready.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Vehicle Plate</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Allocated Bay</th>
                  <th className="py-3 px-4">Entry Time</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Running Tariff</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTickets.map((ticket) => {
                  const elapsedMinutes = Math.max(1, Math.round((currentTime - ticket.entryTime) / (1000 * 60)));
                  const billableHours = Math.max(0.5, Math.ceil(elapsedMinutes / 30) * 0.5);
                  const fee = Number((billableHours * ticket.hourlyRate).toFixed(2));

                  return (
                    <tr key={ticket.ticketId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {ticket.vehiclePlate}
                        {ticket.driverName && (
                          <span className="block font-sans text-xs font-normal text-slate-500">{ticket.driverName}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {getVehicleTypeLabel(ticket.vehicleType)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold font-mono text-xs border border-blue-200">
                          {ticket.slotId} (Zone {ticket.zone})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {formatDateTime(ticket.entryTime)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-slate-800">
                        {formatDuration(elapsedMinutes)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-extrabold text-emerald-600">
                        {formatCurrency(fee)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (onOpenExitWithPlate) {
                              onOpenExitWithPlate(ticket.vehiclePlate);
                            } else {
                              onNavigate('entry-exit');
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Exit & Pay
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
