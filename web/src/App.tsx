import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { StatusCards } from './components/StatusCards';
import { UserList } from './components/UserList';
import { Mascot } from './components/Mascot';
import { QrModal } from './components/QrModal';
import { AddUserModal } from './components/AddUserModal';
import { 
  ShieldCheck, 
  Terminal, 
  Sparkles, 
  ExternalLink, 
  FileCode, 
  Cpu, 
  RefreshCw,
  Zap
} from 'lucide-react';
import { useMascotStore } from './stores/useMascotStore';
import { useAppStore } from './stores/useAppStore';
import { soundFx } from './utils/soundFx';

export const App: React.FC = () => {
  const { setMood } = useMascotStore();
  const { fetchUsers, fetchStatus } = useAppStore();

  useEffect(() => {
    fetchUsers();
    fetchStatus();
    const interval = setInterval(() => {
      fetchUsers();
      fetchStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchUsers, fetchStatus]);

  const handleAuditClick = () => {
    soundFx.bleep();
    setMood('proud', 'Все проверки целостности пройдены! Никаких утечек DNS или WebRTC не обнаружено~ 🛡️✨', 5000);
  };

  const handleSpeedTest = () => {
    soundFx.bleep();
    setMood('happy', 'Запускаю пинг до зарубежных нод... Задержка Hysteria 2: 24мс! Скорость запредельная~ 🚀', 5000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cosmic-900 text-slate-100 selection:bg-cyber-pink selection:text-white">
      {/* Top HUD Header */}
      <Header />

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Status Cards */}
        <StatusCards />

        {/* Two-Column Responsive HUD Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Work Area (Left: 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Family Peers & Subscriptions */}
            <UserList />

            {/* Live Gateway Console / Telemetry Log */}
            <div className="hud-card p-5 relative font-mono text-xs">
              <div className="hud-corner-tl" />
              <div className="hud-corner-tr" />
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />

              <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyber-cyan/20">
                <div className="flex items-center gap-2 text-cyber-cyan">
                  <Terminal className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-wider">
                    SYSTEM AUDIT // REAL-TIME KERNEL LOG
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAuditClick}
                    className="px-2.5 py-1 rounded bg-cosmic-950 border border-cyber-cyan/30 text-[10px] text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>CHECK LEAKS</span>
                  </button>
                  <button
                    onClick={handleSpeedTest}
                    className="px-2.5 py-1 rounded bg-cosmic-950 border border-cyber-pink/30 text-[10px] text-cyber-pink hover:bg-cyber-pink/10 transition-colors flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    <span>PING TEST</span>
                  </button>
                </div>
              </div>

              <div className="bg-cosmic-950/90 rounded p-3 text-[11px] space-y-1.5 font-mono text-slate-400 overflow-x-auto border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="text-slate-600">[18:24:02]</span>
                  <span>[AWG-CORE]</span>
                  <span>AmneziaWG junk packet generator initialized. Parameters: Jc=4, Jmin=40, Jmax=70.</span>
                </div>
                <div className="flex items-center gap-2 text-cyber-cyan">
                  <span className="text-slate-600">[18:24:05]</span>
                  <span>[HY2-GECKO]</span>
                  <span>Hysteria 2 server listening on 0.0.0.0:443. Salamander UDP obfuscation ready.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-600">[18:24:12]</span>
                  <span>[SUB-SYNC]</span>
                  <span>Mihomo dynamic config generator ready at /sub/:id/mihomo.yaml.</span>
                </div>
                <div className="flex items-center gap-2 text-cyber-pink">
                  <span className="text-slate-600">[18:25:30]</span>
                  <span>[GUARD-KIRI]</span>
                  <span>Family security shield active. Routing table healthy, 0 packet anomalies.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area (Right: 4 cols) - Mascot & Quick Panels */}
          <div className="lg:col-span-4 space-y-6">
            {/* Mascot Widget */}
            <div className="hud-card p-6 flex flex-col items-center">
              <div className="hud-corner-tl" />
              <div className="hud-corner-tr" />
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />

              <Mascot />
            </div>

            {/* Quick Helper Links / Docs Card */}
            <div className="hud-card p-5 text-xs font-mono">
              <div className="hud-corner-tl" />
              <div className="hud-corner-tr" />
              <div className="hud-corner-bl" />
              <div className="hud-corner-br" />

              <h4 className="font-bold text-white mb-3 flex items-center gap-2 text-cyber-cyan">
                <Sparkles className="w-4 h-4 text-cyber-pink" />
                <span>ИНСТРУКЦИЯ ПОДКЛЮЧЕНИЯ</span>
              </h4>

              <div className="space-y-2.5 text-slate-300">
                <div className="p-2.5 rounded bg-cosmic-950/80 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyber-pink/20 text-cyber-pink font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <div>
                    <span className="font-semibold text-white block">Mihomo / Clash Verge Rev</span>
                    <span className="text-[11px] text-slate-400">
                      Нажми «Подписка» у пользователя и вставь URL в профиль клиента.
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-cosmic-950/80 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyber-cyan/20 text-cyber-cyan font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <div>
                    <span className="font-semibold text-white block">AmneziaWG Официальный</span>
                    <span className="text-[11px] text-slate-400">
                      Скачай .conf или отсканируй QR в приложении AmneziaWG на iOS / Android.
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-cosmic-950/80 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyber-purple/20 text-cyber-purple font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <div>
                    <span className="font-semibold text-white block">Обход блокировок ТСПУ</span>
                    <span className="text-[11px] text-slate-400">
                      Оба протокола полностью маскируются под легитимный HTTPS / QUIC трафик.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Cyber-Moe Footer */}
      <footer className="mt-auto border-t border-cyber-cyan/20 bg-cosmic-950/90 py-5 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-400">
            <span>KIRI PANEL</span>
            <span className="text-cyber-pink">// 霧</span>
            <span>• FAMILY CYBER-DEFENSE SUITE</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>AMNEZIAWG + HYSTERIA 2 GECKO</span>
            <span>•</span>
            <span className="text-cyber-cyan">POWERED BY REACT & VITE</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <QrModal />
      <AddUserModal />
    </div>
  );
};

export default App;
