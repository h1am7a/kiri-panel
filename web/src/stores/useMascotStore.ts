import { create } from 'zustand';

export type MascotMood = 'idle' | 'happy' | 'proud' | 'alert' | 'pout';

interface MascotState {
  mood: MascotMood;
  message: string;
  clickCount: number;
  lastClickTime: number;
  timerId: ReturnType<typeof setTimeout> | null;
  isVisible: boolean;
  isMinimized: boolean;
  setMood: (mood: MascotMood, message?: string, durationMs?: number) => void;
  interact: () => void;
  resetToIdle: () => void;
  toggleVisibility: () => void;
  setIsVisible: (visible: boolean) => void;
  toggleMinimized: () => void;
  setIsMinimized: (minimized: boolean) => void;
}

const IDLE_QUOTES = [
  "Senpai, AmneziaWG junk-packet masking is humming smoothly! No DPI firewall can detect us~ 🌸",
  "Hysteria 2 Gecko protocol is accelerating at full throttle! Latency is down to laser speed~ ⚡",
  "All family routing tables are encrypted and verified. Zero packet loss detected! 🛡️",
  "Quantum-grade obfuscation engaged. Your connections are 100% invisible to censors~ ✨",
  "Need a client configuration for Mihomo? Just tap the subscription button next to any peer! 📋",
  "Kiri Security Sentinel online. Your personal cyber guardian is always standing by~ (｡♥‿♥｡)",
  "Traffic throughput is looking pristine today! Enjoy seamless, unrestricted browsing, Senpai~ 🌐"
];

const CLICK_QUOTES: { mood: MascotMood; text: string }[] = [
  { mood: 'happy', text: "Kyaa! Hello Senpai! Checking up on the network telemetry? ✨" },
  { mood: 'proud', text: "Hehe, my obfuscation algorithms are running at 99.9% efficiency, aren't they? 💫" },
  { mood: 'happy', text: "Salamander UDP masking active! Not even deep packet inspection can track our packets! 🚀" },
  { mood: 'proud', text: "Your entire family is guarded under Kiri Sentinel's quantum shield! Leave it to me! 🛡️" },
  { mood: 'pout', text: "Hey, that tickles! Are you poking me instead of doing your sysadmin duties? >_<" },
  { mood: 'pout', text: "Mou... Stop poking, Senpai! Or I'll route all your traffic to the lunar relay! 💢" },
  { mood: 'happy', text: "Just teasing~ I'm always happy to keep you and your network safe! 💖" }
];

const STORAGE_KEY_VISIBLE = 'kiri_mascot_visible';
const STORAGE_KEY_MINIMIZED = 'kiri_mascot_minimized';

function getInitialVisibility(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(STORAGE_KEY_VISIBLE);
    if (val !== null) return val === 'true';
  } catch (e) {
    console.warn('Failed to read mascot visibility from localStorage', e);
  }
  return true;
}

function getInitialMinimized(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem(STORAGE_KEY_MINIMIZED);
    if (val !== null) return val === 'true';
  } catch (e) {
    console.warn('Failed to read mascot minimized state from localStorage', e);
  }
  return false;
}

export const useMascotStore = create<MascotState>((set, get) => ({
  mood: 'idle',
  message: IDLE_QUOTES[0],
  clickCount: 0,
  lastClickTime: 0,
  timerId: null,
  isVisible: getInitialVisibility(),
  isMinimized: getInitialMinimized(),

  setMood: (mood, message, durationMs = 6000) => {
    const currentTimer = get().timerId;
    if (currentTimer) clearTimeout(currentTimer);

    const defaultMsg = message || IDLE_QUOTES[Math.floor(Math.random() * IDLE_QUOTES.length)];

    let nextTimer: ReturnType<typeof setTimeout> | null = null;
    if (mood !== 'idle') {
      nextTimer = setTimeout(() => {
        get().resetToIdle();
      }, durationMs);
    }

    set({
      mood,
      message: defaultMsg,
      timerId: nextTimer,
    });
  },

  interact: () => {
    const now = Date.now();
    const { clickCount, lastClickTime } = get();
    const isRapid = now - lastClickTime < 2500;
    const newCount = isRapid ? clickCount + 1 : 1;

    let targetIdx = (newCount - 1) % CLICK_QUOTES.length;
    if (newCount >= 5 && newCount < 7) {
      targetIdx = 4; // pout
    } else if (newCount >= 7) {
      targetIdx = 5; // extra pout
    }

    const item = CLICK_QUOTES[targetIdx];
    get().setMood(item.mood, item.text, 5000);

    set({
      clickCount: newCount,
      lastClickTime: now,
    });
  },

  resetToIdle: () => {
    const currentTimer = get().timerId;
    if (currentTimer) clearTimeout(currentTimer);

    set({
      mood: 'idle',
      message: IDLE_QUOTES[Math.floor(Math.random() * IDLE_QUOTES.length)],
      timerId: null,
    });
  },

  toggleVisibility: () => {
    const next = !get().isVisible;
    try {
      localStorage.setItem(STORAGE_KEY_VISIBLE, String(next));
    } catch {
      // ignore
    }
    set({ isVisible: next });
  },

  setIsVisible: (visible: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY_VISIBLE, String(visible));
    } catch {
      // ignore
    }
    set({ isVisible: visible });
  },

  toggleMinimized: () => {
    const next = !get().isMinimized;
    try {
      localStorage.setItem(STORAGE_KEY_MINIMIZED, String(next));
    } catch {
      // ignore
    }
    set({ isMinimized: next });
  },

  setIsMinimized: (minimized: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY_MINIMIZED, String(minimized));
    } catch {
      // ignore
    }
    set({ isMinimized: minimized });
  },
}));
