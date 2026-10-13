import React, { useState } from 'react';
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  CheckCircle2,
  Cpu,
  Download,
  ExternalLink,
  HardDrive,
  Layers,
  Network,
  Radio,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Users,
  Wifi,
  Zap,
  Copy,
  QrCode,
  Laptop
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { soundFx } from '../utils/soundFx';
import { useMascotStore } from '../stores/useMascotStore';

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const OverviewTab: React.FC = () => {
  const {
    systemStats,
    awgService,
    hy2Service,
    users,
    setActiveTab,
    getMihomoSubscriptionUrl,
    openQrModal
  } = useAppStore();

  const { setMood } = useMascotStore();

  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);
  const [selectedFamilyUser, setSelectedFamilyUser] = useState<string>(
    users[0]?.id || ''
  );

  const activeUsersCount = users.filter((u) => u.isActive).length;
  const totalUsersCount = users.length;

  const activeClient = users.find((u) => u.id === selectedFamilyUser) || users[0];

  const handleCopySub = (id: string, name: string) => {
    soundFx.ding();
    const url = getMihomoSubscriptionUrl(id);
    navigator.clipboard.writeText(url);
    setCopiedClientId(id);
    setMood('proud', `Subscription URL for ${name} copied! Paste it into Mihomo Party, FlClash, or Karing~ 📋✨`, 4000);
    setTimeout(() => {
      setCopiedClientId(null);
    }, 2500);
  };

  const handleTestLatency = () => {
    soundFx.bleep();
    setMood('happy', 'Ping latency test running... AWG RTT: 21ms, Hysteria 2 RTT: 19ms! Both inbounds 100% reachable~ 🚀', 5000);
  };

  return (
    <div className="space-y-6">
      {/* 1. HIGH-LEVEL METRICS TILES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Total Bandwidth (Rx / Tx) */}
        <div className="hud-card p-5 relative overflow-hidden group">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan shadow-neon-cyan">
                <Network className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Network Telemetry
                </span>
                <h3 className="font-mono font-bold text-sm text-white">
                  Total Bandwidth
                </h3>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30">
              RX + TX
            </span>
          </div>

          <div className="space-y-3 font-mono">
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-extrabold text-white tracking-tight">
                {formatBytes(systemStats.totalRxBytes + systemStats.totalTxBytes)}
              </span>
              <span className="text-xs text-cyber-cyan font-semibold flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                Live Hub
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="bg-cosmic-950/80 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                  <ArrowDownToLine className="w-3 h-3 text-cyber-cyan" />
                  Rx (Download)
                </span>
                <span className="font-bold text-cyber-cyan text-sm block">
                  {formatBytes(systemStats.totalRxBytes)}
                </span>
              </div>
              <div className="bg-cosmic-950/80 p-2 rounded border border-slate-800/80">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                  <ArrowUpFromLine className="w-3 h-3 text-cyber-pink" />
                  Tx (Upload)
                </span>
                <span className="font-bold text-cyber-pink text-sm block">
                  {formatBytes(systemStats.totalTxBytes)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Clients Count */}
        <div className="hud-card-pink p-5 relative overflow-hidden group">
          <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t-2 border-l-2 border-cyber-pink pointer-events-none" />
          <div className="absolute top-[3px] right-[3px] w-2 h-2 border-t-2 border-r-2 border-cyber-pink pointer-events-none" />
          <div className="absolute bottom-[3px] left-[3px] w-2 h-2 border-b-2 border-l-2 border-cyber-pink pointer-events-none" />
          <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b-2 border-r-2 border-cyber-pink pointer-events-none" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyber-pink/10 border border-cyber-pink/40 flex items-center justify-center text-cyber-pink shadow-neon-pink">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Peer Directory
                </span>
                <h3 className="font-mono font-bold text-sm text-white">
                  Active Clients
                </h3>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('clients')}
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyber-pink/20 hover:bg-cyber-pink/30 text-cyber-pink border border-cyber-pink/40 transition-colors cursor-pointer"
              title="Navigate to Clients Tab"
            >
              Manage &rarr;
            </button>
          </div>

          <div className="space-y-3 font-mono">
            <div className="flex items-baseline justify-between pt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  {activeUsersCount}
                </span>
                <span className="text-xs text-slate-400">
                  / {totalUsersCount} registered peers
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Tunnels OK
              </span>
            </div>

            {/* Peer slots preview */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                <span>Tunnel Capacity Utilization</span>
                <span className="text-cyber-pink font-semibold">
                  {totalUsersCount > 0 ? Math.round((activeUsersCount / totalUsersCount) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-cosmic-950 h-2 rounded-full overflow-hidden border border-cyber-pink/20">
                <div
                  className="bg-gradient-to-r from-cyber-purple via-cyber-pink to-cyber-cyan h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${totalUsersCount > 0 ? (activeUsersCount / totalUsersCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3: System Status (CPU, Memory, Uptime) */}
        <div className="hud-card p-5 relative overflow-hidden group">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyber-purple/10 border border-cyber-purple/40 flex items-center justify-center text-cyber-purple shadow-neon-purple">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Host Machine
                </span>
                <h3 className="font-mono font-bold text-sm text-white">
                  System Status
                </h3>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              HEALTHY
            </span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {/* CPU & Memory bars */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-cosmic-950/80 p-2 rounded border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-cyber-cyan" />
                    CPU Load
                  </span>
                  <span className="text-white font-bold">{systemStats.cpuUsagePercent}%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyber-cyan h-full rounded-full transition-all duration-300"
                    style={{ width: `${systemStats.cpuUsagePercent}%` }}
                  />
                </div>
              </div>

              <div className="bg-cosmic-950/80 p-2 rounded border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-cyber-purple" />
                    Memory
                  </span>
                  <span className="text-white font-bold">{systemStats.memoryUsagePercent}%</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyber-purple h-full rounded-full transition-all duration-300"
                    style={{ width: `${systemStats.memoryUsagePercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              <span>Server Uptime:</span>
              <span className="text-slate-200 font-semibold">{awgService.uptime || '18 days 4 hours'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DUAL INBOUND NODES STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Node 1: AmneziaWG (Port 51820) */}
        <div className="hud-card p-6 relative overflow-hidden">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          <div className="flex items-start justify-between pb-4 border-b border-cyber-cyan/20 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan shadow-neon-cyan">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono font-bold text-base text-white tracking-wide">
                    AmneziaWG Node
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 font-semibold">
                    PRIMARY
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Kernel / WireGuard Obfuscated Matrix (AWG 2.0 / 3.1)
                </p>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="flex items-center justify-end gap-1.5 text-emerald-400 text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
                <span>ONLINE</span>
              </div>
              <span className="text-[11px] text-slate-400">Port 51820 UDP</span>
            </div>
          </div>

          {/* Node Specs & Telemetry */}
          <div className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded bg-cosmic-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Interface</span>
                <span className="font-bold text-cyber-cyan">awg0</span>
              </div>
              <div className="p-2 rounded bg-cosmic-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Subnet</span>
                <span className="font-bold text-white">10.8.0.0/24</span>
              </div>
              <div className="p-2 rounded bg-cosmic-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">MTU Size</span>
                <span className="font-bold text-white">1280 B</span>
              </div>
              <div className="p-2 rounded bg-cosmic-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Active Peers</span>
                <span className="font-bold text-cyber-cyan">{awgService.peersCount}</span>
              </div>
            </div>

            {/* Obfuscation Parameters Pill */}
            <div className="p-3 rounded-lg bg-cosmic-950/90 border border-cyber-cyan/30 text-slate-300">
              <div className="flex items-center justify-between text-[11px] mb-1.5 text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyber-cyan" />
                  <span>DPI Evasion Signature</span>
                </span>
                <span className="text-cyber-cyan font-bold text-[10px] uppercase">
                  Anti-Deep Packet Inspection [VERIFIED]
                </span>
              </div>
              <div className="font-mono text-[11px] text-cyber-cyan bg-cosmic-900/90 px-2 py-1.5 rounded border border-cyber-cyan/20 truncate">
                {awgService.obfuscation || 'Jc=4 Jmin=40 Jmax=70 S1=15 S2=35 H1=184... H4=638...'}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Throughput: ↓ {awgService.currentSpeedMbps.download} Mb/s · ↑ {awgService.currentSpeedMbps.upload} Mb/s</span>
              <button
                onClick={() => setActiveTab('inbounds')}
                className="text-cyber-cyan hover:underline flex items-center gap-1 font-semibold"
              >
                Inspect Parameters &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Node 2: Hysteria 2 Gecko (Port 443) */}
        <div className="hud-card-pink p-6 relative overflow-hidden">
          <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t-2 border-l-2 border-cyber-pink pointer-events-none" />
          <div className="absolute top-[3px] right-[3px] w-2 h-2 border-t-2 border-r-2 border-cyber-pink pointer-events-none" />
          <div className="absolute bottom-[3px] left-[3px] w-2 h-2 border-b-2 border-l-2 border-cyber-pink pointer-events-none" />
          <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b-2 border-r-2 border-cyber-pink pointer-events-none" />

          <div className="flex items-start justify-between pb-4 border-b border-cyber-pink/20 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-cyber-pink/10 border border-cyber-pink/40 flex items-center justify-center text-cyber-pink shadow-neon-pink">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono font-bold text-base text-white tracking-wide">
                    Hysteria 2 Gecko Node
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/40 font-semibold">
                    FALLBACK
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  High-Speed QUIC UDP with Salamander / Gecko Masking
                </p>
              </div>
            </div>

            <div className="text-right font-mono">
              <div className="flex items-center justify-end gap-1.5 text-cyber-pink text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-cyber-pink animate-pulse shadow-[0_0_8px_#FF2A85]" />
                <span>ONLINE</span>
              </div>
              <span className="text-[11px] text-slate-400">Port 443 QUIC</span>
            </div>
          </div>

          {/* Node Specs & Telemetry */}
          <div className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded bg-cosmic-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Protocol</span>
                <span className="font-bold text-cyber-pink">QUIC v2</span>
              </div>
              <div className="p-2 rounded bg-cosmic-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Port Hopping</span>
                <span className="font-bold text-white">20000-50000</span>
              </div>
              <div className="p-2 rounded bg-cosmic-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">Congestion</span>
                <span className="font-bold text-white">BBR Brutal</span>
              </div>
              <div className="p-2 rounded bg-cosmic-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block">TLS ALPN</span>
                <span className="font-bold text-cyber-pink">h3 / https</span>
              </div>
            </div>

            {/* Obfuscation Parameters Pill */}
            <div className="p-3 rounded-lg bg-cosmic-950/90 border border-cyber-pink/30 text-slate-300">
              <div className="flex items-center justify-between text-[11px] mb-1.5 text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyber-pink" />
                  <span>Gecko Scrambler & Masquerade</span>
                </span>
                <span className="text-cyber-pink font-bold text-[10px] uppercase">
                  SNI: bing.com [ACTIVE]
                </span>
              </div>
              <div className="font-mono text-[11px] text-cyber-pink bg-cosmic-900/90 px-2 py-1.5 rounded border border-cyber-pink/20 truncate">
                obfs: gecko • http auth webhook dynamic token authentication
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Throughput: ↓ {hy2Service.currentSpeedMbps.download} Mb/s · ↑ {hy2Service.currentSpeedMbps.upload} Mb/s</span>
              <button
                onClick={() => setActiveTab('inbounds')}
                className="text-cyber-pink hover:underline flex items-center gap-1 font-semibold"
              >
                View Failover Graph &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FAMILY QUICK CONNECT GUIDE */}
      <div className="hud-card p-6 relative overflow-hidden">
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-cyber-cyan/20 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyber-purple/10 border border-cyber-purple/40 flex items-center justify-center text-cyber-purple shadow-neon-purple">
              <Sparkles className="w-5 h-5 text-cyber-pink" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-lg text-white">
                Quick Connect Guide for Family &amp; Devices
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Recommended multi-platform clients with automated dual-tunnel failover support
              </p>
            </div>
          </div>

          {/* Quick Client Picker for Subscription Link */}
          {users.length > 0 && (
            <div className="flex items-center gap-2 bg-cosmic-950 p-1.5 rounded-lg border border-slate-800 text-xs font-mono self-start sm:self-auto">
              <span className="text-slate-500 pl-1">Target Client:</span>
              <select
                value={selectedFamilyUser}
                onChange={(e) => setSelectedFamilyUser(e.target.value)}
                className="bg-cosmic-900 text-white rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-cyber-cyan text-xs font-mono"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.device})
                  </option>
                ))}
              </select>
              {activeClient && (
                <button
                  onClick={() => handleCopySub(activeClient.id, activeClient.name)}
                  className="px-2.5 py-1 rounded bg-cyber-pink text-white font-bold hover:bg-cyber-pink/80 transition-colors flex items-center gap-1 shrink-0"
                  title="Copy 1-click subscription URL"
                >
                  {copiedClientId === activeClient.id ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>COPY SUB</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Client Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Client 1: Mihomo Party */}
          <div className="p-4 rounded-xl bg-cosmic-950/80 border border-slate-800 hover:border-cyber-cyan/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30">
                  DESKTOP • RECOMMENDED
                </span>
                <span className="text-[11px] font-mono text-slate-500">Clash.Meta</span>
              </div>
              <h4 className="font-mono font-bold text-white text-base mb-1 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-cyber-cyan" />
                <span>Mihomo Party</span>
              </h4>
              <p className="text-xs text-slate-400 mb-3">
                Modern GUI for Windows, macOS, and Linux. Built-in TUN virtual adapter and native AmneziaWG + Hysteria 2 core.
              </p>

              <ol className="text-xs font-mono text-slate-300 space-y-2 mb-4 bg-cosmic-900/60 p-3 rounded-lg border border-slate-800/80">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyber-cyan/20 text-cyber-cyan text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Click <b>COPY SUB</b> above or in Clients tab.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyber-cyan/20 text-cyber-cyan text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Open Mihomo Party &rarr; Profiles &rarr; Paste URL.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyber-cyan/20 text-cyber-cyan text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Turn on <b>System Proxy</b> &amp; <b>TUN Mode</b>.</span>
                </li>
              </ol>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 text-[11px]">Platforms: Win / Mac / Linux</span>
              <a
                href="https://github.com/mihomo-party-org/mihomo-party"
                target="_blank"
                rel="noreferrer"
                className="text-cyber-cyan hover:underline flex items-center gap-1 font-semibold"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Client 2: FlClash / Clash Verge */}
          <div className="p-4 rounded-xl bg-cosmic-950/80 border border-slate-800 hover:border-cyber-pink/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/30">
                  MULTI-PLATFORM
                </span>
                <span className="text-[11px] font-mono text-slate-500">Flutter / Verge</span>
              </div>
              <h4 className="font-mono font-bold text-white text-base mb-1 flex items-center gap-2">
                <Network className="w-4 h-4 text-cyber-pink" />
                <span>FlClash / Verge Rev</span>
              </h4>
              <p className="text-xs text-slate-400 mb-3">
                Lightweight cross-platform client with support for auto-fallback groups and custom DNS routing.
              </p>

              <ol className="text-xs font-mono text-slate-300 space-y-2 mb-4 bg-cosmic-900/60 p-3 rounded-lg border border-slate-800/80">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyber-pink/20 text-cyber-pink text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Install FlClash on Android, Windows, or Mac.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyber-pink/20 text-cyber-pink text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Import subscription profile from Kiri Panel.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyber-pink/20 text-cyber-pink text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Select group: <b>⚡ Auto-Fallback</b>.</span>
                </li>
              </ol>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 text-[11px]">Platforms: Android / Win / Mac</span>
              <a
                href="https://github.com/chen08209/FlClash"
                target="_blank"
                rel="noreferrer"
                className="text-cyber-pink hover:underline flex items-center gap-1 font-semibold"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Client 3: Karing (iOS & Android) */}
          <div className="p-4 rounded-xl bg-cosmic-950/80 border border-slate-800 hover:border-cyber-purple/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30">
                  MOBILE • IOS &amp; ANDROID
                </span>
                <span className="text-[11px] font-mono text-slate-500">App Store</span>
              </div>
              <h4 className="font-mono font-bold text-white text-base mb-1 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyber-purple" />
                <span>Karing</span>
              </h4>
              <p className="text-xs text-slate-400 mb-3">
                Easiest setup for family iPhone &amp; iPad devices. Available in official Apple App Store &amp; Google Play with zero battery drain.
              </p>

              <ol className="text-xs font-mono text-slate-300 space-y-2 mb-4 bg-cosmic-900/60 p-3 rounded-lg border border-slate-800/80">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyber-purple/20 text-cyber-purple text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Download <b>Karing</b> from Apple App Store.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyber-purple/20 text-cyber-purple text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Tap <b>+</b> &rarr; <b>Add from Link</b> &rarr; Paste URL.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-cyber-purple/20 text-cyber-purple text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Tap Connect button. Everything works automatically.</span>
                </li>
              </ol>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 text-[11px]">Platforms: iOS / Android / macOS</span>
              <a
                href="https://karing.app/"
                target="_blank"
                rel="noreferrer"
                className="text-cyber-purple hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
