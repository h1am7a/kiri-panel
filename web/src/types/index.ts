export interface User {
  id: string;
  name: string;
  avatar?: string;
  device: string; // e.g. "iPhone 15 Pro", "MacBook Air", "Home Router"
  role: 'family' | 'guest' | 'admin';
  isActive: boolean;
  ipAddress: string;
  hysteriaAuth: string;
  rxBytes: number;
  txBytes: number;
  lastSeen?: string;
  createdAt: string;
}

export interface ServiceStatus {
  name: string;
  type: 'awg' | 'hy2';
  port: number;
  protocol: string;
  status: 'online' | 'degraded' | 'offline';
  peersCount: number;
  uptime: string;
  obfuscation: string; // e.g. "Junk Packet Matrix (Awg)" or "Gecko QUIC"
  currentSpeedMbps: {
    download: number;
    upload: number;
  };
}

export interface SystemStats {
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  totalRxBytes: number;
  totalTxBytes: number;
  activeTunnels: number;
  status: 'ONLINE' | 'DEGRADED' | 'MAINTENANCE';
}
