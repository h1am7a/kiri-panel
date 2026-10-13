import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  QrCode,
  Copy,
  Download,
  Trash2,
  Check,
  Smartphone,
  Laptop,
  Monitor,
  Router,
  HardDrive,
  Calendar,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  AlertTriangle,
  Radio,
  CheckCircle2,
  XCircle,
  LucideIcon
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { soundFx } from '../utils/soundFx';
import { useMascotStore } from '../stores/useMascotStore';
import { User } from '../types';

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getDeviceIcon(device: string): LucideIcon {
  const d = device.toLowerCase();
  if (d.includes('router') || d.includes('openwrt') || d.includes('keenetic') || d.includes('mikrotik')) {
    return Router;
  }
  if (d.includes('mac') || d.includes('laptop') || d.includes('notebook') || d.includes('thinkpad')) {
    return Laptop;
  }
  if (d.includes('pc') || d.includes('windows') || d.includes('desktop') || d.includes('linux')) {
    return Monitor;
  }
  if (d.includes('iphone') || d.includes('ipad') || d.includes('android') || d.includes('pixel') || d.includes('samsung') || d.includes('phone')) {
    return Smartphone;
  }
  return HardDrive;
}

type FilterStatus = 'all' | 'active' | 'disabled';

export const ClientsTab: React.FC = () => {
  const {
    users,
    toggleUserStatus,
    deleteUser,
    openQrModal,
    setAddUserModalOpen,
    getMihomoSubscriptionUrl,
    getWireguardConfigText,
    searchQuery,
    setSearchQuery,
  } = useAppStore();

  const { setMood } = useMascotStore();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<User | null>(null);

  // Statistics counters
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.isActive).length;
  const disabledCount = totalCount - activeCount;

  // Filtered & searched users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status filter
      if (filterStatus === 'active' && !u.isActive) return false;
      if (filterStatus === 'disabled' && u.isActive) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(query);
        const matchesDevice = u.device.toLowerCase().includes(query);
        const matchesIp = u.ipAddress.includes(query);
        const matchesRole = u.role.toLowerCase().includes(query);
        if (!matchesName && !matchesDevice && !matchesIp && !matchesRole) {
          return false;
        }
      }

      return true;
    });
  }, [users, filterStatus, searchQuery]);

  const handleCopySubscription = (user: User) => {
    soundFx.ding();
    const url = getMihomoSubscriptionUrl(user.id);
    navigator.clipboard.writeText(url);
    setCopiedId(user.id);
    setMood(
      'proud',
      `Mihomo subscription for ${user.name} copied to clipboard! Ready to paste~ 📋✨`,
      4000
    );
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleDownloadConf = async (user: User) => {
    soundFx.ding();
    try {
      const res = await fetch(`/api/users/${user.id}/raw-conf`);
      if (res.ok) {
        const conf = await res.text();
        const element = document.createElement('a');
        const file = new Blob([conf], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${user.name.toLowerCase().replace(/\s+/g, '_')}_kiri_awg.conf`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        setMood(
          'happy',
          `Native AmneziaWG config for ${user.name} downloaded! Ready for import~ 🛡️`,
          4000
        );
        return;
      }
    } catch {
      // Fallback below
    }

    const conf = getWireguardConfigText(user);
    const element = document.createElement('a');
    const file = new Blob([conf], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${user.name.toLowerCase().replace(/\s+/g, '_')}_kiri_awg.conf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setMood(
      'happy',
      `Native AmneziaWG config for ${user.name} downloaded! Ready for import~ 🛡️`,
      4000
    );
  };

  const handleToggle = (user: User) => {
    toggleUserStatus(user.id);
    const nextState = !user.isActive;
    setMood(
      nextState ? 'happy' : 'alert',
      nextState
        ? `Tunnel activated for ${user.name}! Connection restored.`
        : `Tunnel disabled for ${user.name}. Traffic blocked.`,
      3500
    );
  };

  const confirmDelete = () => {
    if (!clientToDelete) return;
    soundFx.bleep();
    const clientName = clientToDelete.name;
    deleteUser(clientToDelete.id);
    setMood('alert', `Client ${clientName} revoked and deleted from routing table.`, 4000);
    setClientToDelete(null);
  };

  return (
    <div className="hud-card p-6 relative overflow-hidden">
      {/* Corner Brackets */}
      <div className="hud-corner-tl" />
      <div className="hud-corner-tr" />
      <div className="hud-corner-bl" />
      <div className="hud-corner-br" />

      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyber-cyan/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan shadow-neon-cyan">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-mono font-bold text-lg text-white tracking-wide">
                CLIENTS &amp; PEERS
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 flex items-center gap-1.5">
                <Radio className="w-3 h-3 animate-pulse text-cyber-cyan" />
                <span>{activeCount} active / {totalCount} total</span>
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Manage WireGuard / AmneziaWG endpoints &amp; Hysteria 2 subscriptions
            </p>
          </div>
        </div>

        {/* Action Button: Add Client */}
        <button
          onClick={() => {
            soundFx.bleep();
            setAddUserModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyber-pink hover:bg-cyber-pink/90 text-white font-mono text-xs font-bold transition-all shadow-neon-pink self-start md:self-auto shrink-0 group"
        >
          <UserPlus className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span>+ Add Client</span>
        </button>
      </div>

      {/* Controls Bar: Search & Status Filters */}
      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, IP, device..."
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-cosmic-950/90 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyber-cyan focus:shadow-neon-cyan transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Segmented Pills */}
        <div className="flex items-center gap-1 p-1 bg-cosmic-950/80 rounded-lg border border-slate-800 text-xs font-mono self-start sm:self-auto">
          <button
            onClick={() => {
              soundFx.bleep();
              setFilterStatus('all');
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => {
              soundFx.bleep();
              setFilterStatus('active');
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              filterStatus === 'active'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active ({activeCount})
          </button>
          <button
            onClick={() => {
              soundFx.bleep();
              setFilterStatus('disabled');
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              filterStatus === 'disabled'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Disabled ({disabledCount})
          </button>
        </div>
      </div>

      {/* Clients List / Table */}
      <div className="mt-4">
        {filteredUsers.length === 0 ? (
          <div className="py-14 text-center font-mono text-slate-500">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 border border-slate-700">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No clients match your filter</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting the search query or status filter.
            </p>
            {(searchQuery || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
                className="mt-4 px-3 py-1.5 rounded bg-cosmic-950 border border-slate-700 text-xs text-cyber-cyan hover:border-cyber-cyan transition-colors"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((client) => {
              const DeviceIcon = getDeviceIcon(client.device);
              const isCopied = copiedId === client.id;

              return (
                <div
                  key={client.id}
                  className={`p-4 rounded-xl border transition-all ${
                    client.isActive
                      ? 'bg-cosmic-950/70 border-slate-800/90 hover:border-cyber-cyan/40 hover:bg-cosmic-900/60 shadow-sm'
                      : 'bg-cosmic-950/40 border-slate-900 opacity-70 hover:opacity-90'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Primary Info: Avatar, Name, Role, IP, Device */}
                    <div className="flex items-center gap-3.5 min-w-[280px]">
                      {/* Avatar with Status Dot */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-xl bg-cosmic-900 border border-slate-700 flex items-center justify-center text-xl select-none shadow-inner">
                          {client.avatar || '🌸'}
                        </div>
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-cosmic-950 ${
                            client.isActive
                              ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                              : 'bg-slate-600'
                          }`}
                          title={client.isActive ? 'Active' : 'Disabled'}
                        />
                      </div>

                      {/* Name & Role Tag & Meta */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-mono font-bold text-sm text-white truncate">
                            {client.name}
                          </h3>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold tracking-wider ${
                              client.role === 'family'
                                ? 'bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/30'
                                : 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30'
                            }`}
                          >
                            {client.role}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 text-xs font-mono text-slate-400 mt-1 flex-wrap">
                          {/* IP Address */}
                          <span className="text-cyber-cyan font-bold bg-cyber-cyan/10 px-1.5 py-0.5 rounded border border-cyber-cyan/20">
                            {client.ipAddress}
                          </span>
                          <span className="text-slate-600">•</span>
                          {/* Device with detected icon */}
                          <span
                            className="flex items-center gap-1.5 text-slate-300 truncate max-w-[220px]"
                            title={client.device}
                          >
                            <DeviceIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{client.device}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Info: Traffic, Created Date, Status Switch */}
                    <div className="flex items-center justify-between sm:justify-start gap-6 lg:gap-8 font-mono text-xs text-slate-300 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/60">
                      {/* Used Traffic Breakdown */}
                      <div className="min-w-[120px]">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                          Used Traffic
                        </span>
                        <span className="text-white font-bold text-xs">
                          {formatBytes(client.rxBytes + client.txBytes)}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-0.5 text-cyber-cyan">
                            <ArrowDownToLine className="w-2.5 h-2.5" />
                            {formatBytes(client.rxBytes)}
                          </span>
                          <span className="flex items-center gap-0.5 text-cyber-pink">
                            <ArrowUpFromLine className="w-2.5 h-2.5" />
                            {formatBytes(client.txBytes)}
                          </span>
                        </div>
                      </div>

                      {/* Date Created */}
                      <div className="hidden sm:block min-w-[100px]">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          Created
                        </span>
                        <span className="text-slate-300 text-xs mt-0.5 block">
                          {client.createdAt || 'Recent'}
                        </span>
                      </div>

                      {/* Status Toggle Switch */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                          Status
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={client.isActive}
                          onClick={() => handleToggle(client)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            client.isActive
                              ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                              : 'bg-slate-700'
                          }`}
                          title={client.isActive ? 'Click to disable client' : 'Click to activate client'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              client.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Right Actions Toolbar: Copy Mihomo, QR Code, Download .conf, Delete */}
                    <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/60 justify-end shrink-0">
                      {/* Copy Mihomo URL Button */}
                      <button
                        onClick={() => handleCopySubscription(client)}
                        className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isCopied
                            ? 'bg-cyber-pink text-white border-cyber-pink shadow-neon-pink'
                            : 'bg-cosmic-950 hover:bg-cyber-pink/20 text-cyber-pink border-cyber-pink/40 hover:border-cyber-pink'
                        }`}
                        title="Copy 1-click Mihomo / Clash subscription URL"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>COPY URL</span>
                          </>
                        )}
                      </button>

                      {/* QR Code Modal Button */}
                      <button
                        onClick={() => {
                          soundFx.bleep();
                          openQrModal(client);
                        }}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-cosmic-950 hover:bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 hover:border-cyber-cyan font-mono text-xs flex items-center gap-1.5 transition-all"
                        title="Show connection QR Code for mobile"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">QR CODE</span>
                      </button>

                      {/* Download native AmneziaWG .conf */}
                      <button
                        onClick={() => handleDownloadConf(client)}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-cosmic-950 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-500 font-mono text-xs flex items-center gap-1.5 transition-all"
                        title="Download native AmneziaWG .conf config"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">.CONF</span>
                      </button>

                      {/* Delete Client Button */}
                      <button
                        onClick={() => {
                          soundFx.bleep();
                          setClientToDelete(client);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/30 transition-all"
                        title="Delete client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-sm bg-cosmic-850 border border-rose-500/50 rounded-xl p-5 shadow-2xl overflow-hidden font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Delete Client?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <span className="text-white font-bold">{clientToDelete.name}</span>?
              This will revoke all AmneziaWG Curve25519 keys, Hysteria 2 tokens, and drop all active tunnels.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-rose-900/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
