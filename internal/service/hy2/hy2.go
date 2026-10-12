package hy2

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// AuthRequest represents the incoming payload from Hysteria 2 HTTP Webhook.
type AuthRequest struct {
	Addr string `json:"addr"` // Client IP:port
	Auth string `json:"auth"` // User token / password provided by client
	Tx   uint64 `json:"tx"`   // Current TX bytes if sent
	Rx   uint64 `json:"rx"`   // Current RX bytes if sent
}

// AuthResponse represents the JSON response expected by Hysteria 2 HTTP Webhook.
type AuthResponse struct {
	OK bool   `json:"ok"`
	ID string `json:"id,omitempty"` // User identifier/username if authenticated
}

// Authenticator interface defines checking user token against the database.
type Authenticator interface {
	// AuthenticateUser returns the user's username/ID and whether the user is active/enabled.
	AuthenticateUser(ctx context.Context, token string) (username string, active bool, err error)
}

// AuthenticatorFunc is an adapter to allow the use of ordinary functions as Authenticator.
type AuthenticatorFunc func(ctx context.Context, token string) (username string, active bool, err error)

func (f AuthenticatorFunc) AuthenticateUser(ctx context.Context, token string) (string, bool, error) {
	return f(ctx, token)
}

// ServerConfig holds the parameters for Hysteria 2 server configuration (hysteria.yaml).
type ServerConfig struct {
	Listen             string `json:"listen" yaml:"listen"`                           // e.g. ":8443" or ":443"
	ObfsType           string `json:"obfs_type" yaml:"obfs_type"`                     // e.g. "gecko"
	ObfsPassword       string `json:"obfs_password" yaml:"obfs_password"`             // Secret for gecko obfuscation
	AuthURL            string `json:"auth_url" yaml:"auth_url"`                       // e.g. "http://127.0.0.1:8080/api/v1/hy2/auth"
	TLSCert            string `json:"tls_cert" yaml:"tls_cert"`                       // Path to fullchain.pem / server.crt
	TLSKey             string `json:"tls_key" yaml:"tls_key"`                         // Path to privkey.pem / server.key
	TrafficStatsListen string `json:"traffic_stats_listen" yaml:"traffic_stats_listen"` // e.g. "127.0.0.1:9999"
	TrafficStatsSecret string `json:"traffic_stats_secret" yaml:"traffic_stats_secret"` // Optional secret for traffic stats
	MasqueradeURL      string `json:"masquerade_url" yaml:"masquerade_url"`           // e.g. "https://bing.com"
	BandwidthUp        string `json:"bandwidth_up" yaml:"bandwidth_up"`               // e.g. "1 gbps"
	BandwidthDown      string `json:"bandwidth_down" yaml:"bandwidth_down"`           // e.g. "1 gbps"
}

// Service provides Hysteria 2 authentication and config generation operations.
type Service struct {
	mu            sync.RWMutex
	authenticator Authenticator
	configPath    string
}

// NewService creates a new Hysteria 2 service instance.
func NewService(authenticator Authenticator, configPath string) *Service {
	if configPath == "" {
		configPath = "/etc/hysteria/config.yaml"
	}
	return &Service{
		authenticator: authenticator,
		configPath:    configPath,
	}
}

// SetAuthenticator updates the authenticator handler.
func (s *Service) SetAuthenticator(authenticator Authenticator) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.authenticator = authenticator
}

// Authenticate verifies the token against the user database and returns an AuthResponse.
// If active, returns {"ok": true, "id": username}.
// If inactive, not found or error, returns {"ok": false}.
func (s *Service) Authenticate(ctx context.Context, payload AuthRequest) AuthResponse {
	token := strings.TrimSpace(payload.Auth)
	if token == "" {
		return AuthResponse{OK: false}
	}

	s.mu.RLock()
	auth := s.authenticator
	s.mu.RUnlock()

	if auth == nil {
		return AuthResponse{OK: false}
	}

	username, active, err := auth.AuthenticateUser(ctx, token)
	if err != nil || !active || username == "" {
		return AuthResponse{OK: false}
	}

	return AuthResponse{
		OK: true,
		ID: username,
	}
}

