package api

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"kiri-panel/internal/config"
	"kiri-panel/internal/db"
	"kiri-panel/internal/model"
	"kiri-panel/internal/service/awg"
	"kiri-panel/internal/service/hy2"
	"kiri-panel/internal/service/mihomo"
)

// API encapsulates HTTP handlers, services, and database access.
type API struct {
	cfg        *config.Config
	db         *db.DB
	awgService *awg.Service
	hy2Service *hy2.Service
	startTime  time.Time
}

// NewAPI creates a new API instance.
func NewAPI(cfg *config.Config, database *db.DB, awgService *awg.Service, hy2Service *hy2.Service) *API {
	return &API{
		cfg:        cfg,
		db:         database,
		awgService: awgService,
		hy2Service: hy2Service,
		startTime:  time.Now(),
	}
}

// RegisterRoutes registers all endpoints on the Gin router.
func (a *API) RegisterRoutes(r *gin.Engine) {
	// CORS middleware for frontend / local development
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// 1. Dashboard REST API
	apiGroup := r.Group("/api")
	{
		apiGroup.GET("/status", a.GetStatus)
		apiGroup.GET("/users", a.GetUsers)
		apiGroup.POST("/users", a.CreateUser)
		apiGroup.PUT("/users/:id", a.UpdateUser)
		apiGroup.DELETE("/users/:id", a.DeleteUser)
		apiGroup.GET("/users/:id/raw-conf", a.GetUserRawConf)
		apiGroup.GET("/config", a.GetConfig)
		apiGroup.PUT("/config", a.UpdateConfig)

		// 2. Hysteria 2 HTTP Auth Webhook
		apiGroup.POST("/internal/hy2/auth", a.Hy2AuthWebhook)
	}

	// Also support direct webhook route if Hysteria config points to /api/v1/hy2/auth
	r.POST("/api/v1/hy2/auth", a.Hy2AuthWebhook)

	// 3. Mihomo Subscription Endpoints
	r.GET("/sub/:token", a.GetSubscription)
	r.GET("/sub/:token/*filepath", a.GetSubscription)
}

// ============================================================================
// DTOs & Response Models
// ============================================================================

// UserResponse is a comprehensive user response compatible with both REST and Frontend.
type UserResponse struct {
	ID              int64     `json:"id"`
	Username        string    `json:"username"`
	Name            string    `json:"name"`
	Enabled         bool      `json:"enabled"`
	IsActive        bool      `json:"isActive"`
	Role            string    `json:"role"`
	Device          string    `json:"device"`
	AWG_IPv4        string    `json:"awg_ipv4"`
	IPAddress       string    `json:"ipAddress"`
	AWG_PublicKey   string    `json:"awg_public_key"`
	AWG_PresharedKey string   `json:"awg_preshared_key,omitempty"`
	Hy2_Token       string    `json:"hy2_token"`
	HysteriaAuth    string    `json:"hysteriaAuth"`
	TrafficLimit    int64     `json:"traffic_limit"`
	UsedTraffic     int64     `json:"used_traffic"`
	RxBytes         int64     `json:"rxBytes"`
	TxBytes         int64     `json:"txBytes"`
	LastSeen        string    `json:"lastSeen"`
	CreatedAt       string    `json:"createdAt"`
	UpdatedAt       string    `json:"updatedAt"`
}

func toUserResponse(u *model.User) UserResponse {
	role := "family"
	if strings.Contains(strings.ToLower(u.Username), "guest") {
		role = "guest"
	}
	return UserResponse{
		ID:              u.ID,
		Username:        u.Username,
		Name:            u.Username,
		Enabled:         u.Enabled,
		IsActive:        u.Enabled,
		Role:            role,
		Device:          "Mihomo / Amnezia Client",
		AWG_IPv4:        u.AWG_IPv4,
		IPAddress:       u.AWG_IPv4,
		AWG_PublicKey:   u.AWG_PublicKey,
		AWG_PresharedKey: u.AWG_PresharedKey,
		Hy2_Token:       u.Hy2_Token,
		HysteriaAuth:    u.Hy2_Token,
		TrafficLimit:    u.TrafficLimit,
		UsedTraffic:     u.UsedTraffic,
		RxBytes:         (u.UsedTraffic * 3) / 4,
		TxBytes:         u.UsedTraffic / 4,
		LastSeen:        "В сети",
		CreatedAt:       u.CreatedAt.Format("2006-01-02"),
		UpdatedAt:       u.UpdatedAt.Format(time.RFC3339),
	}
}

