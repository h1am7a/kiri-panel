package awg

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"math/big"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"golang.org/x/crypto/curve25519"
)

// KeyPair represents a Curve25519 public and private key pair encoded in Base64.
type KeyPair struct {
	PrivateKey string `json:"private_key"`
	PublicKey  string `json:"public_key"`
}

// ObfsParams represents AmneziaWG obfuscation parameters.
type ObfsParams struct {
	Jc   int    `json:"jc"`   // Junk packet count (1-128)
	Jmin int    `json:"jmin"` // Minimum junk packet size
	Jmax int    `json:"jmax"` // Maximum junk packet size
	S1   int    `json:"s1"`   // Initiation packet junk size
	S2   int    `json:"s2"`   // Response packet junk size
	H1   uint32 `json:"h1"`   // Initiation packet magic header
	H2   uint32 `json:"h2"`   // Response packet magic header
	H3   uint32 `json:"h3"`   // Cookie packet magic header
	H4   uint32 `json:"h4"`   // Data packet magic header
}

// PeerConfig holds configuration for a Wireguard/AWG peer.
type PeerConfig struct {
	PublicKey           string   `json:"public_key"`
	PresharedKey        string   `json:"preshared_key,omitempty"`
	AllowedIPs          []string `json:"allowed_ips"`
	Endpoint            string   `json:"endpoint,omitempty"`
	PersistentKeepalive int      `json:"persistent_keepalive,omitempty"`
	Comment             string   `json:"comment,omitempty"`
}

// ServerConfig holds configuration for the server awg0 interface and all registered peers.
type ServerConfig struct {
	InterfaceName string       `json:"interface_name"` // e.g. "awg0"
	PrivateKey    string       `json:"private_key"`
	Address       string       `json:"address"` // e.g. "10.8.0.1/24"
	ListenPort    int          `json:"listen_port"`
	Obfs          ObfsParams   `json:"obfs"`
	Peers         []PeerConfig `json:"peers"`
}

// ClientConfig holds parameters to generate a native AmneziaWG client configuration file.
type ClientConfig struct {
	ClientPrivateKey    string     `json:"client_private_key"`
	ClientAddress       string     `json:"client_address"` // e.g. "10.8.0.2/32"
	DNS                 []string   `json:"dns"`            // e.g. ["1.1.1.1", "1.0.0.1"]
	ServerPublicKey     string     `json:"server_public_key"`
	ServerEndpoint      string     `json:"server_endpoint"` // e.g. "vpn.example.com:51820"
	AllowedIPs          []string   `json:"allowed_ips"`     // e.g. ["0.0.0.0/0", "::/0"]
	PersistentKeepalive int        `json:"persistent_keepalive"`
	Obfs                ObfsParams `json:"obfs"`
}

// Service provides AmneziaWG operations.
type Service struct {
	configPath    string
	interfaceName string
}

// NewService creates a new AWG service.
func NewService(configPath string, interfaceName string) *Service {
	if configPath == "" {
		configPath = "/etc/amnezia/amneziawg/awg0.conf"
	}
	if interfaceName == "" {
		interfaceName = "awg0"
	}
	return &Service{
		configPath:    configPath,
		interfaceName: interfaceName,
	}
}

// GenerateKeyPair generates a cryptographically secure Curve25519 key pair for Wireguard / AWG.
func GenerateKeyPair() (*KeyPair, error) {
	var priv [32]byte
	if _, err := rand.Read(priv[:]); err != nil {
		return nil, fmt.Errorf("failed to generate random bytes for private key: %w", err)
	}

	// Curve25519 clamping for Wireguard
	priv[0] &= 248
	priv[31] &= 127
	priv[31] |= 64

	pub, err := curve25519.X25519(priv[:], curve25519.Basepoint)
	if err != nil {
		return nil, fmt.Errorf("failed to compute public key: %w", err)
	}

	return &KeyPair{
		PrivateKey: base64.StdEncoding.EncodeToString(priv[:]),
		PublicKey:  base64.StdEncoding.EncodeToString(pub),
	}, nil
}