// AuthenticateJSON parses the raw JSON request and returns the serialized JSON response.
func (s *Service) AuthenticateJSON(ctx context.Context, body []byte) ([]byte, error) {
	var req AuthRequest
	if err := json.Unmarshal(body, &req); err != nil {
		resp := AuthResponse{OK: false}
		return json.Marshal(resp)
	}

	resp := s.Authenticate(ctx, req)
	return json.Marshal(resp)
}

// GenerateServerConfig builds the YAML configuration for Hysteria 2 server daemon.
func GenerateServerConfig(cfg ServerConfig) string {
	listen := cfg.Listen
	if listen == "" {
		listen = ":8443"
	}

	obfsType := cfg.ObfsType
	if obfsType == "" {
		obfsType = "gecko"
	}

	authURL := cfg.AuthURL
	if authURL == "" {
		authURL = "http://127.0.0.1:8080/api/v1/hy2/auth"
	}

	tlsCert := cfg.TLSCert
	if tlsCert == "" {
		tlsCert = "/etc/hysteria/certs/server.crt"
	}
	tlsKey := cfg.TLSKey
	if tlsKey == "" {
		tlsKey = "/etc/hysteria/certs/server.key"
	}

	statsListen := cfg.TrafficStatsListen
	if statsListen == "" {
		statsListen = "127.0.0.1:9999"
	}

	masquerade := cfg.MasqueradeURL
	if masquerade == "" {
		masquerade = "https://bing.com"
	}

	var sb strings.Builder
	sb.WriteString("# Hysteria 2 Server Configuration generated by Kiri Panel\n")
	sb.WriteString(fmt.Sprintf("listen: %s\n\n", listen))

	// Obfuscation section
	sb.WriteString("obfs:\n")
	sb.WriteString(fmt.Sprintf("  type: %s\n", obfsType))
	if obfsType == "gecko" && cfg.ObfsPassword != "" {
		sb.WriteString(fmt.Sprintf("  %s:\n", obfsType))
		sb.WriteString(fmt.Sprintf("    password: %q\n", cfg.ObfsPassword))
	}
	sb.WriteString("\n")

	// HTTP Auth section
	sb.WriteString("auth:\n")
	sb.WriteString("  type: http\n")
	sb.WriteString("  http:\n")
	sb.WriteString(fmt.Sprintf("    url: %q\n", authURL))
	sb.WriteString("    insecure: true\n\n")

	// TLS section
	sb.WriteString("tls:\n")
	sb.WriteString(fmt.Sprintf("  cert: %q\n", tlsCert))
	sb.WriteString(fmt.Sprintf("  key: %q\n\n", tlsKey))

	// Traffic Stats
	sb.WriteString("trafficStats:\n")
	sb.WriteString(fmt.Sprintf("  listen: %q\n", statsListen))
	if cfg.TrafficStatsSecret != "" {
		sb.WriteString(fmt.Sprintf("  secret: %q\n", cfg.TrafficStatsSecret))
	}
	sb.WriteString("\n")

	// Masquerade
	sb.WriteString("masquerade:\n")
	sb.WriteString("  type: proxy\n")
	sb.WriteString("  proxy:\n")
	sb.WriteString(fmt.Sprintf("    url: %q\n", masquerade))
	sb.WriteString("    rewriteHost: true\n")

	// Bandwidth
	if cfg.BandwidthUp != "" && cfg.BandwidthDown != "" {
		sb.WriteString("\nbandwidth:\n")
		sb.WriteString(fmt.Sprintf("  up: %q\n", cfg.BandwidthUp))
		sb.WriteString(fmt.Sprintf("  down: %q\n", cfg.BandwidthDown))
	}

	return sb.String()
}

// SaveConfig writes the generated YAML configuration to file.
func (s *Service) SaveConfig(content string) error {
	dir := filepath.Dir(s.configPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", dir, err)
	}
	if err := os.WriteFile(s.configPath, []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to write hysteria config file %s: %w", s.configPath, err)
	}
	return nil
}
