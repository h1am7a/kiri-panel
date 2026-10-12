import React, { useState } from 'react';
import { Sparkles, Heart, MessageSquare, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useMascotStore } from '../stores/useMascotStore';
import { soundFx } from '../utils/soundFx';

export const Mascot: React.FC = () => {
  const { mood, message, interact } = useMascotStore();
  const [isBouncing, setIsBouncing] = useState(false);

  // Asset selection based on mood
  const imageSrc = (mood === 'proud' || mood === 'happy') 
    ? '/mascot/proud.jpg' 
    : '/mascot/idle.jpg';

  const handleClick = () => {
    soundFx.boing();
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 500);
    interact();
  };

  const getMoodBadge = () => {
    switch (mood) {
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

  const moodBadge = getMoodBadge();
  const MoodIcon = moodBadge.icon;

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Speech Bubble */}
      <div className="w-full mb-4 animate-float">
        <div className="relative p-4 rounded-xl bg-cosmic-850/95 border border-cyber-cyan/40 shadow-neon-cyan backdrop-blur-md">
          {/* Bubble Tail pointing down towards mascot */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-cyber-cyan/40" />

          {/* Header of speech bubble */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyber-cyan/20 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-cyber-cyan font-bold">
              <MessageSquare className="w-3.5 h-3.5 text-cyber-cyan" />
              <span>KIRI AI // 霧</span>
            </div>

            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${moodBadge.color}`}>
              <MoodIcon className="w-3 h-3" />
              <span>{moodBadge.text}</span>
            </div>
          </div>

          {/* Dialogue Message */}
          <p className="text-xs font-mono text-slate-100 leading-relaxed min-h-[38px] transition-all">
            "{message}"
          </p>

          <div className="mt-2 text-right">
            <span className="text-[10px] font-mono text-cyber-cyan/60 animate-pulse">
              [ Кликни на Кири для ответа ]
            </span>
          </div>
        </div>
      </div>

      {/* Mascot Character Avatar / Portrait */}
      <div 
        onClick={handleClick}
        className={`group relative cursor-pointer transition-all duration-300 ${
          isBouncing ? 'scale-95 translate-y-1' : 'hover:scale-102 hover:-translate-y-1'
        }`}
        title="Кликни на Кири!"
      >
        {/* Holographic Glowing Frame */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-cyber-cyan/40 shadow-neon-cyan bg-cosmic-950 p-1.5 transition-all group-hover:border-cyber-pink group-hover:shadow-neon-pink">
          {/* Corner Cyber Brackets */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyber-cyan z-10" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyber-cyan z-10" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyber-cyan z-10" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyber-cyan z-10" />

          {/* Character Image */}
          <div className="relative rounded-xl overflow-hidden w-full max-w-[280px] sm:max-w-[320px] aspect-[3/4] bg-cosmic-900">
            <img
              src={imageSrc}
              alt="Kiri Cyber Mascot"
              className="w-full h-full object-cover object-top transition-all duration-500 group-hover:brightness-105"
            />

            {/* Cyber scanline overlay */}
            <div className="absolute inset-0 scanlines opacity-40 pointer-events-none" />

            {/* Gradient fog overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-cosmic-950 via-cosmic-950/60 to-transparent pointer-events-none" />

            {/* Mascot Name Banner at foot */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-cosmic-900/90 border border-cyber-cyan/30 backdrop-blur-sm">
              <div>
                <span className="font-mono text-xs font-bold text-cyber-cyan block">
                  KIRI // 霧
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  SYSTEM GUARDIAN
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyber-pink animate-ping" />
                <span className="text-[10px] font-mono text-cyber-pink font-semibold">
                  LIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