// GeneratePresharedKey generates a 256-bit preshared key base64-encoded.
func GeneratePresharedKey() (string, error) {
	var key [32]byte
	if _, err := rand.Read(key[:]); err != nil {
		return "", fmt.Errorf("failed to generate preshared key: %w", err)
	}
	return base64.StdEncoding.EncodeToString(key[:]), nil
}

// DefaultObfsParams generates realistic randomized obfuscation parameters for AmneziaWG.
func DefaultObfsParams() ObfsParams {
	randInt := func(min, max int64) int {
		n, err := rand.Int(rand.Reader, big.NewInt(max-min+1))
		if err != nil {
			return int(min)
		}
		return int(min + n.Int64())
	}
	randUint32 := func() uint32 {
		n, err := rand.Int(rand.Reader, big.NewInt(2147483647))
		if err != nil {
			return 1000000000
		}
		return uint32(n.Uint64() + 100000)
	}

	return ObfsParams{
		Jc:   randInt(3, 8),
		Jmin: randInt(40, 70),
		Jmax: randInt(400, 800),
		S1:   randInt(20, 80),
		S2:   randInt(20, 80),
		H1:   randUint32(),
		H2:   randUint32(),
		H3:   randUint32(),
		H4:   randUint32(),
	}
}

// GenerateServerConfig builds the awg0.conf server configuration string.
func GenerateServerConfig(cfg ServerConfig) string {
	var sb strings.Builder

	sb.WriteString("[Interface]\n")
	sb.WriteString(fmt.Sprintf("PrivateKey = %s\n", cfg.PrivateKey))
	sb.WriteString(fmt.Sprintf("Address = %s\n", cfg.Address))
	sb.WriteString(fmt.Sprintf("ListenPort = %d\n", cfg.ListenPort))

	// AWG Obfuscation params
	sb.WriteString(fmt.Sprintf("Jc = %d\n", cfg.Obfs.Jc))
	sb.WriteString(fmt.Sprintf("Jmin = %d\n", cfg.Obfs.Jmin))
	sb.WriteString(fmt.Sprintf("Jmax = %d\n", cfg.Obfs.Jmax))
	sb.WriteString(fmt.Sprintf("S1 = %d\n", cfg.Obfs.S1))
	sb.WriteString(fmt.Sprintf("S2 = %d\n", cfg.Obfs.S2))
	sb.WriteString(fmt.Sprintf("H1 = %d\n", cfg.Obfs.H1))
	sb.WriteString(fmt.Sprintf("H2 = %d\n", cfg.Obfs.H2))
	sb.WriteString(fmt.Sprintf("H3 = %d\n", cfg.Obfs.H3))
	sb.WriteString(fmt.Sprintf("H4 = %d\n", cfg.Obfs.H4))

	for _, peer := range cfg.Peers {
		sb.WriteString("\n[Peer]\n")
		if peer.Comment != "" {
			sb.WriteString(fmt.Sprintf("# %s\n", peer.Comment))
		}
		sb.WriteString(fmt.Sprintf("PublicKey = %s\n", peer.PublicKey))
		if peer.PresharedKey != "" {
			sb.WriteString(fmt.Sprintf("PresharedKey = %s\n", peer.PresharedKey))
		}
		if len(peer.AllowedIPs) > 0 {
			sb.WriteString(fmt.Sprintf("AllowedIPs = %s\n", strings.Join(peer.AllowedIPs, ", ")))
		}
		if peer.Endpoint != "" {
			sb.WriteString(fmt.Sprintf("Endpoint = %s\n", peer.Endpoint))
		}
		if peer.PersistentKeepalive > 0 {
			sb.WriteString(fmt.Sprintf("PersistentKeepalive = %d\n", peer.PersistentKeepalive))
		}
	}

	return sb.String()
}

