import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Sparkles,
  Smartphone,
  Laptop,
  Monitor,
  Router,
  ShieldCheck,
  Loader2,
  Check,
  LucideIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../stores/useAppStore';
import { soundFx } from '../utils/soundFx';
import { useMascotStore } from '../stores/useMascotStore';

interface DevicePreset {
  label: string;
  icon: LucideIcon;
  defaultText: string;
}

const DEVICE_PRESETS: DevicePreset[] = [
  { label: 'iPhone', icon: Smartphone, defaultText: 'iPhone • FlClash / Mihomo' },
  { label: 'Android', icon: Smartphone, defaultText: 'Android • FlClash / Karing' },
  { label: 'Windows PC', icon: Monitor, defaultText: 'Windows PC • Mihomo Party' },
  { label: 'Mac', icon: Laptop, defaultText: 'MacBook • Mihomo Party' },
  { label: 'Home Router', icon: Router, defaultText: 'Home Router • OpenWrt AWG' },
];

export const AddClientModal: React.FC = () => {
  const { isAddUserModalOpen, setAddUserModalOpen, addUser } = useAppStore();
  const { setMood } = useMascotStore();

  const [name, setName] = useState('');
  const [device, setDevice] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [role, setRole] = useState<'family' | 'guest'>('family');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAddUserModalOpen) return null;

  const handlePresetClick = (preset: DevicePreset) => {
    soundFx.bleep();
    setSelectedPreset(preset.label);
    setDevice(preset.defaultText);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    soundFx.bleep();
    setAddUserModalOpen(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a client name or alias');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Simulate realistic key generation delay for smooth UX
      await new Promise((resolve) => setTimeout(resolve, 600));

      const finalDevice = device.trim() || selectedPreset || 'Universal Device';
      await addUser(name.trim(), finalDevice, role);

      // Trigger Cyber-Moe celebration confetti explosion
      try {
        confetti({
          particleCount: 55,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#00F0FF', '#FF2A85', '#C084FC', '#FACC15', '#10B981'],
        });
      } catch {
        // ignore if canvas unavailable
      }

      setMood(
        'happy',
        `Welcome to Kiri Network, ${name.trim()}! New AmneziaWG & Hysteria 2 keys generated successfully~ 🎉`,
        5000
      );

      setName('');
      setDevice('');
      setSelectedPreset(null);
      setError('');
    } catch (err: unknown) {
      console.error('Failed to create client:', err);
      setError('Failed to create client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
      <div
        className="relative w-full max-w-lg bg-cosmic-850 border border-cyber-pink/40 rounded-xl p-6 shadow-neon-pink overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD corner accents */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyber-pink" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyber-pink" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyber-pink" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyber-pink" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyber-pink/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyber-pink/10 border border-cyber-pink/30 text-cyber-pink shadow-neon-pink">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base tracking-wide">
                ENROLL NEW CLIENT // KEY GENERATION
              </h3>
              <p className="text-xs text-slate-400">
                Generate AmneziaWG obfuscated keys &amp; Hysteria 2 token
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Client Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Client Name or Alias <span className="text-cyber-pink">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Alex's iPhone, Living Room PC, Guest iPad"
              className="w-full px-3.5 py-2.5 rounded-lg bg-cosmic-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyber-pink focus:shadow-neon-pink transition-all"
              autoFocus
              disabled={isSubmitting}
            />
            {error && <p className="text-[11px] text-cyber-pink mt-1.5">{error}</p>}
          </div>

          {/* Role / Access Level Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Access Tier / Role
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  soundFx.bleep();
                  setRole('family');
                }}
                disabled={isSubmitting}
                className={`p-3 rounded-lg border text-left transition-all ${
                  role === 'family'
                    ? 'bg-cyber-dimPink border-cyber-pink text-cyber-pink font-bold shadow-neon-pink'
                    : 'bg-cosmic-950 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Family (Unmetered)</span>
                </div>
                <p className="text-[10px] text-slate-400 font-normal">
                  High-priority speed, unthrottled bandwidth
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.bleep();
                  setRole('guest');
                }}
                disabled={isSubmitting}
                className={`p-3 rounded-lg border text-left transition-all ${
                  role === 'guest'
                    ? 'bg-cyber-dimCyan border-cyber-cyan text-cyber-cyan font-bold shadow-neon-cyan'
                    : 'bg-cosmic-950 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Guest (Standard)</span>
                </div>
                <p className="text-[10px] text-slate-400 font-normal">
                  Standard routing, guest rule policies
                </p>
              </button>
            </div>
          </div>

          {/* Device Preset Quick-Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Device Preset Quick-Selector
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {DEVICE_PRESETS.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = selectedPreset === preset.label;

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    disabled={isSubmitting}
                    className={`py-2 px-2 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan font-bold shadow-neon-cyan'
                        : 'bg-cosmic-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] truncate w-full">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Device Label Input */}
            <div className="mt-2.5">
              <input
                type="text"
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                placeholder="Or customize device model: e.g. iPhone 15 Pro • Mihomo"
                className="w-full px-3.5 py-2 rounded-lg bg-cosmic-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-cyber-cyan focus:shadow-neon-cyan transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-xs hover:bg-white/5 transition-all disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg bg-cyber-pink hover:bg-cyber-pink/90 text-white text-xs font-bold shadow-neon-pink transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Keys...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Client</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
