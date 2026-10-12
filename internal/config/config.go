package config

import (
	"crypto/rand"
	"encoding/hex"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
)

// Config represents panel runtime configuration.
type Config struct {
	Port          int
	DataDir       string
	SecretToken   string
	AWGConfigPath string
}

// Load loads configuration from environment variables and command-line flags.
func Load() (*Config, error) {
	defaultPort := 8080
	if envPort := os.Getenv("PORT"); envPort != "" {
		if p, err := strconv.Atoi(envPort); err == nil {
			defaultPort = p
		}
	}

	defaultDataDir := "./data"
	if envDataDir := os.Getenv("DATA_DIR"); envDataDir != "" {
		defaultDataDir = envDataDir
	}

	defaultSecretToken := os.Getenv("SECRET_TOKEN")
	if defaultSecretToken == "" {
		// Generate random 16-byte token if not set
		b := make([]byte, 16)
		if _, err := rand.Read(b); err == nil {
			defaultSecretToken = hex.EncodeToString(b)
		} else {
			defaultSecretToken = "kiri-panel-secret-token"
		}
	}

	defaultAWGConfigPath := filepath.Join(defaultDataDir, "awg", "awg0.conf")
	if envAWG := os.Getenv("AWG_CONFIG_PATH"); envAWG != "" {
		defaultAWGConfigPath = envAWG
	}

	port := flag.Int("port", defaultPort, "HTTP server port")
	dataDir := flag.String("data-dir", defaultDataDir, "Directory to store SQLite database and configs")
	secretToken := flag.String("secret-token", defaultSecretToken, "Secret API/Admin authentication token")
	awgConfigPath := flag.String("awg-config", defaultAWGConfigPath, "Path to AmneziaWG server config")

	// Parse flags only if not already parsed
	if !flag.Parsed() {
		flag.Parse()
	}

	cfg := &Config{
		Port:          *port,
		DataDir:       *dataDir,
		SecretToken:   *secretToken,
		AWGConfigPath: *awgConfigPath,
	}

	// Ensure DataDir exists
	if err := os.MkdirAll(cfg.DataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory %s: %w", cfg.DataDir, err)
	}

	return cfg, nil
}
