import React, { useState, useEffect } from 'react';
import { useParking } from '../context/ParkingContext';
import { useToast } from '../context/ToastContext';
import { VehicleType, ZoneId, ParkingSlot } from '../types/parking';
import { DijkstraResult, GraphNode } from '../data-structures/Graph';
import { parkingTopology } from '../services/parkingGraphService';
import {
  Compass,
  MapPin,
  Navigation,
  Sparkles,
  Zap,
  Accessibility,
  ArrowRight,
  Route,
  CheckCircle2,
  Car,
  Bike,
} from 'lucide-react';
import { getSlotTypeLabel, getVehicleTypeLabel } from '../utils/formatters';

interface FindParkingProps {
  initialTargetSlotId?: string;
  onOpenEntryWithSlot?: (slotId: string) => void;
}

export const FindParking: React.FC<FindParkingProps> = ({
  initialTargetSlotId,
  onOpenEntryWithSlot,
}) => {
  const { slots, findBestAvailableSlot, getShortestPath } = useParking();
  const { showToast } = useToast();

  // Search parameters
  const [vehicleType, setVehicleType] = useState<VehicleType>('FOUR_WHEELER');
  const [entryGate, setEntryGate] = useState<string>('GATE_1');
  const [needsEV, setNeedsEV] = useState<boolean>(false);
  const [needsAccessible, setNeedsAccessible] = useState<boolean>(false);
  const [preferredZone, setPreferredZone] = useState<string>('ALL');

  // Specific Slot Path inspection
  const [manualSlotId, setManualSlotId] = useState<string>(initialTargetSlotId || '');

  // Computed recommendation
  const [recommendedSlot, setRecommendedSlot] = useState<ParkingSlot | null>(null);
  const [dijkstraResult, setDijkstraResult] = useState<DijkstraResult | null>(null);
  const [recommendationReason, setRecommendationReason] = useState<string>('');

  // Graph topology nodes
  const allGraphNodes = parkingTopology.getGraph().getAllNodes();

  const handleFindBest = () => {
    const res = findBestAvailableSlot({
      vehicleType,
      entryGate,
      needsEV: needsEV || vehicleType === 'EV_FOUR_WHEELER',
      needsAccessible: needsAccessible || vehicleType === 'ACCESSIBLE',
      preferredZone,
    });

    if (res) {
      setRecommendedSlot(res.slot);
      setDijkstraResult(res.dijkstra);
      setRecommendationReason(res.reason);
      setManualSlotId(res.slot.id);
      showToast('success', 'Optimal Bay Found', `Recommended bay: ${res.slot.id} (${res.dijkstra?.distance}m away).`);
    } else {
      showToast('warning', 'No Free Bay Found', 'No compatible bays currently available for these criteria.');
      setRecommendedSlot(null);
      setDijkstraResult(null);
    }
  };

  // Inspect manual slot route
  const handleInspectSlotRoute = (slotId: string) => {
    setManualSlotId(slotId);
    const targetSlot = slots.find((s) => s.id === slotId);
    if (!targetSlot) return;

    const path = getShortestPath(entryGate, slotId);
    setRecommendedSlot(targetSlot);
    setDijkstraResult(path);
    setRecommendationReason(`Shortest Dijkstra path to Bay ${slotId} from ${entryGate === 'GATE_1' ? 'Gate 1 (North)' : 'Gate 2 (South)'}.`);
  };

  // Auto-find on initial render or when initialTargetSlotId is provided
  useEffect(() => {
    if (initialTargetSlotId) {
      handleInspectSlotRoute(initialTargetSlotId);
    } else {
      handleFindBest();
    }
  }, [initialTargetSlotId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-600" />
              Smart Bay Recommender & Shortest Path Navigation
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Dijkstra & MinHeap
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Uses Dijkstra's shortest-path algorithm and MinHeap priority queue to recommend and navigate to the nearest compatible bay.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Preferences Form */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <Navigation className="w-4 h-4 text-blue-600" />
            Vehicle & Route Criteria
          </h3>

          <div className="space-y-4">
            {/* Arrival Gate */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Arrival Entrance Gate
              </label>
              <select
                value={entryGate}
                onChange={(e) => {
                  setEntryGate(e.target.value);
                  if (recommendedSlot) {
                    const newPath = getShortestPath(e.target.value, recommendedSlot.id);
                    setDijkstraResult(newPath);
                  }
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="GATE_1">Gate 1 - North Main (Admin / Academic Block)</option>
                <option value="GATE_2">Gate 2 - South Express (Highway Access)</option>
              </select>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Vehicle Category
              </label>
              <select
                value={vehicleType}
                onChange={(e) => {
                  const vt = e.target.value as VehicleType;
                  setVehicleType(vt);
                  if (vt === 'EV_FOUR_WHEELER') setNeedsEV(true);
                  if (vt === 'ACCESSIBLE') setNeedsAccessible(true);
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="FOUR_WHEELER">Standard Four-Wheeler (Car / SUV)</option>
                <option value="TWO_WHEELER">Two-Wheeler (Bike / Scooter)</option>
                <option value="EV_FOUR_WHEELER">Electric Vehicle (EV Four-Wheeler)</option>
                <option value="ACCESSIBLE">Accessible Vehicle (Wheelchair User)</option>
              </select>
            </div>

            {/* Preferred Zone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Preferred Zone (Optional)
              </label>
              <select
                value={preferredZone}
                onChange={(e) => setPreferredZone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">Any Zone (Shortest Distance First)</option>
                <option value="A">Zone A - North Wing (Ground)</option>
                <option value="B">Zone B - South Courtyard (Ground)</option>
                <option value="C">Zone C - Level 1 EV Concourse</option>
                <option value="D">Zone D - Level 2 Rooftop</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsEV}
                  onChange={(e) => setNeedsEV(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded-sm"
                />
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-purple-600" />
                  Must have EV Fast Charging Port
                </span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsAccessible}
                  onChange={(e) => setNeedsAccessible(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm"
                />
                <span className="flex items-center gap-1">
                  <Accessibility className="w-3.5 h-3.5 text-blue-600" />
                  Must be Accessible / Near Elevator
                </span>
              </label>
            </div>

            {/* Find Button */}
            <button
              type="button"
              onClick={handleFindBest}
              className="w-full py-3 px-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Find Best Parking Space
            </button>

            {/* Or Select Specific Slot to test Route */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Or calculate route to any specific bay:
              </label>
              <select
                value={manualSlotId}
                onChange={(e) => {
                  if (e.target.value) handleInspectSlotRoute(e.target.value);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
              >
                <option value="">Select a bay to view shortest path...</option>
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    Bay {s.id} ({s.status} - Zone {s.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Columns: Recommended Result & Graph Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommendation Banner Card */}
          {recommendedSlot && dijkstraResult ? (
            <div className="bg-white rounded-2xl p-6 border-2 border-blue-500/40 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-blue-600/30">
                    {recommendedSlot.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-slate-900">
                        Recommended Bay {recommendedSlot.id}
                      </h3>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {recommendedSlot.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Zone {recommendedSlot.zone} • {getSlotTypeLabel(recommendedSlot.type)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Driving Distance</span>
                  <div className="text-2xl font-extrabold text-blue-600">
                    {dijkstraResult.distance} meters
                  </div>
                  <span className="text-[11px] text-slate-500">~{Math.max(1, Math.round(dijkstraResult.distance / 40))} min drive</span>
                </div>
              </div>

              {/* Rationale */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 text-xs text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{recommendationReason}</span>
              </div>

              {/* Turn-by-Turn Driving Guidance */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Route className="w-4 h-4 text-blue-600" />
                  Turn-by-Turn Driving Directions (Dijkstra Computed)
                </h4>
                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {dijkstraResult.directions.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Park Button */}
              {recommendedSlot.status === 'AVAILABLE' && onOpenEntryWithSlot && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onOpenEntryWithSlot(recommendedSlot.id)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Park Vehicle in Bay {recommendedSlot.id} Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400 space-y-2">
              <Compass className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-base font-semibold text-slate-700">Select parameters to find parking.</p>
              <p className="text-xs">The system will calculate the optimal parking bay and shortest path.</p>
            </div>
          )}

          {/* Parking Graph Topology Visualizer */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                  <Route className="w-4 h-4 text-blue-400" />
                  Campus Parking Lot Adjacency Graph
                </h3>
                <p className="text-xs text-slate-400">
                  Shortest-path nodes & connectivity network
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px] text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Entrance Gate
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Lane / Ramp
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Selected Target
                </span>
              </div>
            </div>

            {/* SVG Visual Graph Map */}
            <div className="relative w-full h-64 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Background Connecting Lines */}
                <line x1="10" y1="15" x2="25" y2="20" stroke="#334155" strokeWidth="1.5" strokeDasharray="2,2" />
                <line x1="10" y1="85" x2="25" y2="80" stroke="#334155" strokeWidth="1.5" strokeDasharray="2,2" />
                <line x1="25" y1="20" x2="35" y2="50" stroke="#334155" strokeWidth="1.5" />
                <line x1="25" y1="80" x2="35" y2="50" stroke="#334155" strokeWidth="1.5" />
                <line x1="35" y1="50" x2="50" y2="50" stroke="#334155" strokeWidth="1.5" />
                <line x1="50" y1="50" x2="65" y2="50" stroke="#334155" strokeWidth="1.5" />
                <line x1="25" y1="20" x2="40" y2="18" stroke="#334155" strokeWidth="1.5" />
                <line x1="25" y1="80" x2="40" y2="82" stroke="#334155" strokeWidth="1.5" />
                <line x1="50" y1="50" x2="65" y2="35" stroke="#334155" strokeWidth="1.5" />
                <line x1="65" y1="50" x2="80" y2="35" stroke="#334155" strokeWidth="1.5" />

                {/* Highlighted Dijkstra Path */}
                {dijkstraResult && dijkstraResult.nodes.length > 1 && (
                  <polyline
                    points={dijkstraResult.nodes.map((n) => `${n.x},${n.y}`).join(' ')}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-pulse"
                  />
                )}

                {/* Major Junction & Gate Nodes */}
                {/* Gate 1 */}
                <circle cx="10" cy="15" r="3.5" fill="#10B981" />
                <text x="10" y="10" fill="#34D399" fontSize="3.5" textAnchor="middle" fontWeight="bold">
                  Gate 1
                </text>

                {/* Gate 2 */}
                <circle cx="10" cy="85" r="3.5" fill="#10B981" />
                <text x="10" y="93" fill="#34D399" fontSize="3.5" textAnchor="middle" fontWeight="bold">
                  Gate 2
                </text>

                {/* North Rotunda */}
                <circle cx="25" cy="20" r="2.5" fill="#3B82F6" />
                {/* South Rotunda */}
                <circle cx="25" cy="80" r="2.5" fill="#3B82F6" />
                {/* Central Spine */}
                <circle cx="35" cy="50" r="3" fill="#6366F1" />
                {/* Ramp L1 */}
                <circle cx="50" cy="50" r="2.5" fill="#8B5CF6" />
                {/* Ramp L2 */}
                <circle cx="65" cy="50" r="2.5" fill="#EC4899" />

                {/* Zone Labels */}
                <text x="55" y="15" fill="#94A3B8" fontSize="3" fontWeight="bold">
                  Zone A (North Wing)
                </text>
                <text x="55" y="85" fill="#94A3B8" fontSize="3" fontWeight="bold">
                  Zone B (South Courtyard)
                </text>
                <text x="75" y="30" fill="#C084FC" fontSize="3" fontWeight="bold">
                  Zone C (Level 1 EV)
                </text>
                <text x="88" y="30" fill="#FBBF24" fontSize="3" fontWeight="bold">
                  Zone D (Level 2)
                </text>

                {/* Target Bay Marker */}
                {recommendedSlot && dijkstraResult && (
                  <circle
                    cx={dijkstraResult.nodes[dijkstraResult.nodes.length - 1]?.x || 70}
                    cy={dijkstraResult.nodes[dijkstraResult.nodes.length - 1]?.y || 20}
                    r="4.5"
                    fill="#EF4444"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                )}
              </svg>
            </div>

            <div className="text-[11.5px] text-slate-400 flex items-center justify-between">
              <span>Shortest-path node sequence:</span>
              <span className="font-mono text-blue-400">
                {dijkstraResult ? dijkstraResult.path.join(' → ') : 'Awaiting query'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
