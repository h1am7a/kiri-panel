import React from 'react';
import { Shield, Zap, ArrowDownToLine, ArrowUpFromLine, Users, Server, Radio, Network } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const StatusCards: React.FC = () => {
  const { awgService, hy2Service, systemStats } = useAppStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      {/* 1. AmneziaWG Obfuscated Card */}
      <div className="hud-card p-5 group relative overflow-hidden">
        {/* HUD Corner Accents */}
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {/* Card Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan shadow-neon-cyan">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-bold text-white tracking-wide text-sm">
                  AMNEZIA-WG
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30">
                  AWG0
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">Junk Packet Obfuscation</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>PORT {awgService.port}</span>
          </div>
        </div>

        {/* Telemetry Stats */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-3.5 h-3.5 text-cyber-cyan" />
              Подключенные пиры:
            </span>
            <span className="font-semibold text-cyber-cyan">{awgService.peersCount} активных</span>
          </div>

          <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Radio className="w-3.5 h-3.5 text-cyber-pink" />
              Текущая скорость:
            </span>
            <span className="text-white">
              ↓ {awgService.currentSpeedMbps.download} Mb/s · ↑ {awgService.currentSpeedMbps.upload} Mb/s
            </span>
          </div>

          <div className="pt-1">
            <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider flex justify-between">
              <span>Параметры AWG шума</span>
              <span className="text-cyber-cyan font-bold">ANTI-DPI [OK]</span>
            </div>
            <div className="text-[10px] font-mono bg-cosmic-950/80 p-2 rounded border border-cyber-cyan/20 text-cyber-cyan truncate" title={awgService.obfuscation}>
              {awgService.obfuscation}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hysteria 2 Gecko Card */}
      <div className="hud-card-pink p-5 group relative overflow-hidden">
        {/* HUD Corner Accents */}
        <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t-2 border-l-2 border-cyber-pink pointer-events-none" />
        <div className="absolute top-[3px] right-[3px] w-2 h-2 border-t-2 border-r-2 border-cyber-pink pointer-events-none" />
        <div className="absolute bottom-[3px] left-[3px] w-2 h-2 border-b-2 border-l-2 border-cyber-pink pointer-events-none" />
        <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b-2 border-r-2 border-cyber-pink pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-cyber-pink/10 border border-cyber-pink/40 flex items-center justify-center text-cyber-pink shadow-neon-pink">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-bold text-white tracking-wide text-sm">
                  HYSTERIA 2
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/30">
                  QUIC GECKO
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">Salamander UDP Protocol</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-pink-950/60 border border-cyber-pink/40 text-[11px] font-mono text-cyber-pink">
            <span className="w-2 h-2 rounded-full bg-cyber-pink animate-pulse" />
            <span>PORT {hy2Service.port}</span>
          </div>
        </div>

        {/* Telemetry Stats */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Network className="w-3.5 h-3.5 text-cyber-pink" />
              QUIC Коннекты:
            </span>
            <span className="font-semibold text-cyber-pink">{hy2Service.peersCount} устройств</span>
          </div>

          <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Radio className="w-3.5 h-3.5 text-cyber-purple" />
              Пиковая скорость:
            </span>
            <span className="text-white">
              ↓ {hy2Service.currentSpeedMbps.download} Mb/s · ↑ {hy2Service.currentSpeedMbps.upload} Mb/s
            </span>
          </div>

          <div className="pt-1">
            <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider flex justify-between">
              <span>Режим маскировки</span>
              <span className="text-cyber-pink font-bold">BRUTAL CONGESTION [ON]</span>
            </div>
            <div className="text-[10px] font-mono bg-cosmic-950/80 p-2 rounded border border-cyber-pink/20 text-cyber-pink truncate">
              {hy2Service.obfuscation}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Global System & Traffic Card */}
      <div className="hud-card p-5 group relative overflow-hidden">
        {/* HUD Corner Accents */}
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        {/* Card Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-cyber-purple/10 border border-cyber-purple/40 flex items-center justify-center text-cyber-purple shadow-neon-purple">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-bold text-white tracking-wide text-sm">
                  TOTAL TRAFFIC
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30">
                  GATEWAY
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">Всего через сервер</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-950/60 border border-cyber-purple/40 text-[11px] font-mono text-cyber-purple">
            <span className="w-2 h-2 rounded-full bg-cyber-purple animate-pulse" />
            <span>UPTIME 18D</span>
          </div>
        </div>

        {/* Telemetry Stats */}
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ArrowDownToLine className="w-3.5 h-3.5 text-cyber-cyan" />
              Скачано (RX):
            </span>
            <span className="font-bold text-cyber-cyan text-sm">
              {formatBytes(systemStats.totalRxBytes)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ArrowUpFromLine className="w-3.5 h-3.5 text-cyber-pink" />
              Отдано (TX):
            </span>
            <span className="font-bold text-cyber-pink text-sm">
              {formatBytes(systemStats.totalTxBytes)}
            </span>
          </div>

          <div className="pt-1">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Память контейнера</span>
              <span className="text-cyber-purple font-semibold">{systemStats.memoryUsagePercent}% / 512 MB</span>
            </div>
            <div className="w-full bg-cosmic-950 h-2 rounded-full overflow-hidden border border-cyber-purple/20">
              <div
                className="bg-gradient-to-r from-cyber-cyan to-cyber-purple h-full rounded-full transition-all duration-500"
                style={{ width: `${systemStats.memoryUsagePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
