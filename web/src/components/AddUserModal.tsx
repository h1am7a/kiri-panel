import React, { useState } from 'react';
import { X, UserPlus, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../stores/useAppStore';
import { soundFx } from '../utils/soundFx';
import { useMascotStore } from '../stores/useMascotStore';

export const AddUserModal: React.FC = () => {
  const { isAddUserModalOpen, setAddUserModalOpen, addUser } = useAppStore();
  const { setMood } = useMascotStore();

  const [name, setName] = useState('');
  const [device, setDevice] = useState('');
  const [role, setRole] = useState<'family' | 'guest'>('family');
  const [error, setError] = useState('');

  if (!isAddUserModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name or alias');
      return;
    }

    addUser(name.trim(), device.trim(), role);

    // Confetti explosion
    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00F0FF', '#FF2A85', '#C084FC', '#FACC15'],
      });
    } catch {
      // ignore
    }

    setMood('happy', `Welcome to Kiri Network, ${name}! New obfuscated credentials enrolled successfully~ 🎉`, 5000);
    setName('');
    setDevice('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-cosmic-850 border border-cyber-pink/40 rounded-2xl p-6 shadow-neon-pink overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyber-pink/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyber-pink/10 border border-cyber-pink/30 text-cyber-pink shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-white text-base">
                NEW CLIENT // PEER ENROLL
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Generate AmneziaWG + Hysteria 2 Credentials
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.bleep();
              setAddUserModalOpen(false);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1.5">
              Peer Name or Alias <span className="text-cyber-pink">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Mom's iPhone or Work Laptop"
              className="w-full px-3.5 py-2.5 rounded-lg bg-cosmic-950 border border-slate-700 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-cyber-pink focus:shadow-neon-pink transition-all"
              autoFocus
            />
            {error && <p className="text-[11px] font-mono text-cyber-pink mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1.5">
              Device Model / Client App
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={device}
                onChange={(e) => setDevice(e.target.value)}
                placeholder="e.g., iPhone 15 Pro • Mihomo"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-cosmic-950 border border-slate-700 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-cyber-cyan focus:shadow-neon-cyan transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 uppercase mb-1.5">
              Access Tier
            </label>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  soundFx.bleep();
                  setRole('family');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  role === 'family'
                    ? 'bg-cyber-dimPink border-cyber-pink text-cyber-pink font-bold shadow-neon-pink'
                    : 'bg-cosmic-950 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Family</span>
                </div>
                <p className="text-[10px] text-slate-400 font-normal">Full speed, unrestricted</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.bleep();
                  setRole('guest');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  role === 'guest'
                    ? 'bg-cyber-dimCyan border-cyber-cyan text-cyber-cyan font-bold shadow-neon-cyan'
                    : 'bg-cosmic-950 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Guest</span>
                </div>
                <p className="text-[10px] text-slate-400 font-normal">Standard tunnel profile</p>
              </button>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                soundFx.bleep();
                setAddUserModalOpen(false);
              }}
              className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-mono text-xs hover:bg-white/5 transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-cyber-pink text-white font-mono text-xs font-bold shadow-neon-pink hover:bg-cyber-pink/90 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>ENROLL PEER</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
