import React from 'react';
import {
  LayoutDashboard,
  Grid3X3,
  CarFront,
  CalendarClock,
  ListOrdered,
  Compass,
  History,
  BarChart3,
  X,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

export type NavigationTab =
  | 'dashboard'
  | 'availability'
  | 'entry-exit'
  | 'reservations'
  | 'queue'
  | 'find-parking'
  | 'history'
  | 'analytics';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, isOpen, onClose }) => {
  const { waitingQueue, occupancyRate } = useParking();

  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'availability' as NavigationTab,
      label: 'Parking Availability',
      icon: Grid3X3,
      badge: `${occupancyRate}%`,
    },
    {
      id: 'entry-exit' as NavigationTab,
      label: 'Vehicle Entry & Exit',
      icon: CarFront,
      badge: null,
    },
    {
      id: 'reservations' as NavigationTab,
      label: 'Reservations',
      icon: CalendarClock,
      badge: null,
    },
    {
      id: 'queue' as NavigationTab,
      label: 'Waiting Queue',
      icon: ListOrdered,
      badge: waitingQueue.length > 0 ? `${waitingQueue.length}` : null,
      badgeAlert: waitingQueue.length > 0,
    },
    {
      id: 'find-parking' as NavigationTab,
      label: 'Find Parking',
      icon: Compass,
      badge: 'Path',
    },
    {
      id: 'history' as NavigationTab,
      label: 'Parking History',
      icon: History,
      badge: null,
    },
    {
      id: 'analytics' as NavigationTab,
      label: 'Analytics',
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-extrabold text-white text-xl shadow-lg shadow-blue-500/20">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">ParkPulse</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  ADS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Smart Parking System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Management Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[15px] font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      item.badgeAlert
                        ? 'bg-amber-400 text-amber-950 animate-pulse'
                        : isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ADS Data Structures Info Card in Sidebar */}
        <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 text-blue-400 font-semibold mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Active Data Structures</span>
          </div>
          <div className="space-y-1 text-slate-300 text-[11.5px] leading-relaxed">
            <div className="flex justify-between items-center">
              <span>Waiting Queue:</span>
              <span className="font-mono text-emerald-400">Queue&lt;T&gt; (FIFO)</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Plate Lookups:</span>
              <span className="font-mono text-emerald-400">HashMap O(1)</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Slot Assignment:</span>
              <span className="font-mono text-emerald-400">MinHeap</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Navigation:</span>
              <span className="font-mono text-emerald-400">Dijkstra Graph</span>
            </div>
          </div>
        </div>

        {/* Bottom User / Campus Info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>College Campus Lot 48</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
            Live Sync
          </span>
        </div>
      </aside>
    </>
  );
};