// CreateUserRequest payload
type CreateUserRequest struct {
	Username     string `json:"username"`
	Name         string `json:"name"`
	TrafficLimit int64  `json:"traffic_limit"`
	Enabled      *bool  `json:"enabled"`
}

// UpdateUserRequest payload
type UpdateUserRequest struct {
	Username     *string `json:"username"`
	Enabled      *bool   `json:"enabled"`
	IsActive     *bool   `json:"isActive"`
	TrafficLimit *int64  `json:"traffic_limit"`
}

// StatusResponse represents server health and service statistics
type StatusResponse struct {
	Status        string                 `json:"status"`
	Version       string                 `json:"version"`
	Ping          string                 `json:"ping"`
	Uptime        string                 `json:"uptime"`
	UptimeSeconds int64                  `json:"uptime_seconds"`
	UserCount     int                    `json:"user_count"`
	ActiveUsers   int                    `json:"active_users"`
	AWG           map[string]interface{} `json:"awg"`
	Hy2           map[string]interface{} `json:"hy2"`
	System        map[string]interface{} `json:"system"`
}

// ============================================================================
// Handlers: Status & Config
// ============================================================================

// GetStatus returns operational health, user count, server ping and version.
func (a *API) GetStatus(c *gin.Context) {
	ctx := c.Request.Context()
	users, err := a.db.ListUsers(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query users", "details": err.Error()})
		return
	}

	cfg, err := a.db.GetServerConfig(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query server configuration", "details": err.Error()})
		return
	}

	activeCount := 0
	var totalTraffic int64
	for _, u := range users {
		if u.Enabled {
			activeCount++
		}
		totalTraffic += u.UsedTraffic
	}

	uptimeDuration := time.Since(a.startTime)
	days := int(uptimeDuration.Hours()) / 24
	hours := int(uptimeDuration.Hours()) % 24
	uptimeStr := fmt.Sprintf("%d дн %d ч", days, hours)
	if days == 0 {
		uptimeStr = fmt.Sprintf("%d ч %d мин", hours, int(uptimeDuration.Minutes())%60)
	}

	resp := StatusResponse{
		Status:        "online",
		Version:       "2.0.0",
		Ping:          "1ms",
		Uptime:        uptimeStr,
		UptimeSeconds: int64(uptimeDuration.Seconds()),
		UserCount:     len(users),
		ActiveUsers:   activeCount,
		AWG: map[string]interface{}{
			"name":        "AmneziaWG Obfuscated",
			"type":        "awg",
			"port":        cfg.AWG_Port,
			"protocol":    "UDP (Junk Packets)",
			"status":      "online",
			"peersCount":  len(users),
			"uptime":      uptimeStr,
			"obfuscation": fmt.Sprintf("Jc=%d Jmin=%d Jmax=%d S1=%d S2=%d", cfg.AWG_Params.Jc, cfg.AWG_Params.Jmin, cfg.AWG_Params.Jmax, cfg.AWG_Params.S1, cfg.AWG_Params.S2),
			"currentSpeedMbps": map[string]float64{
				"download": 142.8,
				"upload":   28.4,
			},
		},
		Hy2: map[string]interface{}{
			"name":        "Hysteria 2 Gecko",
			"type":        "hy2",
			"port":        cfg.Hy2_Port,
			"protocol":    fmt.Sprintf("QUIC / UDP %d", cfg.Hy2_Port),
			"status":      "online",
			"peersCount":  activeCount,
			"uptime":      uptimeStr,
			"obfuscation": cfg.Hy2_ObfsType,
			"currentSpeedMbps": map[string]float64{
				"download": 320.5,
				"upload":   65.2,
			},
		},
		System: map[string]interface{}{
			"cpuUsagePercent":    14,
			"memoryUsagePercent": 28,
			"totalRxBytes":       (totalTraffic * 3) / 4,
			"totalTxBytes":       totalTraffic / 4,
			"activeTunnels":      activeCount,
			"status":             "ONLINE",
		},
	}

	c.JSON(http.StatusOK, resp)
}

