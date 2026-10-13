import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { ClientsTab } from './components/ClientsTab';
import { InboundsTab } from './components/InboundsTab';
import { SettingsTab } from './components/SettingsTab';
import { MascotCompanion } from './components/MascotCompanion';
import { QrModal } from './components/QrModal';
import { AddClientModal } from './components/AddClientModal';
import { useAppStore } from './stores/useAppStore';

export const App: React.FC = () => {
  const { fetchUsers, fetchStatus, activeTab } = useAppStore();

  useEffect(() => {
    fetchUsers();
    fetchStatus();
    const interval = setInterval(() => {
      fetchUsers();
      fetchStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchUsers, fetchStatus]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 selection:bg-cyber-pink selection:text-white">
      {/* Top Header with tabs and theme switcher */}
      <Header />

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'clients' && <ClientsTab />}
        {activeTab === 'inbounds' && <InboundsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Cyber-Moe Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-cosmic-950/90 py-4 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-bold">KIRI PANEL</span>
            <span className="text-cyber-pink">// 霧</span>
            <span>• FAMILY CYBER-DEFENSE SUITE</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>AMNEZIAWG + HYSTERIA 2 GECKO</span>
            <span>•</span>
            <span className="text-cyber-cyan font-medium">POWERED BY REACT &amp; VITE</span>
          </div>
        </div>
      </footer>

      {/* Modals & Floating Mascot Companion */}
      <QrModal />
      <AddClientModal />
      <MascotCompanion />
    </div>
  );
};

export default App;
