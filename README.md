# Kiri Panel

Lightweight management dashboard for **AmneziaWG** and **Hysteria 2**, designed for personal and family use. Generates unified **Mihomo (Clash.Meta)** subscription configs with automatic failover and split routing.

<p align="center">
  <img src="web/public/mascot/proud.jpg" width="220" alt="Kiri Panel" />
</p>

## Overview

Kiri Panel pairs two anti-censorship protocols into a single service:
- **AmneziaWG (AWG 2.0 / 3.1):** Primary low-latency WireGuard tunnel with junk packet and header obfuscation (`Jc`, `Jmin`, `Jmax`, `S1`, `S2`, `H1-H4`).
- **Hysteria 2:** Backup QUIC-based tunnel with Gecko obfuscation for restrictive networks.
- **Mihomo Generator:** Serves dynamic YAML profiles with auto-failover (AmneziaWG primary, Hysteria 2 backup) and split tunneling rules (bypassing local services, routing foreign traffic).
- **Userspace Operation:** Runs via `amneziawg-go` in Docker over `/dev/net/tun`. No host DKMS module build required; resilient against host kernel updates.
- **Zero-Downtime User Management:** Dynamic peer syncing via `awg syncconf` and Hysteria 2 HTTP auth webhook.

## Architecture

```
Clients (Mihomo Party / FlClash / Karing / AmneziaWG)
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
AmneziaWG (UDP 51820)      Hysteria 2 (UDP 443 + Hopping)
       │                           │
       └─────────────┬─────────────┘
                     ▼
             Docker Container
     ┌───────────────────────────────┐
     │ Kiri Panel (Go + React SPA)   │
     │ - REST API (:8080)            │
     │ - Subscriptions (/sub/:token) │
     │ - Hysteria Auth Webhook       │
     │ - Embedded SQLite Database    │
     └───────────────────────────────┘
```

## Quick Start (Ubuntu VPS)

### One-line Installation

```bash
git clone https://github.com/h1am7a/kiri-panel.git /opt/kiri-panel && cd /opt/kiri-panel && sudo bash install.sh
```

*(If the repository is private, authenticate via SSH key or pass a GitHub personal access token in the clone URL).*

The installer script (`install.sh`) automatically:
1. Enables **BBR congestion control** (`net.ipv4.tcp_congestion_control = bbr`).
2. Configures **64 MB UDP buffers** (`rmem_max` / `wmem_max = 67108864`) to eliminate UDP packet drops under high throughput.
3. Sets system socket descriptors (`nofile = 1048576`).
4. Installs Docker and Docker Compose (if not already installed).
5. Generates self-signed TLS certificates for initial setup.
6. Builds and starts the `kiri-panel` and `kiri-hysteria` containers.

### Accessing the Web UI

Once installed, open your browser:
```
http://<SERVER_IP>:8080
```

From the dashboard you can:
- Add or disable peers.
- Copy client subscription URLs (`/sub/:token/mihomo.yaml`).
- Download raw `.conf` profiles for official AmneziaWG clients.
- View real-time tunnel telemetry and server status.

## Client Support

| Platform | Recommended Client | Engine / Features |
| :--- | :--- | :--- |
| **Android** | [FlClash](https://github.com/chen08209/FlClash) | Mihomo core, Quick Settings tile |
| **Windows** | [Mihomo Party](https://github.com/mihomo-party-org/clash-party) / [Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev) | One-click TUN mode, Mihomo >= 1.19.30 |
| **iOS** | [Karing](https://apps.apple.com/app/karing/id6472431578) | Supports Mihomo subscriptions, native Hy2 Gecko |

## Network Ports

| Service | Port | Protocol | Purpose |
| :--- | :--- | :--- | :--- |
| Kiri Web UI | `8080` | TCP | Admin dashboard & subscription endpoint |
| AmneziaWG | `51820` | UDP | Obfuscated WireGuard tunnel |
| Hysteria 2 | `443` | UDP | QUIC proxy |
| Hysteria Hopping | `20000-50000` | UDP | Port hopping range |

## Custom TLS Certificates (Hysteria 2)

By default, the installer generates self-signed certificates in `data/certs/`. For trusted TLS with your own domain:
1. Place your certificates in `data/certs/`:
   - `data/certs/server.crt` (fullchain)
   - `data/certs/server.key` (private key)
2. In the panel settings, specify your domain name.
3. Restart containers:
   ```bash
   docker compose restart
   ```

## License

MIT
