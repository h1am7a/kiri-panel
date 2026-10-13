import React, { useState } from 'react';
import {
  Shield,
  Zap,
  Radio,
  Server,
  Layers,
  Network,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Code,
  Terminal,
  Activity,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Wifi,
  Lock,
  Globe
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { soundFx } from '../utils/soundFx';
import { useMascotStore } from '../stores/useMascotStore';

export const InboundsTab: React.FC = () => {
  const { awgService, hy2Service, users } = useAppStore();
  const { setMood } = useMascotStore();

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'awg' | 'hy2' | 'failover'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showRawSnippet, setShowRawSnippet] = useState(false);

  const activePeers = users.filter((u) => u.isActive);

  const handleCopy = (text: string, label: string) => {
    soundFx.ding();
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setMood('proud', `${label} copied to clipboard! 📋`, 3500);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const awgParams = [
    { key: 'Jc', name: 'Junk Packet Count', value: '4', desc: 'Number of random noise UDP packets injected before handshake.' },
    { key: 'Jmin', name: 'Junk Size Min', value: '40 B', desc: 'Lower bound for noise packet payload length.' },
    { key: 'Jmax', name: 'Junk Size Max', value: '70 B', desc: 'Upper bound for noise packet payload length.' },
    { key: 'S1', name: 'Init Junk Size', value: '15 B', desc: 'Random padding prepended to Client Initiation message.' },
    { key: 'S2', name: 'Response Junk Size', value: '35 B', desc: 'Random padding prepended to Server Response message.' },
    { key: 'H1', name: 'Initiation Magic Header', value: '184523910', desc: 'Substituted 32-bit header identifier replacing standard WireGuard 0x01.' },
    { key: 'H2', name: 'Response Magic Header', value: '918237461', desc: 'Substituted 32-bit header identifier replacing standard WireGuard 0x02.' },
    { key: 'H3', name: 'Cookie Magic Header', value: '472819382', desc: 'Substituted 32-bit header identifier replacing standard WireGuard 0x03.' },
    { key: 'H4', name: 'Data Magic Header', value: '638291047', desc: 'Substituted 32-bit header identifier replacing standard WireGuard 0x04.' },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS & PROTOCOL SELECTOR */}
      <div className="hud-card p-6 relative overflow-hidden">
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan shadow-neon-cyan">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono font-bold text-lg text-white tracking-wide">
                  PROTOCOL INBOUNDS &amp; DAEMONS
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  DUAL-STACK ONLINE
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Runtime inspector for AmneziaWG (Kernel/Go) and Hysteria 2 (Gecko QUIC)
              </p>
            </div>
          </div>

          {/* Sub-navigation Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-cosmic-950/80 rounded-lg border border-slate-800 text-xs font-mono self-start md:self-auto">
            <button
              onClick={() => {
                soundFx.bleep();
                setActiveSubTab('all');
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeSubTab === 'all'
                  ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Inbounds
            </button>
            <button
              onClick={() => {
                soundFx.bleep();
                setActiveSubTab('awg');
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeSubTab === 'awg'
                  ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>AmneziaWG</span>
            </button>
            <button
              onClick={() => {
                soundFx.bleep();
                setActiveSubTab('hy2');
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeSubTab === 'hy2'
                  ? 'bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Hysteria 2</span>
            </button>
            <button
              onClick={() => {
                soundFx.bleep();
                setActiveSubTab('failover');
              }}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeSubTab === 'failover'
                  ? 'bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Failover Logic</span>
            </button>
          </div>
        </div>
      </div>

      {/* FAILOVER LOGIC DIAGRAM (Featured when selected or 'all') */}
      {(activeSubTab === 'all' || activeSubTab === 'failover') && (
        <div className="hud-card p-6 relative overflow-hidden">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-cyber-cyan/20 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyber-purple/10 border border-cyber-purple/40 flex items-center justify-center text-cyber-purple shadow-neon-purple">
                <Activity className="w-4 h-4 text-cyber-purple" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-base text-white">
                  Mihomo Dynamic Failover Architecture
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  Zero-downtime automatic handover when ISP or Deep Packet Inspection (DPI) throttles UDP
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRawSnippet(!showRawSnippet)}
              className="text-xs font-mono px-3 py-1.5 rounded bg-cosmic-950 border border-slate-700 hover:border-cyber-purple text-cyber-purple transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{showRawSnippet ? 'Hide Meta YAML' : 'View Meta YAML'}</span>
            </button>
          </div>

          {/* Interactive Visual Failover Architecture Diagram */}
          <div className="bg-cosmic-950/90 rounded-xl p-6 border border-slate-800 text-xs font-mono">
            <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
              {/* Step 1: Client Application */}
              <div className="lg:col-span-3 p-4 rounded-xl bg-cosmic-900 border border-slate-700 text-center relative group">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">
                  1. Client Node
                </span>
                <div className="text-white font-bold text-sm mb-1">
                  Mihomo / Clash Core
                </div>
                <div className="text-[11px] text-cyber-cyan">
                  TUN Mode • Virtual Adapter
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Health Check Ping: <code className="text-slate-300">cp.cloudflare.com</code> every 300s
                </p>
              </div>

              {/* Arrow Connector 1 */}
              <div className="lg:col-span-1 flex justify-center text-slate-600">
                <ArrowRight className="w-6 h-6 rotate-90 lg:rotate-0 text-cyber-cyan animate-pulse" />
              </div>

              {/* Step 2: Fallback Controller Engine */}
              <div className="lg:col-span-3 p-4 rounded-xl bg-cosmic-900 border border-cyber-purple/40 text-center shadow-neon-purple relative">
                <span className="text-[10px] uppercase tracking-wider text-cyber-purple font-bold block mb-1">
                  2. Proxy Group
                </span>
                <div className="text-white font-bold text-sm mb-1">
                  Auto-Fallback Engine
                </div>
                <div className="text-[11px] text-emerald-400 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Max RTT Threshold: 2000ms</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Routes traffic to Primary. Switches to Secondary on packet loss.
                </p>
              </div>

              {/* Arrow Connector 2 */}
              <div className="lg:col-span-1 flex justify-center text-slate-600">
                <ArrowRight className="w-6 h-6 rotate-90 lg:rotate-0 text-cyber-pink animate-pulse" />
              </div>

              {/* Step 3: Dual Inbound Destination Endpoints */}
              <div className="lg:col-span-3 space-y-2.5">
                {/* Primary Route */}
                <div className="p-3 rounded-lg bg-cosmic-900/90 border border-cyber-cyan/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyber-cyan" />
                    <div>
                      <div className="text-white font-bold text-xs flex items-center gap-1.5">
                        <span>AmneziaWG</span>
                        <span className="text-[9px] px-1 rounded bg-cyber-cyan/20 text-cyber-cyan">PRIORITY 1</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Port 51820 UDP • MTU 1280</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40">
                    ACTIVE
                  </span>
                </div>

                {/* Secondary Backup Route */}
                <div className="p-3 rounded-lg bg-cosmic-900/90 border border-cyber-pink/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyber-pink" />
                    <div>
                      <div className="text-white font-bold text-xs flex items-center gap-1.5">
                        <span>Hysteria 2 Gecko</span>
                        <span className="text-[9px] px-1 rounded bg-cyber-pink/20 text-cyber-pink">BACKUP</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Port 443 + Port-Hopping</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-cyber-pink px-1.5 py-0.5 rounded bg-pink-950/60 border border-cyber-pink/40">
                    STANDBY
                  </span>
                </div>
              </div>
            </div>

            {/* Live Explanation Footer */}
            <div className="mt-4 p-3 rounded-lg bg-cosmic-950 border border-slate-800 text-slate-400 text-[11px] leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-cyber-cyan shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-semibold">How Anti-Censorship Failover Operates: </span>
                Clients connect to AmneziaWG for raw kernel-speed UDP wire speed. If deep packet inspection or cellular carriers throttle or drop WireGuard UDP handshakes, the Mihomo Meta core detects the packet loss within 2 seconds and instantaneously switches all active connections to the Hysteria 2 Gecko QUIC stream without dropping the user's active session.
              </div>
            </div>
          </div>

          {/* Collapsible YAML Snippet Preview */}
          {showRawSnippet && (
            <div className="mt-4 p-4 rounded-xl bg-cosmic-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
              <div className="flex items-center justify-between text-slate-500 pb-2 mb-2 border-b border-slate-800 text-[10px] uppercase">
                <span>mihomo.yaml // proxy-groups fallback definition</span>
                <span className="text-cyber-purple font-bold">YAML SYNTAX</span>
              </div>
              <pre className="text-emerald-400 leading-relaxed">{`proxy-groups:
  - name: "AUTO-FAILOVER"
    type: fallback
    url: "http://cp.cloudflare.com/generate_204"
    interval: 300
    tolerance: 50
    proxies:
      - "AmneziaWG • Primary"
      - "Hysteria 2 • Backup"

proxies:
  - name: "AmneziaWG • Primary"
    type: wireguard
    server: server.domain.com
    port: 51820
    ip: 10.8.0.2
    public-key: "<SERVER_PUBLIC_KEY>"
    private-key: "<CLIENT_PRIVATE_KEY>"
    mtu: 1280
    remote-dns-resolve: true

  - name: "Hysteria 2 • Backup"
    type: hysteria2
    server: server.domain.com
    port: 443
    ports: 20000-50000
    password: "<CLIENT_HY2_TOKEN>"
    obfs: gecko
    obfs-password: "<GECKO_SECRET>"
    sni: server.domain.com`}</pre>
            </div>
          )}
        </div>
      )}

      {/* AMNEZIAWG PROTOCOL INSPECTOR */}
      {(activeSubTab === 'all' || activeSubTab === 'awg') && (
        <div className="hud-card p-6 relative overflow-hidden">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-cyber-cyan/20 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan shadow-neon-cyan">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono font-bold text-lg text-white">
                    AmneziaWG Inbound Inspector
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 font-semibold">
                    AWG 2.0 / 3.1
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Userspace / Kernel module with Junk Packet Matrix &amp; Custom Header Signatures
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>DAEMON ACTIVE</span>
              </span>
              <span className="px-2.5 py-1 rounded bg-cosmic-950 border border-slate-700 text-slate-300">
                awg0
              </span>
            </div>
          </div>

          {/* Interface & Network Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-mono text-xs">
            <div className="p-3 rounded-lg bg-cosmic-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Interface Name</span>
              <span className="font-bold text-cyber-cyan text-sm">awg0</span>
              <span className="text-[10px] text-slate-500 block mt-1">Linux Kernel / wg-quick</span>
            </div>

            <div className="p-3 rounded-lg bg-cosmic-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Listen Port</span>
              <span className="font-bold text-white text-sm">51820 UDP</span>
              <span className="text-[10px] text-slate-500 block mt-1">Direct Binding</span>
            </div>

            <div className="p-3 rounded-lg bg-cosmic-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Tunnel Subnet</span>
              <span className="font-bold text-white text-sm">10.8.0.0/24</span>
              <span className="text-[10px] text-slate-500 block mt-1">Gateway: 10.8.0.1</span>
            </div>

            <div className="p-3 rounded-lg bg-cosmic-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Interface MTU</span>
              <span className="font-bold text-white text-sm">1280 Bytes</span>
              <span className="text-[10px] text-slate-500 block mt-1">Optimized for IPv6/IPv4</span>
            </div>
          </div>

          {/* Obfuscation Parameters Inspector Grid */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <h4 className="font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyber-cyan" />
                <span>Anti-DPI Obfuscation Parameters (Junk Packet Matrix)</span>
              </h4>
              <span className="text-[10px] text-cyber-cyan bg-cyber-cyan/10 px-2 py-0.5 rounded border border-cyber-cyan/20">
                ACTIVE IN CONF
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
              {awgParams.map((p) => (
                <div key={p.key} className="p-3 rounded-lg bg-cosmic-950/90 border border-slate-800 hover:border-cyber-cyan/40 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-cyber-cyan text-sm">{p.key}</span>
                    <span className="text-white font-bold bg-cosmic-900 px-2 py-0.5 rounded border border-slate-700">
                      {p.value}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-300 text-[11px] mb-1">{p.name}</div>
                  <p className="text-[10px] text-slate-500 leading-normal">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Peers Table */}
          <div>
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyber-cyan" />
                <span>Active AWG Peer Routing Table ({activePeers.length} Peers)</span>
              </h4>
              <span className="text-[10px] text-slate-400">Synchronized with awg syncconf</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800 font-mono text-xs">
              <table className="w-full text-left bg-cosmic-950/80">
                <thead className="bg-cosmic-900/90 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Peer / User</th>
                    <th className="p-3">Allowed IP</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Traffic (Rx / Tx)</th>
                    <th className="p-3">Keepalive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {users.map((peer) => (
                    <tr key={peer.id} className="hover:bg-cosmic-900/50 transition-colors">
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <span>{peer.avatar || '✨'}</span>
                        <span>{peer.name}</span>
                      </td>
                      <td className="p-3 text-cyber-cyan font-bold">{peer.ipAddress}/32</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          peer.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {peer.isActive ? 'ONLINE' : 'MUTED'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">
                        ↓ {(peer.rxBytes / (1024 * 1024 * 1024)).toFixed(1)} GB · ↑ {(peer.txBytes / (1024 * 1024 * 1024)).toFixed(1)} GB
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">25s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* HYSTERIA 2 GECKO INSPECTOR */}
      {(activeSubTab === 'all' || activeSubTab === 'hy2') && (
        <div className="hud-card-pink p-6 relative overflow-hidden">
          <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t-2 border-l-2 border-cyber-pink pointer-events-none" />
          <div className="absolute top-[3px] right-[3px] w-2 h-2 border-t-2 border-r-2 border-cyber-pink pointer-events-none" />
          <div className="absolute bottom-[3px] left-[3px] w-2 h-2 border-b-2 border-l-2 border-cyber-pink pointer-events-none" />
          <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b-2 border-r-2 border-cyber-pink pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-cyber-pink/20 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyber-pink/10 border border-cyber-pink/40 flex items-center justify-center text-cyber-pink shadow-neon-pink">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono font-bold text-lg text-white">
                    Hysteria 2 Gecko QUIC Inspector
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/40 font-semibold">
                    GECKO OBFUSCATION
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Brutal BBR Congestion Control with HTTP Auth Webhooks &amp; TLS Masquerading
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded bg-pink-950/60 border border-cyber-pink/40 text-cyber-pink flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyber-pink animate-pulse" />
                <span>SERVER RUNNING</span>
              </span>
              <span className="px-2.5 py-1 rounded bg-cosmic-950 border border-slate-700 text-slate-300">
                Port 443
              </span>
            </div>
          </div>

          {/* Network & Security Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 font-mono text-xs">
            <div className="p-3 rounded-lg bg-cosmic-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Listen Port</span>
              <span className="font-bold text-cyber-pink text-sm">443 UDP</span>
              <span className="text-[10px] text-slate-500 block mt-1">QUIC Standard Port</span>
            </div>

            <div className="p-3 rounded-lg bg-cosmic-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Port-Hopping Range</span>
              <span className="font-bold text-white text-sm">20000 - 50000</span>
              <span className="text-[10px] text-slate-500 block mt-1">Dynamic Multi-port Mapping</span>
            </div>

            <div className="p-3 rounded-lg bg-cosmic-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Obfuscation Type</span>
              <span className="font-bold text-cyber-pink text-sm">gecko (Salamander)</span>
              <span className="text-[10px] text-slate-500 block mt-1">Full Packet Scrambler</span>
            </div>

            <div className="p-3 rounded-lg bg-cosmic-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Masquerade URL</span>
              <span className="font-bold text-white text-sm">https://bing.com</span>
              <span className="text-[10px] text-slate-500 block mt-1">Active Probe Defense</span>
            </div>
          </div>

          {/* Advanced Inbound Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* HTTP Webhook Auth URL Card */}
            <div className="p-4 rounded-xl bg-cosmic-950/90 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyber-pink" />
                  <span>Webhook Authentication Endpoint</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">200 OK</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Validates user tokens synchronously without restarting the Hysteria daemon when new clients are created:
              </p>
              <div className="bg-cosmic-900/90 p-2.5 rounded border border-cyber-pink/20 flex items-center justify-between text-cyber-pink text-[11px]">
                <code className="truncate">http://127.0.0.1:8080/api/internal/hy2/auth</code>
                <button
                  onClick={() => handleCopy('http://127.0.0.1:8080/api/internal/hy2/auth', 'Auth Webhook')}
                  className="ml-2 text-slate-400 hover:text-white"
                  title="Copy webhook URL"
                >
                  {copiedKey === 'Auth Webhook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* TLS Certificate Status Card */}
            <div className="p-4 rounded-xl bg-cosmic-950/90 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyber-purple" />
                  <span>TLS Certificate &amp; Cipher Suite</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">VALID</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                TLS 1.3 / QUIC handshake with modern elliptic curve cryptography:
              </p>
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-500">Certificate Type:</span>
                  <span className="text-white">Let's Encrypt / Self-Signed SAN</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span className="text-slate-500">ALPN Protocols:</span>
                  <span className="text-cyber-pink">h3, https</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Congestion Control:</span>
                  <span className="text-cyber-cyan font-bold">BBR Brutal Rate Limiter</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
