import { create } from 'zustand';
import { User, ServiceStatus, SystemStats, NavTab } from '../types';
import { soundFx } from '../utils/soundFx';

interface AppState {
  users: User[];
  systemStats: SystemStats;
  awgService: ServiceStatus;
  hy2Service: ServiceStatus;
  isSfxMuted: boolean;
  selectedUserForQr: User | null;
  isAddUserModalOpen: boolean;
  searchQuery: string;
  activeTab: NavTab;

  // Actions
  setActiveTab: (tab: NavTab) => void;
  fetchUsers: () => Promise<void>;
  fetchStatus: () => Promise<void>;
  toggleSfx: () => void;
  openQrModal: (user: User) => void;
  closeQrModal: () => void;
  setAddUserModalOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  addUser: (name: string, device: string, role?: 'family' | 'guest') => void;
  toggleUserStatus: (id: string) => void;
  deleteUser: (id: string) => void;
  getMihomoSubscriptionUrl: (userId: string) => string;
  getWireguardConfigText: (user: User) => string;
}

const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Mom (iPhone 15)',
    avatar: '🌸',
    device: 'iPhone 15 • Mihomo iOS',
    role: 'family',
    isActive: true,
    ipAddress: '10.8.0.2',
    hysteriaAuth: 'hy2_mom_gecko_auth',
    rxBytes: 4294967296 * 3.8, // ~16.3 GB
    txBytes: 1073741824 * 1.4, // ~1.5 GB
    lastSeen: 'Online now',
    createdAt: '2026-09-01',
  },
  {
    id: 'usr-2',
    name: 'Dad (Pixel 8 Pro)',
    avatar: '⚡',
    device: 'Pixel 8 Pro • AmneziaWG',
    role: 'family',
    isActive: true,
    ipAddress: '10.8.0.3',
    hysteriaAuth: 'hy2_dad_gecko_auth',
    rxBytes: 4294967296 * 8.2, // ~35.2 GB
    txBytes: 1073741824 * 4.9, // ~5.2 GB
    lastSeen: '12m ago',
    createdAt: '2026-09-01',
  },
  {
    id: 'usr-3',
    name: 'Sister (MacBook & iPad)',
    avatar: '🎀',
    device: 'iPad Pro + MacBook Air',
    role: 'family',
    isActive: true,
    ipAddress: '10.8.0.4',
    hysteriaAuth: 'hy2_sis_gecko_auth',
    rxBytes: 4294967296 * 12.5, // ~53.6 GB
    txBytes: 1073741824 * 3.1, // ~3.3 GB
    lastSeen: 'Online now',
    createdAt: '2026-09-05',
  },
  {
    id: 'usr-4',
    name: 'Guest (ThinkPad X1)',
    avatar: '🦊',
    device: 'ThinkPad X1 Carbon',
    role: 'guest',
    isActive: false,
    ipAddress: '10.8.0.5',
    hysteriaAuth: 'hy2_guest_gecko_auth',
    rxBytes: 1073741824 * 2.1,
    txBytes: 524288000,
    lastSeen: '3 days ago',
    createdAt: '2026-10-01',
  },
];