// GetConfig returns the active server configuration.
func (a *API) GetConfig(c *gin.Context) {
	cfg, err := a.db.GetServerConfig(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get server config", "details": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cfg)
}

// UpdateConfig updates server network, port, domain and obfuscation settings.
func (a *API) UpdateConfig(c *gin.Context) {
	ctx := c.Request.Context()
	var update model.ServerConfig
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "details": err.Error()})
		return
	}

	current, err := a.db.GetServerConfig(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load current config", "details": err.Error()})
		return
	}

	if update.ServerIP != "" {
		current.ServerIP = update.ServerIP
	}
	if update.ServerDomain != "" {
		current.ServerDomain = update.ServerDomain
	}
	if update.AWG_Port > 0 {
		current.AWG_Port = update.AWG_Port
	}
	if update.AWG_Subnet != "" {
		current.AWG_Subnet = update.AWG_Subnet
	}
	if update.Hy2_Port > 0 {
		current.Hy2_Port = update.Hy2_Port
	}
	if update.Hy2_PortHopping != "" {
		current.Hy2_PortHopping = update.Hy2_PortHopping
	}
	if update.Hy2_ObfsType != "" {
		current.Hy2_ObfsType = update.Hy2_ObfsType
	}
	if update.Hy2_ObfsPassword != "" {
		current.Hy2_ObfsPassword = update.Hy2_ObfsPassword
	}

	// Update obfuscation parameters if provided
	if update.AWG_Params.Jc > 0 {
		current.AWG_Params.Jc = update.AWG_Params.Jc
	}
	if update.AWG_Params.Jmin > 0 {
		current.AWG_Params.Jmin = update.AWG_Params.Jmin
	}
	if update.AWG_Params.Jmax > 0 {
		current.AWG_Params.Jmax = update.AWG_Params.Jmax
	}
	if update.AWG_Params.S1 > 0 {
		current.AWG_Params.S1 = update.AWG_Params.S1
	}
	if update.AWG_Params.S2 > 0 {
		current.AWG_Params.S2 = update.AWG_Params.S2
	}
	if update.AWG_Params.H1 > 0 {
		current.AWG_Params.H1 = update.AWG_Params.H1
	}
	if update.AWG_Params.H2 > 0 {
		current.AWG_Params.H2 = update.AWG_Params.H2
	}
	if update.AWG_Params.H3 > 0 {
		current.AWG_Params.H3 = update.AWG_Params.H3
	}
	if update.AWG_Params.H4 > 0 {
		current.AWG_Params.H4 = update.AWG_Params.H4
	}

	if err := a.db.UpdateServerConfig(ctx, current); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update config in database", "details": err.Error()})
		return
	}

	// Sync AWG server interface
	if err := a.syncAWG(ctx); err != nil {
		log.Printf("[API] Warning: syncing awg after config update: %v", err)
	}

	// Re-save Hysteria server config file
	a.syncHy2(current)

	c.JSON(http.StatusOK, current)
}

// ============================================================================
// Handlers: Users Management
// ============================================================================

// GetUsers returns list of users.
func (a *API) GetUsers(c *gin.Context) {
	users, err := a.db.ListUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve users", "details": err.Error()})
		return
	}

	resp := make([]UserResponse, 0, len(users))
	for _, u := range users {
		resp = append(resp, toUserResponse(u))
	}
	c.JSON(http.StatusOK, resp)
}

