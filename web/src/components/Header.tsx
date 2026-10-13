import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Activity, 
  Sun, 
  Moon, 
  Sparkles, 
  Bot, 
  LayoutDashboard, 
  Users, 
  Radio, 
  Settings as SettingsIcon,
  Clock
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useThemeStore, AppTheme } from '../stores/useThemeStore';
import { useMascotStore } from '../stores/useMascotStore';
import { NavTab } from '../types';
import { soundFx } from '../utils/soundFx';

export const Header: React.FC = () => {
  const { isSfxMuted, toggleSfx, systemStats, activeTab, setActiveTab } = useAppStore();
  const { theme, setTheme, cycleTheme } = useThemeStore();
  const { isVisible: isMascotVisible, toggleVisibility: toggleMascotVisibility } = useMascotStore();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTabClick = (tab: NavTab) => {
    setActiveTab(tab);
  };

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'inbounds', label: 'Inbounds', icon: Radio },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-cosmic-950/85 backdrop-blur-xl transition-colors duration-300">
      {/* Decorative top accent gradient line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-cyber-cyan via-cyber-pink to-cyber-purple shadow-sm" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Brand Logo & Telemetry Info */}
          <div className="flex items-center justify-between md:justify-start gap-4">
            <div className="flex items-center gap-3">
              <div 
                onClick={() => handleTabClick('overview')}
                className="relative group cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl bg-cosmic-800/90 border border-cyber-cyan/40 shadow-sm transition-transform hover:scale-105"
                title="Kiri Gateway Panel"
              >
                <span className="text-xl select-none">🌸</span>
                <div className="absolute -inset-0.5 rounded-xl bg-cyber-cyan/20 blur-sm -z-10 group-hover:bg-cyber-cyan/40 transition-all" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-white to-cyber-pink font-mono">
                    KIRI <span className="text-cyber-pink font-sans font-light opacity-90">// 霧</span>
                  </h1>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase bg-cyber-pink/15 text-cyber-pink border border-cyber-pink/30 rounded-md tracking-wider">
                    v2.4
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 tracking-wider">
                  AMNEZIA-WG & HYSTERIA-2 DUAL GATEWAY
                </p>
              </div>
            </div>

            {/* Live Status Pill (Mobile) */}
            <div className="flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ONLINE</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center justify-start sm:justify-center overflow-x-auto py-1 px-1 bg-cosmic-900/60 rounded-xl border border-slate-800/60 p-1 space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-cyber-pink/20 to-cyber-cyan/20 text-white border border-cyber-pink/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyber-pink' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Telemetry + Theme Switcher + SFX + Mascot Toggle */}
          <div className="flex items-center justify-end gap-2.5">
            
            {/* Telemetry pill (Desktop) */}
            <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-cosmic-900/70 border border-slate-800 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1 text-slate-300">
                <Activity className="w-3 h-3 text-cyber-purple" />
                <span>CPU {systemStats.cpuUsagePercent}%</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{timeStr}</span>
              </div>
            </div>

            {/* Theme Switcher Toggle (Light / Dark / Cyber) */}
            <div className="flex items-center bg-cosmic-900/80 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-md text-xs transition-all ${
                  theme === 'light'
                    ? 'bg-amber-400/20 text-amber-500 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Light Theme (Sakura Crisp White)"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-md text-xs transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-700/60 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dark Theme (Midnight Slate / OLED)"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setTheme('cyber')}
                className={`p-1.5 rounded-md text-xs transition-all ${
                  theme === 'cyber'
                    ? 'bg-cyber-cyan/20 text-cyber-cyan shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cyber Theme (Neon Glow)"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* SFX Audio Switch */}
            <button
              onClick={toggleSfx}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
                isSfxMuted
                  ? 'bg-cosmic-900/60 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-400'
                  : 'bg-cyber-dimPink text-cyber-pink border-cyber-pink/40 shadow-sm hover:bg-cyber-pink/20'
              }`}
              title={isSfxMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            >
              {isSfxMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">MUTED</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  <span className="hidden sm:inline text-[11px]">SFX</span>
                </>
              )}
            </button>

            {/* Toggle Mascot Companion Button */}
            <button
              onClick={() => {
                soundFx.sparkle();
                toggleMascotVisibility();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
                isMascotVisible
                  ? 'bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/40 shadow-sm hover:bg-cyber-cyan/25'
                  : 'bg-cosmic-900/60 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-400'
              }`}
              title={isMascotVisible ? 'Hide Mascot Companion' : 'Show Mascot Companion'}
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">
                {isMascotVisible ? 'MASCOT' : 'HIDDEN'}
              </span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
