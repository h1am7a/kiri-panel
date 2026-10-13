import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  QrCode, 
  Copy, 
  Download, 
  Trash2, 
  Power, 
  Check, 
  Smartphone,
  ArrowDownToLine,
  ArrowUpFromLine
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

export const UserList: React.FC = () => {
  const { 
    users, 
    toggleUserStatus, 
    deleteUser, 
    openQrModal, 
    setAddUserModalOpen,
    getMihomoSubscriptionUrl,
    getWireguardConfigText,
    searchQuery,
    setSearchQuery
  } = useAppStore();

  const { setMood } = useMascotStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.ipAddress.includes(searchQuery)
  );

  const handleCopySubscription = (user: User) => {
    soundFx.ding();
    const url = getMihomoSubscriptionUrl(user.id);
    navigator.clipboard.writeText(url);
    setCopiedId(user.id);
    setMood('proud', `Mihomo subscription for ${user.name} copied! Paste it into your client profile~ 📋✨`, 4000);
    setTimeout(() => setCopiedId(null), 2000);
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
        setMood('happy', `Configuration ${element.download} downloaded! Ready for import~ 🛡️`, 4000);
        return;
      }
    } catch {
      // fallback to store template
    }
    const conf = getWireguardConfigText(user);
    const element = document.createElement('a');
    const file = new Blob([conf], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${user.name.toLowerCase().replace(/\s+/g, '_')}_kiri_awg.conf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setMood('happy', `Configuration ${element.download} downloaded! Ready for import~ 🛡️`, 4000);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Disconnect and permanently remove peer "${name}" from routing tables?`)) {
      soundFx.bleep();
      deleteUser(id);
      setMood('alert', `Peer "${name}" removed from the active gateway routing table.`, 4000);
    }
  };

  return (
    <div className="hud-card p-6 relative overflow-hidden">
      {/* Header & Controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cyber-cyan/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono font-bold text-lg text-white tracking-wide">
                FAMILY NETWORK // PEERS
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40">
                {users.length} {users.length === 1 ? 'peer' : 'peers'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Manage WireGuard / AmneziaWG peers and Hysteria 2 subscriptions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or IP..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-cosmic-950/80 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyber-cyan focus:shadow-neon-cyan transition-all"
            />
          </div>

          {/* Add User Button */}
          <button
            onClick={() => setAddUserModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-pink hover:bg-cyber-pink/90 text-white font-mono text-xs font-bold transition-all shadow-neon-pink shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">ADD PEER</span>
          </button>
        </div>
      </div>

      {/* Users Table / Peer List */}
      <div className="divide-y divide-slate-800/80 mt-2">
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center font-mono text-slate-500 text-sm">
            No peers found matching your query.
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`py-4 px-2 sm:px-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all rounded-lg my-1 ${
                user.isActive
                  ? 'hover:bg-cosmic-800/40'
                  : 'opacity-60 bg-cosmic-950/40 hover:opacity-80'
              }`}
            >
              {/* Left Column: Avatar + Name + IP + Device */}
              <div className="flex items-center gap-3.5 min-w-[260px]">
                {/* Avatar Icon */}
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-cosmic-950 border border-slate-700 flex items-center justify-center text-xl select-none shadow-sm">
                    {user.avatar || '🌸'}
                  </div>
                  {/* Active Status Indicator */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-cosmic-900 ${
                      user.isActive ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]' : 'bg-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono font-bold text-sm text-white">{user.name}</h3>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md uppercase ${
                        user.role === 'family'
                          ? 'bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/30'
                          : 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                    <span className="flex items-center gap-1 text-cyber-cyan font-semibold">
                      {user.ipAddress}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-slate-400 truncate max-w-[150px] sm:max-w-[200px]" title={user.device}>
                      <Smartphone className="w-3 h-3 text-slate-500 shrink-0" />
                      {user.device}
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Column: Traffic Stats & Last Seen */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-300 lg:px-4">
                <div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 uppercase">
                    <ArrowDownToLine className="w-3 h-3 text-cyber-cyan" /> Download
                  </span>
                  <span className="text-white font-semibold">{formatBytes(user.rxBytes)}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 uppercase">
                    <ArrowUpFromLine className="w-3 h-3 text-cyber-pink" /> Upload
                  </span>
                  <span className="text-white font-semibold">{formatBytes(user.txBytes)}</span>
                </div>

                <div className="hidden sm:block">
                  <span className="text-[10px] text-slate-500 block uppercase">Status</span>
                  <span className={user.isActive ? 'text-emerald-400' : 'text-slate-500'}>
                    {user.lastSeen || (user.isActive ? 'Online' : 'Offline')}
                  </span>
                </div>
              </div>

              {/* Right Column: Actions (Copy Mihomo, Show QR, Download .conf, Toggle, Delete) */}
              <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                {/* Copy Mihomo Subscription */}
                <button
                  onClick={() => handleCopySubscription(user)}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-1.5 transition-all ${
                    copiedId === user.id
                      ? 'bg-cyber-pink text-white border-cyber-pink shadow-neon-pink'
                      : 'bg-cosmic-950/80 hover:bg-cyber-pink/20 text-cyber-pink border-cyber-pink/40 hover:border-cyber-pink'
                  }`}
                  title="Copy universal Mihomo subscription link"
                >
                  {copiedId === user.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>SUBSCRIPTION</span>
                    </>
                  )}
                </button>

                {/* Show QR Code */}
                <button
                  onClick={() => openQrModal(user)}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-cosmic-950/80 hover:bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40 hover:border-cyber-cyan font-mono text-xs flex items-center gap-1 transition-all"
                  title="Show QR code for mobile connection"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">QR</span>
                </button>

                {/* Download .conf */}
                <button
                  onClick={() => handleDownloadConf(user)}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-cosmic-950/80 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-500 font-mono text-xs flex items-center gap-1 transition-all"
                  title="Download WireGuard .conf file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CONF</span>
                </button>

                {/* Toggle Active / Inactive */}
                <button
                  onClick={() => toggleUserStatus(user.id)}
                  className={`p-1.5 rounded-lg border font-mono text-xs transition-all ${
                    user.isActive
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/40'
                      : 'bg-rose-950/40 text-rose-400 border-rose-500/40 hover:bg-rose-900/40'
                  }`}
                  title={user.isActive ? 'Deactivate peer' : 'Activate peer'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>

                {/* Delete peer */}
                <button
                  onClick={() => handleDelete(user.id, user.name)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="Delete peer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