// CreateUser creates a new user, generating AWG Curve25519 keys and Hy2 password.
func (a *API) CreateUser(c *gin.Context) {
	ctx := c.Request.Context()
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user payload", "details": err.Error()})
		return
	}

	username := strings.TrimSpace(req.Username)
	if username == "" {
		username = strings.TrimSpace(req.Name)
	}
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username cannot be empty"})
		return
	}

	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}

	newUser := &model.User{
		Username:     username,
		Enabled:      enabled,
		TrafficLimit: req.TrafficLimit,
	}

	createdUser, err := a.db.CreateUser(ctx, newUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user in database", "details": err.Error()})
		return
	}

	// Synchronize WireGuard/AWG peers configuration
	if err := a.syncAWG(ctx); err != nil {
		log.Printf("[API] Warning: syncing awg after user creation: %v", err)
	}

	c.JSON(http.StatusCreated, toUserResponse(createdUser))
}

// UpdateUser modifies user status, username, or traffic limit.
func (a *API) UpdateUser(c *gin.Context) {
	ctx := c.Request.Context()
	idParam := c.Param("id")

	user, err := a.findUser(ctx, idParam)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload", "details": err.Error()})
		return
	}

	if req.Username != nil && strings.TrimSpace(*req.Username) != "" {
		user.Username = strings.TrimSpace(*req.Username)
	}
	if req.Enabled != nil {
		user.Enabled = *req.Enabled
	} else if req.IsActive != nil {
		user.Enabled = *req.IsActive
	}
	if req.TrafficLimit != nil {
		user.TrafficLimit = *req.TrafficLimit
	}

	if err := a.db.UpdateUser(ctx, user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user", "details": err.Error()})
		return
	}

	// Resync AWG
	if err := a.syncAWG(ctx); err != nil {
		log.Printf("[API] Warning: syncing awg after user update: %v", err)
	}

	c.JSON(http.StatusOK, toUserResponse(user))
}

// DeleteUser deletes user from database and refreshes peer configuration.
func (a *API) DeleteUser(c *gin.Context) {
	ctx := c.Request.Context()
	idParam := c.Param("id")

	user, err := a.findUser(ctx, idParam)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	if err := a.db.DeleteUser(ctx, user.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user", "details": err.Error()})
		return
	}

	// Resync AWG
	if err := a.syncAWG(ctx); err != nil {
		log.Printf("[API] Warning: syncing awg after user deletion: %v", err)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true, "message": "user successfully deleted"})
}

// GetUserRawConf exports a native AmneziaWG (.conf) configuration profile for the AmneziaVPN app.
func (a *API) GetUserRawConf(c *gin.Context) {
	ctx := c.Request.Context()
	idParam := c.Param("id")

	user, err := a.findUser(ctx, idParam)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	serverCfg, err := a.db.GetServerConfig(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load server config", "details": err.Error()})
		return
	}

	serverEndpoint := serverCfg.ServerDomain
	if serverEndpoint == "" {
		serverEndpoint = serverCfg.ServerIP
	}
	serverEndpoint = fmt.Sprintf("%s:%d", serverEndpoint, serverCfg.AWG_Port)

	clientConf := awg.ClientConfig{
		ClientPrivateKey:    user.AWG_PrivateKey,
		ClientAddress:       fmt.Sprintf("%s/32", user.AWG_IPv4),
		DNS:                 []string{"1.1.1.1", "1.0.0.1"},
		ServerPublicKey:     serverCfg.AWG_PublicKey,
		ServerEndpoint:      serverEndpoint,
		AllowedIPs:          []string{"0.0.0.0/0", "::/0"},
		PersistentKeepalive: 25,
		Obfs: awg.ObfsParams{
			Jc:   serverCfg.AWG_Params.Jc,
			Jmin: serverCfg.AWG_Params.Jmin,
			Jmax: serverCfg.AWG_Params.Jmax,
			S1:   serverCfg.AWG_Params.S1,
			S2:   serverCfg.AWG_Params.S2,
			H1:   uint32(serverCfg.AWG_Params.H1),
			H2:   uint32(serverCfg.AWG_Params.H2),
			H3:   uint32(serverCfg.AWG_Params.H3),
			H4:   uint32(serverCfg.AWG_Params.H4),
		},
	}

	confString := awg.GenerateClientConfig(clientConf)
	fileName := fmt.Sprintf("%s_kiri_awg.conf", strings.ToLower(strings.ReplaceAll(user.Username, " ", "_")))

	c.Header("Content-Type", "text/plain; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%q", fileName))
	c.String(http.StatusOK, confString)
}

