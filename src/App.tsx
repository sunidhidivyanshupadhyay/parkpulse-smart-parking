/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ParkingProvider } from './context/ParkingContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Availability } from './pages/Availability';
import { EntryExit } from './pages/EntryExit';
import { Reservations } from './pages/Reservations';
import { WaitingQueue } from './pages/WaitingQueue';
import { FindParking } from './pages/FindParking';
import { ParkingHistory } from './pages/ParkingHistory';
import { Analytics } from './pages/Analytics';

function ParkingAppContent() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Cross-page navigation helpers
  const [entrySlotId, setEntrySlotId] = useState<string | undefined>(undefined);
  const [exitPlate, setExitPlate] = useState<string | undefined>(undefined);
  const [findSlotId, setFindSlotId] = useState<string | undefined>(undefined);

  const handleOpenEntryWithSlot = (slotId: string) => {
    setEntrySlotId(slotId);
    setExitPlate(undefined);
    setActiveTab('entry-exit');
  };

  const handleOpenExitWithPlate = (plate: string) => {
    setExitPlate(plate);
    setEntrySlotId(undefined);
    setActiveTab('entry-exit');
  };

  const handleNavigateToSlotRoute = (slotId: string) => {
    setFindSlotId(slotId);
    setActiveTab('find-parking');
  };

  const renderCurrentPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={(tab) => {
              setEntrySlotId(undefined);
              setExitPlate(undefined);
              setActiveTab(tab);
            }}
            onOpenExitWithPlate={handleOpenExitWithPlate}
          />
        );
      case 'availability':
        return (
          <Availability
            onNavigateToSlot={handleNavigateToSlotRoute}
            onOpenEntryWithSlot={handleOpenEntryWithSlot}
            onOpenExitWithPlate={handleOpenExitWithPlate}
          />
        );
      case 'entry-exit':
        return (
          <EntryExit
            initialSlotId={entrySlotId}
            initialExitPlate={exitPlate}
            onNavigateToQueue={() => setActiveTab('queue')}
          />
        );
      case 'reservations':
        return <Reservations onOpenEntryWithSlot={handleOpenEntryWithSlot} />;
      case 'queue':
        return <WaitingQueue />;
      case 'find-parking':
        return (
          <FindParking
            initialTargetSlotId={findSlotId}
            onOpenEntryWithSlot={handleOpenEntryWithSlot}
          />
        );
      case 'history':
        return <ParkingHistory />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard onNavigate={(t) => setActiveTab(t)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex font-sans antialiased text-[15px]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setEntrySlotId(undefined);
          setExitPlate(undefined);
          setFindSlotId(undefined);
          setActiveTab(tab);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeTab={activeTab}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderCurrentPage()}
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-slate-200/80 bg-white/70 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            ParkPulse • Smart Parking Management System • Campus Engineering Project
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Graph • MinHeap • HashMap • Queue • Dijkstra</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ParkingProvider>
        <ParkingAppContent />
      </ParkingProvider>
    </ToastProvider>
  );
}
