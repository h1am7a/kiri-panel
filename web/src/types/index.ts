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

export type Client = User;
export type ClientRole = 'family' | 'guest' | 'admin';

export type NavTab = 'overview' | 'clients' | 'inbounds' | 'settings';

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

export interface AWGParams {
  jc: number;
  jmin: number;
  jmax: number;
  s1: number;
  s2: number;
  h1: number;
  h2: number;
  h3: number;
  h4: number;
}

export interface ServerConfig {
  server_ip: string;
  server_domain: string;
  awg_port: number;
  awg_subnet: string;
  awg_params: AWGParams;
  hy2_port: number;
  hy2_port_hopping: string;
  hy2_obfs_type: string;
  hy2_obfs_password: string;
}
