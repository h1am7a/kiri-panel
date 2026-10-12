import { create } from 'zustand';

export type MascotMood = 'idle' | 'happy' | 'proud' | 'alert' | 'pout';

interface MascotState {
  mood: MascotMood;
  message: string;
  clickCount: number;
  lastClickTime: number;
  timerId: NodeJS.Timeout | null;
  setMood: (mood: MascotMood, message?: string, durationMs?: number) => void;
  interact: () => void;
  resetToIdle: () => void;
}

const IDLE_QUOTES = [
  "Семпай, туннель AmneziaWG замаскирован под чистый шум! Ни один цензор не догадается~ 🌸",
  "Hysteria 2 Gecko работает на полной скорости! Трафик летит как лазерный луч~ ⚡",
  "Я внимательно слежу за маршрутами твоей семьи. Ни единого дропа пакетов!",
  "Системные показатели в норме. Все пиры зашифрованы по высшему разряду~ 🛡️",
  "Нужна новая подписка для Mihomo? Просто нажми кнопку рядом с пользователем!",
  "Kiri Panel активна. Твой личный кибер-страж всегда на посту~ (｡♥‿♥｡)"
];

const CLICK_QUOTES: { mood: MascotMood; text: string }[] = [
  { mood: 'happy', text: "Ой! Привет, семпай! Проверяешь статус сети? ✨" },
  { mood: 'proud', text: "Хе-хе, я отлично справляюсь с маршрутизацией, правда? 💫" },
  { mood: 'happy', text: "Gecko-обфускация активирована! За нами не уследят! 🚀" },
  { mood: 'proud', text: "Вся семья защищена квантовым шифрованием Kiri Security! 🛡️" },
  { mood: 'pout', text: "Эй, щекотно же! Ты на меня кликаешь вместо работы? >_<" },
  { mood: 'pout', text: "Хватит тыкать, семпай! Иначе перенаправлю твои пакеты на луну! 💢" },
  { mood: 'happy', text: "Ладно-ладно, я не обижаюсь! Люблю, когда ты рядом~ 💖" }
];

export const useMascotStore = create<MascotState>((set, get) => ({
  mood: 'idle',
  message: IDLE_QUOTES[0],
  clickCount: 0,
  lastClickTime: 0,
  timerId: null,

  setMood: (mood, message, durationMs = 6000) => {
    const currentTimer = get().timerId;
    if (currentTimer) clearTimeout(currentTimer);

    const defaultMsg = message || IDLE_QUOTES[Math.floor(Math.random() * IDLE_QUOTES.length)];

    let nextTimer: NodeJS.Timeout | null = null;
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
}));
