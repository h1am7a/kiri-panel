# 🌸 Kiri Panel // 霧 (Cyber-Moe VPN Management Matrix)

<p align="center">
  <img src="web/public/mascot/proud.jpg" width="280" alt="Kiri Mascot" />
  <br>
  <b>Твой личный проводник сквозь цифровой туман блокировок РКН и ТСПУ</b>
  <br>
  <i>AmneziaWG (AWG 2.0 / 3.1) + Hysteria 2 (Gecko) + Универсальный генератор подписок Mihomo</i>
</p>

---

## 🌟 Почему создана Kiri Panel?

Существующие панели либо перегружены лишними протоколами и биллингом (Marzban, 3x-ui), либо умеют только один протокол (wg-easy). 
В РФ в 2026 году связка **AmneziaWG (как основной туннель)** и **Hysteria 2 с Gecko (как непробиваемый резерв)** — самый стабильный дуэт для семьи и близких.

**Kiri Panel объединяет их в единую систему с одной кнопкой подключения для пользователей:**
1. **Никакой головной боли с ядрами Linux:** Работает в Docker через userspace `/dev/net/tun`. Не ломается при `apt update && apt upgrade` и обновлениях ядра Ubuntu!
2. **Нулевой даунтайм (Zero Reload):** Добавление и блокировка пользователей происходят мгновенно через HTTP Webhook Hysteria 2 и `awg syncconf`.
3. **Единый конфиг для семьи (Mihomo):** Родным не нужно ставить 3 разных приложения. Они ставят одно приложение (FlClash, Mihomo Party, Karing) и получают авто-переключение (Failover) под капотом:
   * **AmneziaWG** — основной скоростной протокол.
   * **Hysteria 2 (Gecko)** — авто-бэкап при блокировках.
   * **Сплит-туннель:** Госуслуги, Сбер, Т-Банк и сайты `.ru` идут напрямую мимо VPN на скорости домашнего тарифа!
4. **Уникальный Cyber-Moe дизайн:** Встроенный интерактивный маскот **Кири**, матовое стекло (Glassmorphism), HUD-карточки со статусами и синтезированные аниме-звуки интерфейса.

---

## 🚀 Быстрый старт на Ubuntu VPS

### 1. Быстрая установка на Ubuntu VPS (Однострочник)

Поскольку репозиторий приватный, выберите один из удобных способов:

#### ⚡ Вариант A (Через GitHub Personal Access Token — самый простой)
Создайте токен на GitHub (`Settings` -> `Developer Settings` -> `Personal Access Tokens (classic)` с галкой `repo`) и выполните на сервере:
```bash
git clone https://<ВАШ_GITHUB_TOKEN>@github.com/h1am7a/kiri-panel.git /opt/kiri-panel && cd /opt/kiri-panel && sudo bash install.sh
```

#### 🔑 Вариант B (Через SSH-ключ)
Если открытый SSH-ключ вашего сервера добавлен в ваш аккаунт GitHub:
```bash
git clone git@github.com:h1am7a/kiri-panel.git /opt/kiri-panel && cd /opt/kiri-panel && sudo bash install.sh
```

#### 📦 Вариант C (Копирование файлов напрямую без Git)
Если вы скопировали папку `kiri-panel` на сервер (например, через WinSCP / FileZilla / SCP):
```bash
cd /opt/kiri-panel && sudo bash install.sh
```

Скрипт **автоматически в один клик**:
* **Включит BBR Congestion Control** (алгоритм от Google для ускорения TCP/VPN соединений и снижения буферблоата).
* **Настроит сетевые UDP-буферы до 64 МБ** (`rmem_max` и `wmem_max` в ядре Linux), чтобы исключить потери UDP-пакетов в 4K YouTube на Hysteria 2 и AmneziaWG.
* **Увеличит системные лимиты сокетов** (`nofile` до 1,000,000) для стабильной работы 30+ одновременных устройств.
* Установит Docker и Docker Compose (если отсутствуют).
* Включит IPv4 / IPv6 Forwarding в ядре.
* Сгенерирует стартовые SSL-сертификаты.
* Соберет и запустит сервисы `kiri-panel` и `kiri-hysteria`.

### 3. Откройте панель в браузере
Перейдите по адресу:
```text
http://<IP_ВАШЕГО_СЕРВЕРА>:8080
```

---

## ⚙️ Структура проекта

* `cmd/server/main.go` — Точка входа Go-бэкенда, маршрутизатор и раздача встроенного React SPA.
* `internal/db/db.go` — База данных SQLite (`data/kiri.db`) без зависимости от CGO.
* `internal/service/awg/` — Генератор ключей Curve25519, конфигов AmneziaWG 2.0 / 3.1.
* `internal/service/hy2/` — HTTP Webhook аутентификатор для Hysteria 2 и конфиг сервера.
* `internal/service/mihomo/` — Генератор эталонного профиля подписки Mihomo с Failover и сплит-рулами.
* `web/` — Десктопный React + Tailwind UI с интерактивной тянкой Кири.
* `docker-compose.yml` — Оркестрация контейнеров панели и демона Hysteria 2.

---

## 📱 Клиентские приложения для семьи

| Платформа | Рекомендуемое приложение | Почему именно оно? |
| :--- | :--- | :--- |
| **Android** | [FlClash](https://github.com/chen08209/FlClash) | Нативное ядро Mihomo, русский язык, **плитка в шторке Android** |
| **Windows** | [Mihomo Party](https://github.com/mihomo-party-org/clash-party) или [Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev) | Удобный TUN-режим в 1 клик, авто-обновление ядер |
| **iOS** | [Karing](https://apps.apple.com/app/karing/id6472431578) (Бесплатно в RU App Store) | Читает подписку, нативно поддерживает Hysteria 2 Gecko |

---

## 🛡️ Безопасность и сертификаты (Let's Encrypt для Hysteria 2)

Для полноценной работы Hysteria 2 положите ваши валидные сертификаты Let's Encrypt в папку `data/certs/`:
* `data/certs/server.crt` (fullchain.pem)
* `data/certs/server.key` (privkey.pem)

---

<p align="center">
  <i>Разработано с душой для свободы интернета. Пусть цифровой туман рассеется! ✨</i>
</p>