// GenerateClientConfig builds a native AmneziaWG (.conf) client profile string.
func GenerateClientConfig(client ClientConfig) string {
	var sb strings.Builder

	sb.WriteString("[Interface]\n")
	sb.WriteString(fmt.Sprintf("PrivateKey = %s\n", client.ClientPrivateKey))
	sb.WriteString(fmt.Sprintf("Address = %s\n", client.ClientAddress))

	if len(client.DNS) > 0 {
		sb.WriteString(fmt.Sprintf("DNS = %s\n", strings.Join(client.DNS, ", ")))
	} else {
		sb.WriteString("DNS = 1.1.1.1, 1.0.0.1\n")
	}

	sb.WriteString(fmt.Sprintf("Jc = %d\n", client.Obfs.Jc))
	sb.WriteString(fmt.Sprintf("Jmin = %d\n", client.Obfs.Jmin))
	sb.WriteString(fmt.Sprintf("Jmax = %d\n", client.Obfs.Jmax))
	sb.WriteString(fmt.Sprintf("S1 = %d\n", client.Obfs.S1))
	sb.WriteString(fmt.Sprintf("S2 = %d\n", client.Obfs.S2))
	sb.WriteString(fmt.Sprintf("H1 = %d\n", client.Obfs.H1))
	sb.WriteString(fmt.Sprintf("H2 = %d\n", client.Obfs.H2))
	sb.WriteString(fmt.Sprintf("H3 = %d\n", client.Obfs.H3))
	sb.WriteString(fmt.Sprintf("H4 = %d\n", client.Obfs.H4))

	sb.WriteString("\n[Peer]\n")
	sb.WriteString(fmt.Sprintf("PublicKey = %s\n", client.ServerPublicKey))
	sb.WriteString(fmt.Sprintf("Endpoint = %s\n", client.ServerEndpoint))

	allowedIPs := client.AllowedIPs
	if len(allowedIPs) == 0 {
		allowedIPs = []string{"0.0.0.0/0", "::/0"}
	}
	sb.WriteString(fmt.Sprintf("AllowedIPs = %s\n", strings.Join(allowedIPs, ", ")))

	keepalive := client.PersistentKeepalive
	if keepalive <= 0 {
		keepalive = 25
	}
	sb.WriteString(fmt.Sprintf("PersistentKeepalive = %d\n", keepalive))

	return sb.String()
}

// ApplyConfig saves the configuration to file and reloads the AWG interface via `awg syncconf`.
// If the `awg` CLI tool is missing or fails, it logs softly without terminating the application.
func (s *Service) ApplyConfig(content string) error {
	dir := filepath.Dir(s.configPath)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return fmt.Errorf("failed to create config directory %s: %w", dir, err)
	}

	// Write server configuration with restricted file permissions
	if err := os.WriteFile(s.configPath, []byte(content), 0600); err != nil {
		return fmt.Errorf("failed to write awg config file %s: %w", s.configPath, err)
	}
	log.Printf("[AWG] Successfully written config to %s", s.configPath)

	// Check if `awg` tool exists in PATH
	awgPath, err := exec.LookPath("awg")
	if err != nil {
		log.Printf("[AWG] Note: 'awg' binary not found in PATH. Skipping syncconf (configuration written to file).")
		return nil
	}

	// Execute `awg syncconf <interface> <configPath>`
	cmd := exec.Command(awgPath, "syncconf", s.interfaceName, s.configPath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("[AWG] Warning: 'awg syncconf %s %s' returned error: %v, output: %s",
			s.interfaceName, s.configPath, err, strings.TrimSpace(string(output)))
		// We log softly without returning an unrecoverable fatal error
		return nil
	}

	log.Printf("[AWG] Successfully synced configuration for interface %s", s.interfaceName)
	return nil
}
