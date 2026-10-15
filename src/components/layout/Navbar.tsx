import React from 'react';
import { useParking } from '../../context/ParkingContext';
import { useToast } from '../../context/ToastContext';
import {
  Menu,
  RotateCcw,
  Clock,
  Radio,
  Car,
  Layers,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, activeTab }) => {
  const {
    availableCount,
    totalSlots,
    occupancyRate,
    waitingQueue,
    resetSystemData,
    currentTime,
  } = useParking();
  const { showToast } = useToast();

  const handleResetData = () => {
    if (window.confirm('Reset parking system data to initial sample state? Current changes will be overwritten.')) {
      resetSystemData();
      showToast('info', 'System Reset', 'All parking bays, queues, and mock records have been restored.');
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'System Overview & Control';
      case 'availability':
        return 'Live Parking Availability Grid';
      case 'entry-exit':
        return 'Vehicle Check-In & Check-Out Terminal';
      case 'reservations':
        return 'Slot Reservations Management';
      case 'queue':
        return 'Waiting Queue Buffer';
      case 'find-parking':
        return 'Smart Space Recommender & Path Finder';
      case 'history':
        return 'Parking Transaction Logs & Audit';
      case 'analytics':
        return 'Utilization & Revenue Analytics';
      default:
        return 'Smart Parking System';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {getPageTitle()}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            ParkPulse • Real-Time Automated Campus Infrastructure
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Live Occupancy Metric Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full animate-ping ${
                occupancyRate > 85 ? 'bg-rose-500' : occupancyRate > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            <span className="font-semibold text-slate-700">Occupancy: {occupancyRate}%</span>
          </div>
          <span className="text-slate-400">|</span>
          <span className="text-emerald-700 font-bold">{availableCount} Free</span>
        </div>

        {/* Gate Status Badges */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            Gate 1: Open
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            Gate 2: Open
          </span>
        </div>

        {/* Reset System Sample Data */}
        <button
          onClick={handleResetData}
          title="Reset to sample dataset"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Data</span>
        </button>
      </div>
    </header>
  );
};