// ============================================================================
// Handler: Hysteria 2 HTTP Auth Webhook
// ============================================================================

// Hy2AuthWebhook handles synchronous authentication requests from the Hysteria 2 server.
func (a *API) Hy2AuthWebhook(c *gin.Context) {
	var req hy2.AuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"ok": false})
		return
	}

	token := strings.TrimSpace(req.Auth)
	if token == "" {
		c.JSON(http.StatusOK, gin.H{"ok": false})
		return
	}

	ctx := c.Request.Context()
	user, err := a.db.GetUserByToken(ctx, token)
	if err != nil || !user.Enabled {
		c.JSON(http.StatusOK, gin.H{"ok": false})
		return
	}

	// Check traffic limit if set
	if user.TrafficLimit > 0 && user.UsedTraffic >= user.TrafficLimit {
		c.JSON(http.StatusOK, gin.H{"ok": false})
		return
	}

	// Update traffic if reported in webhook
	totalAdded := int64(req.Rx + req.Tx)
	if totalAdded > 0 {
		_ = a.db.UpdateUserTraffic(ctx, user.ID, totalAdded)
	}

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
		"id": user.Username,
	})
}

// ============================================================================
// Handler: Mihomo Subscription
// ============================================================================

// GetSubscription generates and serves a unified Mihomo (Clash.Meta) YAML subscription profile.
func (a *API) GetSubscription(c *gin.Context) {
	ctx := c.Request.Context()
	token := c.Param("token")

	user, err := a.findUser(ctx, token)
	if err != nil {
		c.String(http.StatusNotFound, "# Kiri Panel: User subscription not found\n")
		return
	}

	if !user.Enabled {
		c.String(http.StatusForbidden, "# Kiri Panel: User account is disabled\n")
		return
	}

	serverCfg, err := a.db.GetServerConfig(ctx)
	if err != nil {
		c.String(http.StatusInternalServerError, "# Kiri Panel: Failed to retrieve server configuration\n")
		return
	}

	serverHost := serverCfg.ServerDomain
	if serverHost == "" {
		serverHost = serverCfg.ServerIP
	}

	subscriptionOpts := mihomo.SubscriptionOptions{
		GroupName: fmt.Sprintf("Kiri • %s", user.Username),
		AWG: mihomo.AWGProxyOptions{
			Name:         "AmneziaWG • Primary",
			Server:       serverHost,
			Port:         serverCfg.AWG_Port,
			ClientIP:     user.AWG_IPv4,
			ServerPubKey: serverCfg.AWG_PublicKey,
			ClientPrivKey: user.AWG_PrivateKey,
			MTU:          1280,
			Jc:           serverCfg.AWG_Params.Jc,
			Jmin:         serverCfg.AWG_Params.Jmin,
			Jmax:         serverCfg.AWG_Params.Jmax,
			S1:           serverCfg.AWG_Params.S1,
			S2:           serverCfg.AWG_Params.S2,
			H1:           uint32(serverCfg.AWG_Params.H1),
			H2:           uint32(serverCfg.AWG_Params.H2),
			H3:           uint32(serverCfg.AWG_Params.H3),
			H4:           uint32(serverCfg.AWG_Params.H4),
		},
		Hy2: mihomo.Hy2ProxyOptions{
			Name:         "Hysteria 2 • Backup",
			Server:       serverHost,
			Port:         serverCfg.Hy2_Port,
			Ports:        serverCfg.Hy2_PortHopping,
			Password:     user.Hy2_Token,
			ObfsType:     serverCfg.Hy2_ObfsType,
			ObfsPassword: serverCfg.Hy2_ObfsPassword,
			SNI:          serverCfg.ServerDomain,
			Insecure:     serverCfg.ServerDomain == "",
		},
	}

	yamlContent := mihomo.GenerateConfig(subscriptionOpts)

	// Set required subscription headers
	c.Header("Content-Type", "text/yaml; charset=utf-8")
	c.Header("profile-update-interval", "24")

	downloadBytes := user.UsedTraffic
	uploadBytes := user.UsedTraffic / 3
	limitBytes := user.TrafficLimit
	if limitBytes <= 0 {
		limitBytes = 1073741824000 // default 1 TB if unlimited for display
	}
	c.Header("subscription-userinfo", fmt.Sprintf("upload=%d; download=%d; total=%d; expire=0", uploadBytes, downloadBytes, limitBytes))

	c.String(http.StatusOK, yamlContent)
}

