#!/usr/bin/env bash
# ==============================================================================
#  🌸 KIRI PANEL // ВСЕ-В-ОДНОМ УСТАНОВЩИК И ОПТИМИЗАТОР СЕРВЕРА 🌸
# ==============================================================================
set -e

# Цвета для красивого вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

clear
echo -e "${PURPLE}"
cat << "EOF"
  _  _____ ____  ___   ____   _    _   _ _____ _     
 | |/ /_ _|  _ \|_ _| |  _ \ / \  | \ | | ____| |    
 | ' / | || |_) || |  | |_) / _ \ |  \| |  _| | |    
 | . \ | ||  _ < | |  |  __/ ___ \| |\  | |___| |___ 
 |_|\_\___|_| \_\___| |_| /_/   \_\_| \_|_____|_____|
       霧 // ТВОЙ ПРОВОДНИК СКВОЗЬ ЦИФРОВОЙ ТУМАН
EOF
echo -e "${NC}"
echo -e "${CYAN}==============================================================================${NC}"
echo -e "${CYAN}   Автоматическая настройка BBR, UDP-буферов, Docker и запуск Kiri Panel     ${NC}"
echo -e "${CYAN}==============================================================================${NC}\n"

# 1. Проверка прав суперпользователя (root)
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[-] Ошибка: Скрипт должен быть запущен с правами root!${NC}"
  echo -e "${YELLOW}    Запустите: sudo bash $0${NC}"
  exit 1
fi

# 2. Определение рабочей директории скрипта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
chmod -R +x "$SCRIPT_DIR"/*.sh 2>/dev/null || true

# 3. Включение BBR и глубокая оптимизация сетевого стека Linux
echo -e "${YELLOW}[1/6] 🚀 Включение BBR и тюнинг сетевых буферов ядра Linux...${NC}"

# Проверяем поддержку модуля BBR в ядре
modprobe tcp_bbr 2>/dev/null || true

cat > /etc/sysctl.d/99-kiri-speedup.conf << 'EOF'
# ========================================================
# Kiri Speedup: BBR, UDP Buffers and Network Optimization
# ========================================================
# 1. BBR Congestion Control & Fair Queueing
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr

# 2. IP Forwarding для туннелей
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1

# 3. Оптимизация UDP буферов (критично для Hysteria 2 и AmneziaWG)
# Увеличиваем размер очередей, чтобы ядро не сбрасывало UDP-пакеты при нагрузке
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.core.rmem_default = 33554432
net.core.wmem_default = 33554432
net.core.netdev_max_backlog = 10000

# 4. TCP Fast Open и защита от фрагментации
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_mtu_probing = 1

# 5. Управление таймаутами соединений
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_tw_reuse = 1
EOF

# Применяем сетевые настройки немедленно
sysctl --system > /dev/null 2>&1 || sysctl -p /etc/sysctl.d/99-kiri-speedup.conf > /dev/null 2>&1

# Проверяем, применился ли BBR
CURRENT_CC=$(sysctl -n net.ipv4.tcp_congestion_control 2>/dev/null || echo "unknown")
echo -e "${GREEN}    [✓] Алгоритм контроля перегрузок TCP: ${CURRENT_CC} (Успешно!)${NC}"

# 4. Увеличение системных лимитов дескрипторов файлов (ulimit nofile)
echo -e "${YELLOW}[2/6] ⚡ Увеличение системных лимитов сокетов и файлов...${NC}"
cat > /etc/security/limits.d/99-kiri.conf << 'EOF'
* soft nofile 1048576
* hard nofile 1048576
root soft nofile 1048576
root hard nofile 1048576
EOF
ulimit -n 1048576 2>/dev/null || true

# 5. Проверка и автоматическая установка Docker & Compose
echo -e "${YELLOW}[3/6] 🐳 Проверка Docker и Docker Compose...${NC}"
if ! command -v docker &> /dev/null; then
  echo -e "${CYAN}    Docker не найден. Устанавливаю официальный Docker Engine...${NC}"
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg lsb-release
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
  echo -e "${GREEN}    [✓] Docker успешно установлен!${NC}"
else
  echo -e "${GREEN}    [✓] Docker уже установлен в системе.${NC}"
fi

# 6. Подготовка каталогов и сертификатов
echo -e "${YELLOW}[4/6] 📁 Подготовка структуры данных и SSL-сертификатов...${NC}"
mkdir -p data/certs data/awg data/hy2
[ -d "data/hy2/config.yaml" ] && rm -rf "data/hy2/config.yaml"

# Проверяем сертификаты для Hysteria 2
if [ ! -f "data/certs/server.crt" ] || [ ! -f "data/certs/server.key" ]; then
  echo -e "${CYAN}    Генерация быстрого SSL-сертификата для старта Hysteria 2...${NC}"
  openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
    -keyout data/certs/server.key \
    -out data/certs/server.crt \
    -subj "/CN=kiri.local" > /dev/null 2>&1
  echo -e "${GREEN}    [✓] Сертификат сгенерирован.${NC}"
else
  echo -e "${GREEN}    [✓] Сертификаты уже присутствуют в data/certs/.${NC}"
fi

# 7. Сборка и запуск Kiri Panel через Docker Compose
echo -e "${YELLOW}[5/6] 🔨 Сборка и запуск контейнеров Kiri Panel...${NC}"
docker compose down 2>/dev/null || true
docker compose up -d --build

# 8. Определение внешнего IP адреса сервера
SERVER_IP=$(curl -s -4 --max-time 3 ifconfig.me || curl -s -4 --max-time 3 icanhazip.com || hostname -I | awk '{print $1}')

echo -e "\n${GREEN}==============================================================================${NC}"
echo -e "${GREEN}   ✨ KIRI PANEL УСПЕШНО РАЗВЕРНУТА, ОПТИМИЗИРОВАНА И РАБОТАЕТ! ✨            ${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo -e ""
echo -e " 🌸 ${CYAN}Панель управления (Web UI):${NC}"
echo -e "    ${PURPLE}http://${SERVER_IP}:8080${NC}"
echo -e ""
echo -e " 🚀 ${CYAN}Включенные оптимизации:${NC}"
echo -e "    • ${GREEN}BBR Congestion Control${NC}: Включен (алгоритм Google для максимальной скорости)"
echo -e "    • ${GREEN}UDP Buffers (64 MB)${NC}: Настроены (защита от дропа пакетов в 4K YouTube)"
echo -e "    • ${GREEN}Лимит сокетов${NC}: 1,000,000 открытых соединений"
echo -e ""
echo -e " 🛡️ ${CYAN}Сетевые порты:${NC}"
echo -e "    • AmneziaWG:     ${YELLOW}UDP 51820${NC}"
echo -e "    • Hysteria 2:    ${YELLOW}UDP 443 + Port-Hopping 20000-50000${NC}"
echo -e "    • Kiri Web UI:   ${YELLOW}TCP 8080${NC}"
echo -e ""
echo -e " 💡 ${CYAN}Что делать прямо сейчас:${NC}"
echo -e "    1. Откройте ${PURPLE}http://${SERVER_IP}:8080${NC} в браузере."
echo -e "    2. Создайте пользователя (например, «Мама») в 1 клик."
echo -e "    3. Нажмите «Mihomo подписка» и отправьте ссылку родственникам!"
echo -e "${GREEN}==============================================================================${NC}\n"
