package model

import (
	"time"
)

// User represents a client account with WireGuard / AmneziaWG and Hysteria 2 credentials.
type User struct {
	ID              int64     `json:"id" db:"id"`
	Username        string    `json:"username" db:"username"`
	Enabled         bool      `json:"enabled" db:"enabled"`
	AWG_IPv4        string    `json:"awg_ipv4" db:"awg_ipv4"`
	AWG_PrivateKey  string    `json:"awg_private_key,omitempty" db:"awg_private_key"`
	AWG_PublicKey   string    `json:"awg_public_key" db:"awg_public_key"`
	AWG_PresharedKey string   `json:"awg_preshared_key,omitempty" db:"awg_preshared_key"`
	Hy2_Token       string    `json:"hy2_token" db:"hy2_token"`
	TrafficLimit    int64     `json:"traffic_limit" db:"traffic_limit"` // In bytes, 0 = unlimited
	UsedTraffic     int64     `json:"used_traffic" db:"used_traffic"`   // In bytes
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// AWGParams holds AmneziaWG protocol obfuscation parameters.
type AWGParams struct {
	Jc   int   `json:"jc" db:"jc"`     // Junk packet count
	Jmin int   `json:"jmin" db:"jmin"` // Junk packet minimum size
	Jmax int   `json:"jmax" db:"jmax"` // Junk packet maximum size
	S1   int   `json:"s1" db:"s1"`     // Init packet junk size
	S2   int   `json:"s2" db:"s2"`     // Response packet junk size
	H1   int64 `json:"h1" db:"h1"`     // Init packet header signature
	H2   int64 `json:"h2" db:"h2"`     // Response packet header signature
	H3   int64 `json:"h3" db:"h3"`     // Underload packet header signature
	H4   int64 `json:"h4" db:"h4"`     // Transport packet header signature
}

// ServerConfig stores the central network & protocol configuration for Kiri Panel.
type ServerConfig struct {
	ID              int64     `json:"id" db:"id"`
	ServerIP        string    `json:"server_ip" db:"server_ip"`
	ServerDomain    string    `json:"server_domain" db:"server_domain"`
	AWG_Port        int       `json:"awg_port" db:"awg_port"`
	AWG_Version     string    `json:"awg_version" db:"awg_version"` // e.g. "2.0" or "3.1"
	AWG_Subnet      string    `json:"awg_subnet" db:"awg_subnet"`   // e.g. "10.8.0.0/24"
	AWG_PublicKey   string    `json:"awg_public_key" db:"awg_public_key"`
	AWG_PrivateKey  string    `json:"awg_private_key,omitempty" db:"awg_private_key"`
	AWG_Params      AWGParams `json:"awg_params"`
	Hy2_Port        int       `json:"hy2_port" db:"hy2_port"`
	Hy2_PortHopping string    `json:"hy2_port_hopping" db:"hy2_port_hopping"` // e.g. "20000-50000"
	Hy2_ObfsType    string    `json:"hy2_obfs_type" db:"hy2_obfs_type"`       // e.g. "gecko"
	Hy2_ObfsPassword string   `json:"hy2_obfs_password" db:"hy2_obfs_password"`
	Hy2_SecretAuth  string    `json:"hy2_secret_auth" db:"hy2_secret_auth"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}
