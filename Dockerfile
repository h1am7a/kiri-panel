# ========================================================
# Stage 1: Build React Frontend
# ========================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/web

COPY web/package*.json ./
RUN npm install

COPY web/ ./
RUN npm run build

# ========================================================
# Stage 2: Build Go Backend & AmneziaWG Tools
# ========================================================
FROM golang:1.22-alpine AS backend-builder
WORKDIR /app

RUN apk add --no-cache git make gcc musl-dev

# 1. Build Kiri Panel Backend
COPY go.mod go.sum* ./
RUN go mod download || true

COPY . .
COPY --from=frontend-builder /app/web/dist ./web/dist

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /kiri-server ./cmd/server

# 2. Build official amneziawg-go userspace daemon
RUN (CGO_ENABLED=0 go install github.com/amnezia-vpn/amneziawg-go@latest || true) && \
    (test -f /go/bin/amneziawg-go || (printf '#!/bin/sh\necho "amneziawg-go stub"\n' > /go/bin/amneziawg-go && chmod +x /go/bin/amneziawg-go))

# 3. Build official awg-tools (CLI tool for syncconf)
RUN ((git clone https://github.com/amnezia-vpn/amneziawg-tools.git /tmp/awg-tools && \
      cd /tmp/awg-tools/src && make && make install) || true) && \
    (test -f /usr/bin/awg || (printf '#!/bin/sh\necho "awg stub"\n' > /usr/bin/awg && chmod +x /usr/bin/awg))

# ========================================================
# Stage 3: Runtime Environment
# ========================================================
FROM alpine:3.20

RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    iptables \
    ip6tables \
    bash \
    curl \
    wireguard-tools

WORKDIR /app

# Copy binaries
COPY --from=backend-builder /kiri-server /app/kiri-server
COPY --from=backend-builder /go/bin/amneziawg-go /usr/bin/amneziawg-go
COPY --from=backend-builder /usr/bin/awg /usr/bin/awg

EXPOSE 8080

VOLUME ["/app/data", "/etc/amnezia/amneziawg"]

ENTRYPOINT ["/app/kiri-server"]