export const useAppStore = create<AppState>((set, get) => {
  soundFx.initFromStorage();

  return {
    users: INITIAL_USERS,
    activeTab: 'overview',
    systemStats: {
      cpuUsagePercent: 14,
      memoryUsagePercent: 28,
      totalRxBytes: 1073741824 * 106.7,
      totalTxBytes: 1073741824 * 14.8,
      activeTunnels: 3,
      status: 'ONLINE',
    },
    awgService: {
      name: 'AmneziaWG Obfuscated',
      type: 'awg',
      port: 51820,
      protocol: 'UDP (Junk Packets)',
      status: 'online',
      peersCount: 4,
      uptime: '18d 4h',
      obfuscation: 'Jc=4 Jmin=40 Jmax=70 S1=15 S2=35 H1=1... H4=4...',
      currentSpeedMbps: {
        download: 142.8,
        upload: 28.4,
      },
    },
    hy2Service: {
      name: 'Hysteria 2 Gecko',
      type: 'hy2',
      port: 443,
      protocol: 'QUIC / UDP 443',
      status: 'online',
      peersCount: 3,
      uptime: '18d 4h',
      obfuscation: 'Salamander / Gecko Masking',
      currentSpeedMbps: {
        download: 320.5,
        upload: 65.2,
      },
    },
    isSfxMuted: soundFx.isMuted(),
    selectedUserForQr: null,
    isAddUserModalOpen: false,
    searchQuery: '',

    setActiveTab: (tab: NavTab) => {
      soundFx.bleep();
      set({ activeTab: tab });
    },

    // Actions
    fetchUsers: async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const mappedUsers: User[] = data.map((u: any) => ({
              id: String(u.id),
              name: u.username || u.name,
              avatar: u.role === 'guest' ? '🐱' : '✨',
              device: u.device || 'Client Device',
              role: (u.role === 'guest' ? 'guest' : 'family') as 'family' | 'guest',
              isActive: u.enabled ?? u.isActive ?? true,
              ipAddress: u.awg_ipv4 || u.ipAddress || '10.8.0.2',
              hysteriaAuth: u.hy2_token || u.hysteriaAuth || '',
              rxBytes: u.used_traffic || u.rxBytes || 0,
              txBytes: u.txBytes || 0,
              lastSeen: 'Online',
              createdAt: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '2026-10-12',
            }));
            set({ users: mappedUsers });
          }
        }
      } catch (e) {
        console.warn('API /api/users unavailable, using local state:', e);
      }
    },

    fetchStatus: async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          set((state) => ({
            systemStats: {
              ...state.systemStats,
              activeTunnels: data.active_tunnels ?? state.systemStats.activeTunnels,
              status: data.awg_status === 'online' ? 'ONLINE' : 'ONLINE',
            },
            awgService: {
              ...state.awgService,
              status: data.awg_status || 'online',
              peersCount: data.total_users || state.awgService.peersCount,
            },
            hy2Service: {
              ...state.hy2Service,
              status: data.hy2_status || 'online',
              peersCount: data.total_users || state.hy2Service.peersCount,
            },
          }));
        }
      } catch (e) {
        console.warn('API /api/status unavailable, using local state:', e);
      }
    },

    toggleSfx: () => {
      const newMuted = soundFx.toggleMute();
      set({ isSfxMuted: newMuted });
      if (!newMuted) {
        soundFx.bleep();
      }
    },

    openQrModal: (user) => {
      soundFx.bleep();
      set({ selectedUserForQr: user });
    },

    closeQrModal: () => {
      set({ selectedUserForQr: null });
    },

    setAddUserModalOpen: (open) => {
      if (open) soundFx.bleep();
      set({ isAddUserModalOpen: open });
    },

    setSearchQuery: (query) => {
      set({ searchQuery: query });
    },

    addUser: async (name, device, role = 'family') => {
      soundFx.sparkle();
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: name, role, device }),
        });
        if (res.ok) {
          const created = await res.json();
          const newUser: User = {
            id: String(created.id),
            name: created.username || name,
            avatar: role === 'guest' ? '🐱' : '✨',
            device: device || 'Universal Device',
            role,
            isActive: true,
            ipAddress: created.awg_ipv4 || '10.8.0.X',
            hysteriaAuth: created.hy2_token || '',
            rxBytes: 0,
            txBytes: 0,
            lastSeen: 'Just created',
            createdAt: new Date().toISOString().split('T')[0],
          };
          set((state) => ({
            users: [newUser, ...state.users],
            isAddUserModalOpen: false,
          }));
          return;
        }
      } catch (e) {
        console.warn('Backend API POST failed, using fallback:', e);
      }

      // Local fallback
      const currentUsers = get().users;
      const nextOctet = currentUsers.length + 2;
      const newUser: User = {
        id: `usr-${Date.now()}`,
        name,
        avatar: role === 'guest' ? '🐱' : '✨',
        device: device || 'Universal Device',
        role,
        isActive: true,
        ipAddress: `10.8.0.${nextOctet}`,
        hysteriaAuth: `hy2_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.random().toString(36).substring(2, 7)}`,
        rxBytes: 0,
        txBytes: 0,
        lastSeen: 'Just created',
        createdAt: new Date().toISOString().split('T')[0],
      };

      set({
        users: [newUser, ...currentUsers],
        isAddUserModalOpen: false,
      });
    },

    toggleUserStatus: async (id) => {
      soundFx.bleep();
      const user = get().users.find((u) => u.id === id);
      if (user) {
        const newStatus = !user.isActive;
        try {
          await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: newStatus }),
          });
        } catch (e) {
          console.warn('API PUT failed:', e);
        }
      }

      set((state) => ({
        users: state.users.map((u) =>
          u.id === id ? { ...u, isActive: !u.isActive } : u
        ),
      }));
    },

    deleteUser: async (id) => {
      soundFx.bleep();
      try {
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('API DELETE failed:', e);
      }
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
      }));
    },

    getMihomoSubscriptionUrl: (userId) => {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kiri.local';
      const u = get().users.find((user) => user.id === userId);
      const token = u?.hysteriaAuth || userId;
      return `${origin}/sub/${token}/mihomo.yaml`;
    },

    getWireguardConfigText: (user) => {
      return `[Interface]
PrivateKey = <CLIENT_PRIVATE_KEY_GENERATED>
Address = ${user.ipAddress}/32
DNS = 1.1.1.1, 8.8.8.8
Jc = 4
Jmin = 40
Jmax = 70
S1 = 15
S2 = 35
H1 = 184523910
H2 = 918237461
H3 = 472819382
H4 = 638291047

[Peer]
PublicKey = <SERVER_AWG_PUBLIC_KEY>
Endpoint = YOUR_SERVER_IP:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
`;
    },
  };
});
