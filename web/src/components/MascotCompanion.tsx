import React, { useState } from 'react';
import { 
  Sparkles, 
  Heart, 
  MessageSquare, 
  AlertTriangle, 
  ShieldCheck, 
  Minus, 
  X, 
  Maximize2,
  Bot
} from 'lucide-react';
import { useMascotStore, MascotMood } from '../stores/useMascotStore';
import { soundFx } from '../utils/soundFx';

export const MascotCompanion: React.FC = () => {
  const { 
    mood, 
    message, 
    interact, 
    isVisible, 
    isMinimized, 
    toggleMinimized, 
    setIsVisible 
  } = useMascotStore();
  const [isBouncing, setIsBouncing] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);

  if (!isVisible) return null;

  // Asset selection based on mood
  const imageSrc = (mood === 'proud' || mood === 'happy') 
    ? '/mascot/proud.jpg' 
    : '/mascot/idle.jpg';

  const handleClickAvatar = () => {
    soundFx.boing();
    setIsBouncing(true);
    setShowSpeechBubble(true);
    setTimeout(() => setIsBouncing(false), 500);
    interact();
  };

  const getMoodBadge = (m: MascotMood) => {
    switch (m) {
      case 'happy':
        return { text: 'HAPPY // 嬉しい', color: 'bg-cyber-pink/20 text-cyber-pink border-cyber-pink/40', icon: Heart };
      case 'proud':
        return { text: 'PROUD // 得意', color: 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/40', icon: Sparkles };
      case 'alert':
        return { text: 'ALERT // 警戒', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: AlertTriangle };
      case 'pout':
        return { text: 'POUT // ぷんぷん', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40', icon: AlertTriangle };
      default:
        return { text: 'GUARD // 守護', color: 'bg-cyber-purple/20 text-cyber-purple border-cyber-purple/40', icon: ShieldCheck };
    }
  };

  const moodBadge = getMoodBadge(mood);
  const MoodIcon = moodBadge.icon;

  // Minimized Compact Floating Orb
  if (isMinimized) {
    return (
      <aside 
        aria-label="Kiri Mascot Minimized Companion"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 group animate-fade-in"
      >
        <button
          onClick={() => {
            soundFx.sparkle();
            toggleMinimized();
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-full bg-cosmic-850/90 border border-cyber-cyan/40 shadow-neon-cyan backdrop-blur-md text-xs font-mono text-slate-200 hover:border-cyber-cyan hover:scale-105 transition-all"
          title="Click to summon Kiri Companion"
        >
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-cyber-cyan/60 flex items-center justify-center bg-cosmic-950">
            <img src="/mascot/idle.jpg" alt="Kiri chibi" className="w-full h-full object-cover" />
            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-cosmic-950" />
          </div>
          <span className="font-semibold text-cyber-cyan">KIRI // 霧</span>
          <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyber-cyan transition-colors" />
        </button>
      </aside>
    );
  }

  // Expanded Floating Companion Dock
  return (
    <aside 
      aria-label="Kiri Mascot Floating Companion Dock"
      className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-none select-none max-w-sm sm:max-w-md animate-fade-in"
    >
      {/* Speech Bubble */}
      {showSpeechBubble && (
        <div className="pointer-events-auto mb-3 w-full animate-float">
          <div className="relative p-3.5 rounded-2xl bg-cosmic-850/95 border border-cyber-cyan/35 shadow-hud backdrop-blur-xl transition-all">
            {/* Bubble Tail pointing down-right toward mascot avatar */}
            <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-cyber-cyan/40" />

            {/* Bubble Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyber-cyan/15 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-cyber-cyan font-bold">
                <Bot className="w-3.5 h-3.5 text-cyber-cyan" />
                <span>KIRI SENTINEL</span>
                <span className="text-cyber-pink font-light text-[10px]">// 霧</span>
              </div>

              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${moodBadge.color}`}>
                  <MoodIcon className="w-3 h-3" />
                  <span>{moodBadge.text}</span>
                </div>
                <button
                  onClick={() => setShowSpeechBubble(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors p-0.5"
                  title="Dismiss dialogue bubble"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Message Body */}
            <p className="text-xs font-mono text-slate-100 leading-relaxed min-h-[36px]">
              "{message}"
            </p>

            {/* Click prompt note */}
            <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="text-slate-500">Dual Tunnel Live</span>
              <span className="text-cyber-cyan/80 animate-pulse font-semibold">
                [ Tap Kiri to interact ]
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mascot Companion Dock Base */}
      <div className="pointer-events-auto flex items-end gap-2.5">
        
        {/* Floating Mini Action Toolbar */}
        <div className="flex flex-col gap-1.5 p-1 rounded-xl bg-cosmic-950/85 border border-slate-700/60 backdrop-blur-md shadow-md">
          <button
            onClick={handleClickAvatar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyber-pink hover:bg-cyber-pink/15 transition-all"
            title="Interact / Poke Kiri"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              soundFx.bleep();
              toggleMinimized();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyber-cyan hover:bg-cyber-cyan/15 transition-all"
            title="Minimize Companion"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              soundFx.bleep();
              setIsVisible(false);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition-all"
            title="Hide Companion (Can be re-enabled from header)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mascot Avatar Portrait */}
        <div 
          onClick={handleClickAvatar}
          className={`relative cursor-pointer transition-transform duration-300 ${
            isBouncing ? 'scale-90 rotate-3' : 'hover:scale-105 hover:-translate-y-1'
          }`}
          title="Click to interact with Kiri!"
        >
          {/* Glowing Holographic Ring Frame */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-br from-cyber-cyan via-cyber-pink to-cyber-purple shadow-neon-cyan">
            <div className="w-full h-full rounded-[14px] overflow-hidden bg-cosmic-950 relative">
              <img
                src={imageSrc}
                alt="Kiri Cyber Mascot"
                className="w-full h-full object-cover object-top transition-all duration-300"
              />

              {/* Scanline overlay */}
              <div className="absolute inset-0 scanlines opacity-40 pointer-events-none" />

              {/* Bottom gradient fade */}
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-cosmic-950/90 to-transparent pointer-events-none" />

              {/* Online Pulse Dot */}
              <div className="absolute bottom-1 right-1 flex items-center gap-1 px-1 py-0.5 rounded bg-cosmic-950/80 border border-cyber-cyan/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[8px] font-mono font-bold text-cyber-cyan">LIVE</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};
