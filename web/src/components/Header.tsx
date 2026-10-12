import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Shield, Terminal, Activity, Wifi } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const Header: React.FC = () => {
  const { isSfxMuted, toggleSfx, systemStats } = useAppStore();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('ja-JP', {
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

  return (
    <header className="relative w-full border-b border-cyber-cyan/20 bg-cosmic-950/80 backdrop-blur-md z-30">
      {/* Decorative top accent line with cyan/pink gradient */}
      <div className="h-[2px] w-full bg-gradient-to-r from-cyber-cyan via-cyber-pink to-cyber-purple shadow-neon-cyan" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer flex items-center justify-center w-10 h-10 rounded bg-cosmic-800 border border-cyber-cyan/40 shadow-neon-cyan transition-transform hover:scale-105">
            <span className="text-xl select-none">🌸</span>
            <div className="absolute -inset-0.5 rounded bg-cyber-cyan/20 blur-sm -z-10 group-hover:bg-cyber-cyan/40" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-white to-cyber-pink font-mono">
                KIRI <span className="text-cyber-pink font-sans font-light opacity-90">// 霧</span>
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/40 rounded tracking-wider">
                v2.4 MOE-SEC
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 tracking-wider">
              AMNEZIA-WG & HYSTERIA-2 DUAL GATEWAY
            </p>
          </div>
        </div>

        {/* Center / System Telemetry Status Badge */}
        <div className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-full bg-cosmic-850/90 border border-cyber-cyan/30 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyber-cyan shadow-[0_0_8px_#00F0FF]"></span>
            </span>
            <span className="text-cyber-cyan font-bold tracking-wider">
              [ 接続中 // ONLINE ]
            </span>
          </div>

          <div className="w-[1px] h-4 bg-slate-700" />

          <div className="flex items-center gap-1.5 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyber-purple" />
            <span>CPU: {systemStats.cpuUsagePercent}%</span>
          </div>

          <div className="w-[1px] h-4 bg-slate-700" />

          <div className="flex items-center gap-1.5 text-slate-400">
            <Terminal className="w-3.5 h-3.5 text-cyber-pink" />
            <span>SYS: {timeStr}</span>
          </div>
        </div>

        {/* Action Controls & SFX Toggle */}
        <div className="flex items-center gap-3">
          {/* SFX Audio Switch */}
          <button
            onClick={toggleSfx}
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all border ${
              isSfxMuted
                ? 'bg-cosmic-800 text-slate-400 border-slate-700 hover:border-slate-500'
                : 'bg-cyber-dimPink text-cyber-pink border-cyber-pink/50 shadow-neon-pink hover:bg-cyber-pink/20'
            }`}
            title={isSfxMuted ? 'Включить SFX эффекты' : 'Выключить SFX эффекты'}
          >
            {isSfxMuted ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="hidden sm:inline">SFX: MUTE</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span className="hidden sm:inline">SFX: ACTIVE</span>
              </>
            )}
          </button>

          {/* Master Shield indicator */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded bg-cosmic-800/80 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono">
            <Shield className="w-3.5 h-3.5 text-cyber-cyan" />
            <span className="hidden lg:inline text-[11px]">OBFUSCATION ACTIVE</span>
          </div>
        </div>
      </div>
    </header>
  );
};
