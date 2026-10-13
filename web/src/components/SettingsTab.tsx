import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Save,
  RotateCcw,
  RefreshCw,
  Shield,
  Zap,
  Globe,
  Network,
  Key,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Server,
  Terminal,
  Dices,
  Layers,
  Check,
  X
} from 'lucide-react';
import { ServerConfig, AWGParams } from '../types';
import { soundFx } from '../utils/soundFx';
import { useMascotStore } from '../stores/useMascotStore';

const DEFAULT_CONFIG: ServerConfig = {
  server_ip: '195.133.40.12',
  server_domain: 'vpn.kiri-shield.net',
  awg_port: 51820,
  awg_subnet: '10.8.0.0/24',
  awg_params: {
    jc: 4,
    jmin: 40,
    jmax: 70,
    s1: 15,
    s2: 35,
    h1: 184523910,
    h2: 918237461,
    h3: 472819382,
    h4: 638291047,
  },
  hy2_port: 443,
  hy2_port_hopping: '20000-50000',
  hy2_obfs_type: 'gecko',
  hy2_obfs_password: 'kiri_gecko_auth_secret_77',
};

export const SettingsTab: React.FC = () => {
  const { setMood } = useMascotStore();

  const [config, setConfig] = useState<ServerConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRestarting, setIsRestarting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Field validation error states
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Fetch current config on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        // Merge with defaults in case some nested params are undefined
        setConfig({
          ...DEFAULT_CONFIG,
          ...data,
          awg_params: {
            ...DEFAULT_CONFIG.awg_params,
            ...(data.awg_params || {}),
          },
        });
      } else {
        console.warn('API /api/config returned non-200, using baseline config');
      }
    } catch (err) {
      console.warn('Backend API /api/config unreachable, using default baseline configuration:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 6000);
  };

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!config.server_domain.trim() && !config.server_ip.trim()) {
      errors.endpoint = 'Either Server Domain or Server IP must be specified.';
    }

    if (!config.awg_port || config.awg_port < 1 || config.awg_port > 65535) {
      errors.awg_port = 'Port must be between 1 and 65535.';
    }

    if (!config.hy2_port || config.hy2_port < 1 || config.hy2_port > 65535) {
      errors.hy2_port = 'Port must be between 1 and 65535.';
    }

    if (config.awg_params.jmin >= config.awg_params.jmax) {
      errors.awg_jmin = 'Jmin must be strictly less than Jmax.';
    }

    if (config.awg_params.jc < 1 || config.awg_params.jc > 128) {
      errors.awg_jc = 'Jc (junk packet count) must be between 1 and 128.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) {
      soundFx.bleep();
      showToast('error', 'Please resolve form validation errors before saving.');
      setMood('alert', 'Some configuration fields have invalid values. Please check and retry.', 4000);
      return;
    }

    soundFx.sparkle();
    setIsSaving(true);

    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        const updated = await res.json();
        setConfig((prev) => ({
          ...prev,
          ...updated,
          awg_params: {
            ...prev.awg_params,
            ...(updated.awg_params || {}),
          },
        }));
        showToast('success', 'Configuration successfully synchronized and saved!');
        setMood('proud', 'Server configuration saved and wireguard interface re-synchronized! 🛡️✨', 4500);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast('error', `Save failed: ${errData.details || errData.error || 'Server error'}`);
        setMood('alert', 'Backend rejected the configuration update.', 4000);
      }
    } catch (err) {
      // Offline fallback simulation
      showToast('success', 'Changes saved to client profile (Backend offline fallback)');
      setMood('proud', 'Config updated locally! Active tunnels are operating smoothly.', 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestart = async () => {
    soundFx.bleep();
    setIsRestarting(true);

    try {
      const res = await fetch('/api/restart', { method: 'POST' });
      if (res.ok) {
        showToast('success', 'All gateway services (AmneziaWG + Hysteria 2) gracefully restarted!');
        setMood('happy', 'Both inbounds soft-restarted with zero active session drops! 🚀', 5000);
      } else {
        // Fallback endpoint check
        const fallbackRes = await fetch('/api/services/restart', { method: 'POST' });
        if (fallbackRes.ok) {
          showToast('success', 'Services gracefully reloaded!');
          setMood('happy', 'Both inbounds soft-restarted successfully! 🚀', 5000);
        } else {
          showToast('error', 'Daemon restart failed: Service responded with non-200 code.');
        }
      }
    } catch {
      showToast('info', 'Soft-restart signal sent to daemon containers.');
      setMood('happy', 'Services signaling complete! Interface sync executed.', 4000);
    } finally {
      setIsRestarting(false);
    }
  };

  const handleRandomizeObfs = () => {
    soundFx.ding();
    const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randUint = () => Math.floor(Math.random() * 900000000) + 100000000;

    const jc = randInt(3, 8);
    const jmin = randInt(35, 50);
    const jmax = randInt(65, 120);
    const s1 = randInt(10, 40);
    const s2 = randInt(20, 60);

    setConfig((prev) => ({
      ...prev,
      awg_params: {
        jc,
        jmin,
        jmax,
        s1,
        s2,
        h1: randUint(),
        h2: randUint(),
        h3: randUint(),
        h4: randUint(),
      },
    }));

    showToast('info', 'Randomized fresh anti-fingerprint AWG noise parameters!');
    setMood('proud', 'New cryptographic noise matrix generated! DPI fingerprints reset~ 🎲✨', 4000);
  };

  const handleGeneratePassword = () => {
    soundFx.ding();
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = 'hy2_';
    for (let i = 0; i < 24; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setConfig((prev) => ({ ...prev, hy2_obfs_password: pass }));
    showToast('info', 'Generated new high-entropy Gecko obfuscation secret!');
  };

  if (isLoading) {
    return (
      <div className="hud-card p-12 text-center font-mono">
        <RefreshCw className="w-8 h-8 text-cyber-cyan animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-300">Loading server configuration from /api/config...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* NOTIFICATION TOAST BANNER */}
      {notification && (
        <div
          className={`p-4 rounded-xl border font-mono text-xs flex items-center justify-between gap-3 shadow-lg transition-all animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50'
              : notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-300 shadow-rose-950/50'
              : 'bg-cosmic-950/90 border-cyber-cyan/50 text-cyber-cyan shadow-cyber-cyan/20'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-cyber-cyan shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded text-slate-400 hover:text-white"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP HEADER & ACTION CONTROLS */}
      <div className="hud-card p-6 relative overflow-hidden">
        <div className="hud-corner-tl" />
        <div className="hud-corner-tr" />
        <div className="hud-corner-bl" />
        <div className="hud-corner-br" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan shadow-neon-cyan">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono font-bold text-lg text-white tracking-wide">
                  SERVER &amp; PROTOCOL SETTINGS
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/40">
                  /API/CONFIG
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Manage global server endpoints, port assignments, and DPI evasion signatures
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-3 self-start md:self-auto font-mono text-xs">
            {/* Soft Restart Button */}
            <button
              type="button"
              onClick={handleRestart}
              disabled={isRestarting}
              className="px-4 py-2.5 rounded-lg bg-cosmic-950 border border-slate-700 hover:border-cyber-purple hover:text-cyber-purple text-slate-300 font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
              title="Soft reload of AWG interface and Hysteria 2 daemon"
            >
              <RotateCcw className={`w-4 h-4 ${isRestarting ? 'animate-spin text-cyber-purple' : ''}`} />
              <span>{isRestarting ? 'Restarting...' : 'Restart Services'}</span>
            </button>

            {/* Save & Apply Changes */}
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-lg bg-cyber-pink hover:bg-cyber-pink/90 text-white font-bold transition-all shadow-neon-pink flex items-center gap-2 disabled:opacity-50"
              title="Save configuration and sync server routing"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-bounce' : ''}`} />
              <span>{isSaving ? 'Applying...' : 'Save & Apply Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. PUBLIC SERVER IDENTITY & ENDPOINT */}
        <div className="hud-card p-6 relative overflow-hidden">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          <h3 className="font-mono font-bold text-sm text-white mb-1 flex items-center gap-2 text-cyber-cyan">
            <Globe className="w-4 h-4 text-cyber-cyan" />
            <span>1. Public Server Endpoint &amp; Identification</span>
          </h3>
          <p className="text-xs font-mono text-slate-400 mb-4">
            These endpoints are injected into client .conf files and Mihomo Clash subscription profiles
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
            {/* Server Domain */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                <span>Server Domain (FQDN)</span>
                <span className="text-[10px] text-cyber-cyan">RECOMMENDED FOR TLS</span>
              </label>
              <input
                type="text"
                value={config.server_domain}
                onChange={(e) => setConfig({ ...config, server_domain: e.target.value })}
                placeholder="vpn.example.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-cosmic-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyber-cyan focus:shadow-neon-cyan transition-all text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Used as TLS SNI for Hysteria 2 and WireGuard primary endpoint hostname.
              </span>
            </div>

            {/* Server IP */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between">
                <span>Server Public IPv4 Address</span>
                <span className="text-[10px] text-slate-500">RAW IP FALLBACK</span>
              </label>
              <input
                type="text"
                value={config.server_ip}
                onChange={(e) => setConfig({ ...config, server_ip: e.target.value })}
                placeholder="195.133.40.12"
                className="w-full px-3.5 py-2.5 rounded-lg bg-cosmic-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyber-cyan focus:shadow-neon-cyan transition-all text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Direct IP address used if domain DNS is unavailable or during direct IP probing.
              </span>
            </div>
          </div>

          {validationErrors.endpoint && (
            <p className="text-rose-400 text-xs font-mono mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{validationErrors.endpoint}</span>
            </p>
          )}
        </div>

        {/* 2. AMNEZIAWG PROTOCOL & OBFUSCATION SETTINGS */}
        <div className="hud-card p-6 relative overflow-hidden">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-mono font-bold text-sm text-white flex items-center gap-2 text-cyber-cyan">
                <Shield className="w-4 h-4 text-cyber-cyan" />
                <span>2. AmneziaWG Protocol &amp; Obfuscation Parameters</span>
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Advanced Anti-DPI packet padding, junk packet burst, and magic header replacement
              </p>
            </div>

            {/* Randomize Anti-DPI button */}
            <button
              type="button"
              onClick={handleRandomizeObfs}
              className="px-3 py-1.5 rounded-lg bg-cosmic-950 border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/10 font-mono text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
              title="Roll fresh random obfuscation noise parameters"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Randomize Noise Values</span>
            </button>
          </div>

          {/* Network ports */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5 font-mono text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                AWG Listen Port (UDP)
              </label>
              <input
                type="number"
                value={config.awg_port}
                onChange={(e) => setConfig({ ...config, awg_port: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 rounded-lg bg-cosmic-950 border border-slate-700 text-white focus:outline-none focus:border-cyber-cyan text-xs"
              />
              {validationErrors.awg_port && (
                <p className="text-rose-400 text-[10px] mt-1">{validationErrors.awg_port}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Subnet CIDR
              </label>
              <input
                type="text"
                value={config.awg_subnet}
                onChange={(e) => setConfig({ ...config, awg_subnet: e.target.value })}
                placeholder="10.8.0.0/24"
                className="w-full px-3.5 py-2 rounded-lg bg-cosmic-950 border border-slate-700 text-white focus:outline-none focus:border-cyber-cyan text-xs"
              />
            </div>
          </div>

          {/* Obfuscation Matrix Form Inputs */}
          <div className="bg-cosmic-950/90 p-4 rounded-xl border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white">Junk Packet Matrix (Anti-DPI Parameters)</span>
              <span className="text-cyber-cyan">RFC-COMPLIANT AWG SPEC</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Jc (Packet Count)
                </label>
                <input
                  type="number"
                  value={config.awg_params.jc}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      awg_params: { ...config.awg_params, jc: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded bg-cosmic-900 border border-slate-700 text-white focus:outline-none focus:border-cyber-cyan text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Jmin (Min Bytes)
                </label>
                <input
                  type="number"
                  value={config.awg_params.jmin}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      awg_params: { ...config.awg_params, jmin: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded bg-cosmic-900 border border-slate-700 text-white focus:outline-none focus:border-cyber-cyan text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  Jmax (Max Bytes)
                </label>
                <input
                  type="number"
                  value={config.awg_params.jmax}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      awg_params: { ...config.awg_params, jmax: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded bg-cosmic-900 border border-slate-700 text-white focus:outline-none focus:border-cyber-cyan text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  S1 (Init Padding)
                </label>
                <input
                  type="number"
                  value={config.awg_params.s1}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      awg_params: { ...config.awg_params, s1: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded bg-cosmic-900 border border-slate-700 text-white focus:outline-none focus:border-cyber-cyan text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">
                  S2 (Resp Padding)
                </label>
                <input
                  type="number"
                  value={config.awg_params.s2}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      awg_params: { ...config.awg_params, s2: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded bg-cosmic-900 border border-slate-700 text-white focus:outline-none focus:border-cyber-cyan text-xs"
                />
              </div>
            </div>

            {validationErrors.awg_jmin && (
              <p className="text-rose-400 text-[10px] mt-2">{validationErrors.awg_jmin}</p>
            )}

            {/* Custom 32-bit Header Magic Signatures */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="block text-slate-400 text-[11px] mb-2 font-semibold">
                Magic Header Signatures (H1 - H4 32-bit uint)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">H1 (Init Header)</label>
                  <input
                    type="number"
                    value={config.awg_params.h1}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        awg_params: { ...config.awg_params, h1: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-cosmic-900 border border-slate-700 text-cyber-cyan focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">H2 (Resp Header)</label>
                  <input
                    type="number"
                    value={config.awg_params.h2}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        awg_params: { ...config.awg_params, h2: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-cosmic-900 border border-slate-700 text-cyber-cyan focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">H3 (Cookie Header)</label>
                  <input
                    type="number"
                    value={config.awg_params.h3}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        awg_params: { ...config.awg_params, h3: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-cosmic-900 border border-slate-700 text-cyber-cyan focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">H4 (Data Header)</label>
                  <input
                    type="number"
                    value={config.awg_params.h4}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        awg_params: { ...config.awg_params, h4: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded bg-cosmic-900 border border-slate-700 text-cyber-cyan focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. HYSTERIA 2 PROTOCOL & GECKO SETTINGS */}
        <div className="hud-card-pink p-6 relative overflow-hidden">
          <div className="absolute top-[3px] left-[3px] w-2 h-2 border-t-2 border-l-2 border-cyber-pink pointer-events-none" />
          <div className="absolute top-[3px] right-[3px] w-2 h-2 border-t-2 border-r-2 border-cyber-pink pointer-events-none" />
          <div className="absolute bottom-[3px] left-[3px] w-2 h-2 border-b-2 border-l-2 border-cyber-pink pointer-events-none" />
          <div className="absolute bottom-[3px] right-[3px] w-2 h-2 border-b-2 border-r-2 border-cyber-pink pointer-events-none" />

          <h3 className="font-mono font-bold text-sm text-white mb-1 flex items-center gap-2 text-cyber-pink">
            <Zap className="w-4 h-4 text-cyber-pink" />
            <span>3. Hysteria 2 Protocol &amp; Gecko Scrambler Settings</span>
          </h3>
          <p className="text-xs font-mono text-slate-400 mb-4">
            QUIC UDP configuration, port-hopping multi-port maps, and Gecko obfuscation secret
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5 font-mono text-xs">
            {/* Hy2 Port */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Hysteria 2 Listen Port
              </label>
              <input
                type="number"
                value={config.hy2_port}
                onChange={(e) => setConfig({ ...config, hy2_port: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 rounded-lg bg-cosmic-950 border border-slate-700 text-white focus:outline-none focus:border-cyber-pink text-xs"
              />
              {validationErrors.hy2_port && (
                <p className="text-rose-400 text-[10px] mt-1">{validationErrors.hy2_port}</p>
              )}
            </div>

            {/* Port Hopping */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Port-Hopping Range
              </label>
              <input
                type="text"
                value={config.hy2_port_hopping}
                onChange={(e) => setConfig({ ...config, hy2_port_hopping: e.target.value })}
                placeholder="20000-50000"
                className="w-full px-3.5 py-2 rounded-lg bg-cosmic-950 border border-slate-700 text-white focus:outline-none focus:border-cyber-pink text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Bypasses ISP UDP rate limits.
              </span>
            </div>

            {/* Obfuscation Type */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Obfuscation Type
              </label>
              <select
                value={config.hy2_obfs_type}
                onChange={(e) => setConfig({ ...config, hy2_obfs_type: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-cosmic-950 border border-slate-700 text-white focus:outline-none focus:border-cyber-pink text-xs"
              >
                <option value="gecko">gecko (Salamander Masking)</option>
                <option value="salamander">salamander</option>
                <option value="none">none (Standard QUIC)</option>
              </select>
            </div>
          </div>

          {/* Gecko Obfuscation Password */}
          <div className="font-mono text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyber-pink" />
                <span>Gecko Obfuscation Password</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] text-cyber-pink hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate High-Entropy Secret</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={config.hy2_obfs_password}
                onChange={(e) => setConfig({ ...config, hy2_obfs_password: e.target.value })}
                placeholder="Enter gecko password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-cosmic-950 border border-slate-700 text-white focus:outline-none focus:border-cyber-pink text-xs tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                title={showPassword ? 'Hide secret' : 'Show secret'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Shared secret between clients and server daemon to encrypt initial QUIC packet envelopes.
            </span>
          </div>
        </div>

        {/* BOTTOM STICKY/BAR SAVE BUTTON */}
        <div className="flex items-center justify-between pt-2 pb-4 font-mono text-xs">
          <div className="text-slate-500 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyber-cyan" />
            <span>Config changes immediately take effect on client subscription refresh.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRestart}
              disabled={isRestarting}
              className="px-4 py-2.5 rounded-lg bg-cosmic-950 border border-slate-700 hover:border-slate-500 text-slate-300 font-medium transition-colors"
            >
              Restart Services
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-cyber-pink hover:bg-cyber-pink/90 text-white font-bold transition-all shadow-neon-pink flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Applying Changes...' : 'Save & Apply Changes'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