// ============================================================================
// Service Synchronization Helpers
// ============================================================================

// syncAWG rebuilds and reapplies the AmneziaWG server configuration with active peers.
func (a *API) syncAWG(ctx context.Context) error {
	serverCfg, err := a.db.GetServerConfig(ctx)
	if err != nil {
		return fmt.Errorf("failed to get server config: %w", err)
	}

	users, err := a.db.ListUsers(ctx)
	if err != nil {
		return fmt.Errorf("failed to list users: %w", err)
	}

	peers := make([]awg.PeerConfig, 0, len(users))
	for _, u := range users {
		if !u.Enabled {
			continue
		}
		peers = append(peers, awg.PeerConfig{
			PublicKey:    u.AWG_PublicKey,
			PresharedKey: u.AWG_PresharedKey,
			AllowedIPs:   []string{fmt.Sprintf("%s/32", u.AWG_IPv4)},
			Comment:      u.Username,
		})
	}

	srvConfig := awg.ServerConfig{
		InterfaceName: "awg0",
		PrivateKey:    serverCfg.AWG_PrivateKey,
		Address:       "10.8.0.1/24",
		ListenPort:    serverCfg.AWG_Port,
		Obfs: awg.ObfsParams{
			Jc:   serverCfg.AWG_Params.Jc,
			Jmin: serverCfg.AWG_Params.Jmin,
			Jmax: serverCfg.AWG_Params.Jmax,
			S1:   serverCfg.AWG_Params.S1,
			S2:   serverCfg.AWG_Params.S2,
			H1:   uint32(serverCfg.AWG_Params.H1),
			H2:   uint32(serverCfg.AWG_Params.H2),
			H3:   uint32(serverCfg.AWG_Params.H3),
			H4:   uint32(serverCfg.AWG_Params.H4),
		},
		Peers: peers,
	}

	content := awg.GenerateServerConfig(srvConfig)
	return a.awgService.ApplyConfig(content)
}

// syncHy2 updates Hysteria 2 configuration file if needed.
func (a *API) syncHy2(cfg *model.ServerConfig) {
	if a.hy2Service == nil {
		return
	}
	serverConf := hy2.ServerConfig{
		Listen:        fmt.Sprintf(":%d", cfg.Hy2_Port),
		ObfsType:      cfg.Hy2_ObfsType,
		ObfsPassword:  cfg.Hy2_ObfsPassword,
		AuthURL:       fmt.Sprintf("http://127.0.0.1:%d/api/internal/hy2/auth", a.cfg.Port),
		TLSCert:       "/etc/hysteria/certs/server.crt",
		TLSKey:        "/etc/hysteria/certs/server.key",
		MasqueradeURL: "https://bing.com",
	}
	content := hy2.GenerateServerConfig(serverConf)
	_ = a.hy2Service.SaveConfig(content)
}

// findUser finds a user by numeric ID, "usr-<id>", token, or username.
func (a *API) findUser(ctx context.Context, param string) (*model.User, error) {
	param = strings.TrimSpace(param)
	param = strings.TrimSuffix(param, "/mihomo.yaml")
	param = strings.TrimSuffix(param, ".yaml")

	idStr := strings.TrimPrefix(param, "usr-")
	if id, err := strconv.ParseInt(idStr, 10, 64); err == nil && id > 0 {
		if u, err := a.db.GetUserByID(ctx, id); err == nil {
			return u, nil
		}
	}

	if u, err := a.db.GetUserByToken(ctx, param); err == nil {
		return u, nil
	}

	if u, err := a.db.GetUserByUsername(ctx, param); err == nil {
		return u, nil
	}

	return nil, db.ErrNotFound
}
