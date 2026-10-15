import React, { useState } from 'react';
import { useParking } from '../context/ParkingContext';
import { useToast } from '../context/ToastContext';
import { VehicleType, QueueItem } from '../types/parking';
import {
  formatDuration,
  getVehicleTypeLabel,
} from '../utils/formatters';
import {
  ListOrdered,
  Plus,
  Car,
  Clock,
  Sparkles,
  Trash2,
  Zap,
  Accessibility,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const WaitingQueue: React.FC = () => {
  const {
    waitingQueue,
    slots,
    addToWaitingQueue,
    removeFromWaitingQueue,
    dispatchQueueVehicle,
    currentTime,
  } = useParking();
  const { showToast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('FOUR_WHEELER');
  const [driverName, setDriverName] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [preferredGate, setPreferredGate] = useState<string>('GATE_1');
  const [needsEV, setNeedsEV] = useState<boolean>(false);
  const [needsAccessible, setNeedsAccessible] = useState<boolean>(false);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPlate = vehiclePlate.trim().toUpperCase();
    if (!cleanPlate) {
      showToast('error', 'Plate Required', 'Please enter license plate number.');
      return;
    }

    const res = addToWaitingQueue({
      vehiclePlate: cleanPlate,
      vehicleType,
      driverName: driverName.trim() || 'Guest Driver',
      driverPhone: driverPhone.trim(),
      preferredGate,
      needsEV: needsEV || vehicleType === 'EV_FOUR_WHEELER',
      needsAccessible: needsAccessible || vehicleType === 'ACCESSIBLE',
    });

    if (res.success) {
      showToast('success', 'Added to Queue', res.message);
      setIsAddOpen(false);
      setVehiclePlate('');
      setDriverName('');
      setDriverPhone('');
      setNeedsEV(false);
      setNeedsAccessible(false);
    } else {
      showToast('error', 'Queue Error', res.message);
    }
  };

  const handleRemove = (queueId: string, plate: string) => {
    if (window.confirm(`Remove vehicle ${plate} from the waiting queue?`)) {
      const removed = removeFromWaitingQueue(queueId);
      if (removed) {
        showToast('info', 'Removed', `Vehicle ${plate} removed from waiting queue.`);
      }
    }
  };

  const handleDispatch = (queueId: string) => {
    const res = dispatchQueueVehicle(queueId);
    if (res.success) {
      showToast('success', 'Bay Allocated', res.message);
    } else {
      showToast('warning', 'No Free Bay Yet', res.message);
    }
  };

  // Available slots count
  const availableSlotsCount = slots.filter((s) => s.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-blue-600" />
              Automated Vehicle Waiting Queue (FIFO)
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Queue ADT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            When all slots are full, vehicles queue up and are automatically allocated bays as soon as vehicles exit.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle to Queue
        </button>
      </div>

      {/* KPI Cards for Queue */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Vehicles in Queue</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {waitingQueue.length}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">FIFO Buffer Capacity</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Currently Free Bays</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {availableSlotsCount}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Available for instant dispatch</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Dispatch Policy</span>
          <div className="text-base font-bold text-slate-800 mt-1">
            First-In First-Out (FIFO)
          </div>
          <p className="text-xs text-slate-400 mt-0.5">With compatibility constraint solver</p>
        </div>
      </div>

      {/* Queue List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">
            Live Queue Line ({waitingQueue.length} Vehicles Waiting)
          </h3>
          <span className="text-xs text-slate-400">Position 1 will be dispatched first</span>
        </div>

        {waitingQueue.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
            <p className="text-base font-semibold text-slate-700">Waiting Queue is currently empty.</p>
            <p className="text-xs">There are no waiting vehicles. All arriving vehicles can park immediately.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-center">Pos</th>
                  <th className="py-3 px-4">Vehicle Plate</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Driver Contact</th>
                  <th className="py-3 px-4">Preferred Gate</th>
                  <th className="py-3 px-4">Special Needs</th>
                  <th className="py-3 px-4">Wait Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {waitingQueue.map((item, index) => {
                  const elapsedMins = Math.max(1, Math.round((currentTime - item.joinedAt) / (1000 * 60)));

                  return (
                    <tr
                      key={item.queueId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        index === 0 ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                            index === 0
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-base">
                        {item.vehiclePlate}
                        <span className="block text-slate-400 text-xs font-mono font-normal">
                          {item.queueId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {getVehicleTypeLabel(item.vehicleType)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-800">
                        <span className="font-semibold block">{item.driverName}</span>
                        {item.driverPhone && <span className="text-slate-500">{item.driverPhone}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {item.preferredGate === 'GATE_1' ? 'Gate 1 (North)' : 'Gate 2 (South)'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {item.needsEV && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                              <Zap className="w-3 h-3" /> EV Port
                            </span>
                          )}
                          {item.needsAccessible && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                              <Accessibility className="w-3 h-3" /> Accessible
                            </span>
                          )}
                          {!item.needsEV && !item.needsAccessible && (
                            <span className="text-xs text-slate-400">Standard</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-amber-700">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          {formatDuration(elapsedMins)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRemove(item.queueId, item.vehiclePlate)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove from Queue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDispatch(item.queueId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            Dispatch <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add to Queue Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Add Vehicle to Waiting Queue</h3>
                <p className="text-xs text-slate-400">Enqueue vehicle for automatic dispatch</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  License Plate *
                </label>
                <input
                  type="text"
                  required
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                  placeholder="e.g. MH-02-CD-1414"
                  className="w-full px-3.5 py-2 text-sm font-mono font-bold uppercase bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => {
                    const vt = e.target.value as VehicleType;
                    setVehicleType(vt);
                    if (vt === 'EV_FOUR_WHEELER') setNeedsEV(true);
                    if (vt === 'ACCESSIBLE') setNeedsAccessible(true);
                  }}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="FOUR_WHEELER">Four-Wheeler (Car / Sedan)</option>
                  <option value="TWO_WHEELER">Two-Wheeler (Bike / Scooter)</option>
                  <option value="EV_FOUR_WHEELER">EV Four-Wheeler</option>
                  <option value="ACCESSIBLE">Accessible Vehicle</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Guest Driver"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Arriving Gate
                </label>
                <select
                  value={preferredGate}
                  onChange={(e) => setPreferredGate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="GATE_1">Gate 1 - North Main</option>
                  <option value="GATE_2">Gate 2 - South Express</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsEV}
                    onChange={(e) => setNeedsEV(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded-sm"
                  />
                  <span>Requires EV Charging Station</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsAccessible}
                    onChange={(e) => setNeedsAccessible(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm"
                  />
                  <span>Requires Wheelchair Accessible Bay near elevator</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Enqueue Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
