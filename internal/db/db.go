package db

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/crypto/curve25519"
	_ "modernc.org/sqlite"

	"kiri-panel/internal/model"
)

// ErrNotFound is returned when a requested record does not exist.
var ErrNotFound = errors.New("record not found")

// DB wraps the SQLite database connection.
type DB struct {
	db *sql.DB
}

// Open initializes SQLite connection and runs schema migrations.
func Open(dbPath string) (*DB, error) {
	// Ensure parent directory exists
	if dir := filepath.Dir(dbPath); dir != "" {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, fmt.Errorf("failed to create db directory: %w", err)
		}
	}

	conn, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	// Recommended connection pooling for SQLite WAL mode
	conn.SetMaxOpenConns(1)
	conn.SetMaxIdleConns(1)
	conn.SetConnMaxLifetime(0)

	// Set pragmas
	pragmas := []string{
		"PRAGMA journal_mode = WAL;",
		"PRAGMA busy_timeout = 5000;",
		"PRAGMA foreign_keys = ON;",
		"PRAGMA synchronous = NORMAL;",
	}
	for _, p := range pragmas {
		if _, err := conn.Exec(p); err != nil {
			conn.Close()
			return nil, fmt.Errorf("failed to set pragma %q: %w", p, err)
		}
	}

	database := &DB{db: conn}
	if err := database.migrate(context.Background()); err != nil {
		conn.Close()
		return nil, fmt.Errorf("migration failed: %w", err)
	}

	return database, nil
}

// Close closes the database connection.
func (d *DB) Close() error {
	return d.db.Close()
}

// migrate creates necessary tables and default configurations.
func (d *DB) migrate(ctx context.Context) error {
	schema := `
	CREATE TABLE IF NOT EXISTS server_config (
		id INTEGER PRIMARY KEY CHECK (id = 1),
		server_ip TEXT NOT NULL,
		server_domain TEXT NOT NULL,
		awg_port INTEGER NOT NULL,
		awg_version TEXT NOT NULL,
		awg_subnet TEXT NOT NULL,
		awg_public_key TEXT NOT NULL,
		awg_private_key TEXT NOT NULL,
		jc INTEGER NOT NULL,
		jmin INTEGER NOT NULL,
		jmax INTEGER NOT NULL,
		s1 INTEGER NOT NULL,
		s2 INTEGER NOT NULL,
		h1 INTEGER NOT NULL,
		h2 INTEGER NOT NULL,
		h3 INTEGER NOT NULL,
		h4 INTEGER NOT NULL,
		hy2_port INTEGER NOT NULL,
		hy2_port_hopping TEXT NOT NULL,
		hy2_obfs_type TEXT NOT NULL,
		hy2_obfs_password TEXT NOT NULL,
		hy2_secret_auth TEXT NOT NULL,
		updated_at DATETIME NOT NULL
	);

	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		enabled INTEGER NOT NULL DEFAULT 1,
		awg_ipv4 TEXT NOT NULL UNIQUE,
		awg_private_key TEXT NOT NULL,
		awg_public_key TEXT NOT NULL,
		awg_preshared_key TEXT NOT NULL,
		hy2_token TEXT NOT NULL UNIQUE,
		traffic_limit INTEGER NOT NULL DEFAULT 0,
		used_traffic INTEGER NOT NULL DEFAULT 0,
		created_at DATETIME NOT NULL,
		updated_at DATETIME NOT NULL
	);

	CREATE INDEX IF NOT EXISTS idx_users_hy2_token ON users(hy2_token);
	CREATE INDEX IF NOT EXISTS idx_users_enabled ON users(enabled);
	`

	if _, err := d.db.ExecContext(ctx, schema); err != nil {
		return fmt.Errorf("failed to execute schema: %w", err)
	}

	return d.ensureDefaultServerConfig(ctx)
}

// ensureDefaultServerConfig initializes default ServerConfig if none exists.
func (d *DB) ensureDefaultServerConfig(ctx context.Context) error {
	var count int
	err := d.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM server_config WHERE id = 1").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	// Generate Curve25519 keypair for WireGuard / AmneziaWG server
	awgPriv, awgPub, err := GenerateWireGuardKeyPair()
	if err != nil {
		return fmt.Errorf("failed to generate server wireguard keypair: %w", err)
	}

	hy2Obfs, err := GenerateRandomToken(12)
	if err != nil {
		return err
	}

	hy2Secret, err := GenerateRandomToken(16)
	if err != nil {
		return err
	}

	now := time.Now().UTC()
	query := `
	INSERT INTO server_config (
		id, server_ip, server_domain, awg_port, awg_version, awg_subnet,
		awg_public_key, awg_private_key, jc, jmin, jmax, s1, s2, h1, h2, h3, h4,
		hy2_port, hy2_port_hopping, hy2_obfs_type, hy2_obfs_password, hy2_secret_auth, updated_at
	) VALUES (
		1, '127.0.0.1', '', 51820, '2.0', '10.8.0.0/24',
		?, ?, 4, 50, 100, 15, 15, 1, 2, 3, 4,
		443, '20000-50000', 'gecko', ?, ?, ?
	)`

	_, err = d.db.ExecContext(ctx, query,
		awgPub, awgPriv,
		hy2Obfs, hy2Secret, now,
	)
	return err
}

// ============================================================================
// ServerConfig CRUD
// ============================================================================

// GetServerConfig returns the active server configuration.
func (d *DB) GetServerConfig(ctx context.Context) (*model.ServerConfig, error) {
	query := `
	SELECT id, server_ip, server_domain, awg_port, awg_version, awg_subnet,
	       awg_public_key, awg_private_key, jc, jmin, jmax, s1, s2, h1, h2, h3, h4,
	       hy2_port, hy2_port_hopping, hy2_obfs_type, hy2_obfs_password, hy2_secret_auth, updated_at
	FROM server_config WHERE id = 1`

	cfg := &model.ServerConfig{}
	err := d.db.QueryRowContext(ctx, query).Scan(
		&cfg.ID, &cfg.ServerIP, &cfg.ServerDomain, &cfg.AWG_Port, &cfg.AWG_Version, &cfg.AWG_Subnet,
		&cfg.AWG_PublicKey, &cfg.AWG_PrivateKey,
		&cfg.AWG_Params.Jc, &cfg.AWG_Params.Jmin, &cfg.AWG_Params.Jmax,
		&cfg.AWG_Params.S1, &cfg.AWG_Params.S2,
		&cfg.AWG_Params.H1, &cfg.AWG_Params.H2, &cfg.AWG_Params.H3, &cfg.AWG_Params.H4,
		&cfg.Hy2_Port, &cfg.Hy2_PortHopping, &cfg.Hy2_ObfsType,
		&cfg.Hy2_ObfsPassword, &cfg.Hy2_SecretAuth, &cfg.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return cfg, nil
}

// UpdateServerConfig updates the server configuration.
func (d *DB) UpdateServerConfig(ctx context.Context, cfg *model.ServerConfig) error {
	query := `
	UPDATE server_config SET
		server_ip = ?, server_domain = ?, awg_port = ?, awg_version = ?, awg_subnet = ?,
		awg_public_key = ?, awg_private_key = ?,
		jc = ?, jmin = ?, jmax = ?, s1 = ?, s2 = ?, h1 = ?, h2 = ?, h3 = ?, h4 = ?,
		hy2_port = ?, hy2_port_hopping = ?, hy2_obfs_type = ?,
		hy2_obfs_password = ?, hy2_secret_auth = ?, updated_at = ?
	WHERE id = 1`

	cfg.UpdatedAt = time.Now().UTC()
	res, err := d.db.ExecContext(ctx, query,
		cfg.ServerIP, cfg.ServerDomain, cfg.AWG_Port, cfg.AWG_Version, cfg.AWG_Subnet,
		cfg.AWG_PublicKey, cfg.AWG_PrivateKey,
		cfg.AWG_Params.Jc, cfg.AWG_Params.Jmin, cfg.AWG_Params.Jmax,
		cfg.AWG_Params.S1, cfg.AWG_Params.S2,
		cfg.AWG_Params.H1, cfg.AWG_Params.H2, cfg.AWG_Params.H3, cfg.AWG_Params.H4,
		cfg.Hy2_Port, cfg.Hy2_PortHopping, cfg.Hy2_ObfsType,
		cfg.Hy2_ObfsPassword, cfg.Hy2_SecretAuth, cfg.UpdatedAt,
	)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

// ============================================================================
// Users CRUD
// ============================================================================

// CreateUser creates a new user, auto-generating WireGuard keys, PSK, Hy2 token and IP if missing.
func (d *DB) CreateUser(ctx context.Context, u *model.User) (*model.User, error) {
	if strings.TrimSpace(u.Username) == "" {
		return nil, errors.New("username cannot be empty")
	}

	// Auto-generate WireGuard / Curve25519 keypair if missing
	if u.AWG_PrivateKey == "" || u.AWG_PublicKey == "" {
		priv, pub, err := GenerateWireGuardKeyPair()
		if err != nil {
			return nil, fmt.Errorf("failed to generate awg keys: %w", err)
		}
		u.AWG_PrivateKey = priv
		u.AWG_PublicKey = pub
	}

	// Auto-generate PresharedKey if missing
	if u.AWG_PresharedKey == "" {
		psk, err := GeneratePresharedKey()
		if err != nil {
			return nil, fmt.Errorf("failed to generate preshared key: %w", err)
		}
		u.AWG_PresharedKey = psk
	}

	// Auto-generate Hy2 token if missing
	if u.Hy2_Token == "" {
		tok, err := GenerateRandomToken(16)
		if err != nil {
			return nil, fmt.Errorf("failed to generate hy2 token: %w", err)
		}
		u.Hy2_Token = tok
	}

	// Auto-allocate IPv4 if missing
	if u.AWG_IPv4 == "" {
		ip, err := d.allocateNextIPv4(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to allocate client ip: %w", err)
		}
		u.AWG_IPv4 = ip
	}

	now := time.Now().UTC()
	u.CreatedAt = now
	u.UpdatedAt = now

	query := `
	INSERT INTO users (
		username, enabled, awg_ipv4, awg_private_key, awg_public_key,
		awg_preshared_key, hy2_token, traffic_limit, used_traffic, created_at, updated_at
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	res, err := d.db.ExecContext(ctx, query,
		u.Username, boolToInt(u.Enabled), u.AWG_IPv4, u.AWG_PrivateKey, u.AWG_PublicKey,
		u.AWG_PresharedKey, u.Hy2_Token, u.TrafficLimit, u.UsedTraffic, u.CreatedAt, u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	u.ID = id

	return u, nil
}

// GetUserByID fetches a user by internal ID.
func (d *DB) GetUserByID(ctx context.Context, id int64) (*model.User, error) {
	query := `
	SELECT id, username, enabled, awg_ipv4, awg_private_key, awg_public_key,
	       awg_preshared_key, hy2_token, traffic_limit, used_traffic, created_at, updated_at
	FROM users WHERE id = ?`

	u := &model.User{}
	var enabledInt int
	err := d.db.QueryRowContext(ctx, query, id).Scan(
		&u.ID, &u.Username, &enabledInt, &u.AWG_IPv4, &u.AWG_PrivateKey, &u.AWG_PublicKey,
		&u.AWG_PresharedKey, &u.Hy2_Token, &u.TrafficLimit, &u.UsedTraffic, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.Enabled = (enabledInt == 1)
	return u, nil
}

// GetUserByToken fetches a user by Hysteria 2 token.
func (d *DB) GetUserByToken(ctx context.Context, token string) (*model.User, error) {
	query := `
	SELECT id, username, enabled, awg_ipv4, awg_private_key, awg_public_key,
	       awg_preshared_key, hy2_token, traffic_limit, used_traffic, created_at, updated_at
	FROM users WHERE hy2_token = ?`

	u := &model.User{}
	var enabledInt int
	err := d.db.QueryRowContext(ctx, query, token).Scan(
		&u.ID, &u.Username, &enabledInt, &u.AWG_IPv4, &u.AWG_PrivateKey, &u.AWG_PublicKey,
		&u.AWG_PresharedKey, &u.Hy2_Token, &u.TrafficLimit, &u.UsedTraffic, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.Enabled = (enabledInt == 1)
	return u, nil
}

// GetUserByUsername fetches a user by unique username.
func (d *DB) GetUserByUsername(ctx context.Context, username string) (*model.User, error) {
	query := `
	SELECT id, username, enabled, awg_ipv4, awg_private_key, awg_public_key,
	       awg_preshared_key, hy2_token, traffic_limit, used_traffic, created_at, updated_at
	FROM users WHERE username = ?`

	u := &model.User{}
	var enabledInt int
	err := d.db.QueryRowContext(ctx, query, username).Scan(
		&u.ID, &u.Username, &enabledInt, &u.AWG_IPv4, &u.AWG_PrivateKey, &u.AWG_PublicKey,
		&u.AWG_PresharedKey, &u.Hy2_Token, &u.TrafficLimit, &u.UsedTraffic, &u.CreatedAt, &u.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.Enabled = (enabledInt == 1)
	return u, nil
}

// ListUsers returns all users ordered by creation date descending.
func (d *DB) ListUsers(ctx context.Context) ([]*model.User, error) {
	query := `
	SELECT id, username, enabled, awg_ipv4, awg_private_key, awg_public_key,
	       awg_preshared_key, hy2_token, traffic_limit, used_traffic, created_at, updated_at
	FROM users ORDER BY id ASC`

	rows, err := d.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*model.User
	for rows.Next() {
		u := &model.User{}
		var enabledInt int
		if err := rows.Scan(
			&u.ID, &u.Username, &enabledInt, &u.AWG_IPv4, &u.AWG_PrivateKey, &u.AWG_PublicKey,
			&u.AWG_PresharedKey, &u.Hy2_Token, &u.TrafficLimit, &u.UsedTraffic, &u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, err
		}
		u.Enabled = (enabledInt == 1)
		users = append(users, u)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return users, nil
}

// UpdateUser updates user properties (username, keys, limits, token).
func (d *DB) UpdateUser(ctx context.Context, u *model.User) error {
	query := `
	UPDATE users SET
		username = ?, enabled = ?, awg_ipv4 = ?, awg_private_key = ?,
		awg_public_key = ?, awg_preshared_key = ?, hy2_token = ?,
		traffic_limit = ?, used_traffic = ?, updated_at = ?
	WHERE id = ?`

	u.UpdatedAt = time.Now().UTC()
	res, err := d.db.ExecContext(ctx, query,
		u.Username, boolToInt(u.Enabled), u.AWG_IPv4, u.AWG_PrivateKey,
		u.AWG_PublicKey, u.AWG_PresharedKey, u.Hy2_Token,
		u.TrafficLimit, u.UsedTraffic, u.UpdatedAt, u.ID,
	)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

// DeleteUser deletes a user by ID.
func (d *DB) DeleteUser(ctx context.Context, id int64) error {
	res, err := d.db.ExecContext(ctx, "DELETE FROM users WHERE id = ?", id)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

// ToggleUser enables or disables a user by ID.
func (d *DB) ToggleUser(ctx context.Context, id int64, enabled bool) error {
	query := `UPDATE users SET enabled = ?, updated_at = ? WHERE id = ?`
	now := time.Now().UTC()
	res, err := d.db.ExecContext(ctx, query, boolToInt(enabled), now, id)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

// UpdateUserTraffic increments the user's used traffic counter.
func (d *DB) UpdateUserTraffic(ctx context.Context, id int64, bytesAdded int64) error {
	query := `UPDATE users SET used_traffic = used_traffic + ?, updated_at = ? WHERE id = ?`
	now := time.Now().UTC()
	res, err := d.db.ExecContext(ctx, query, bytesAdded, now, id)
	if err != nil {
		return err
	}
	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

// ============================================================================
// Cryptographic & IP Helpers
// ============================================================================

// GenerateWireGuardKeyPair generates a standard Curve25519 keypair for WireGuard/AmneziaWG.
func GenerateWireGuardKeyPair() (string, string, error) {
	var privKey [32]byte
	if _, err := io.ReadFull(rand.Reader, privKey[:]); err != nil {
		return "", "", err
	}

	// Curve25519 clamping
	privKey[0] &= 248
	privKey[31] &= 127
	privKey[31] |= 64

	pubKey, err := curve25519.X25519(privKey[:], curve25519.Basepoint)
	if err != nil {
		return "", "", err
	}

	privBase64 := base64.StdEncoding.EncodeToString(privKey[:])
	pubBase64 := base64.StdEncoding.EncodeToString(pubKey)

	return privBase64, pubBase64, nil
}

// GeneratePresharedKey generates a 32-byte WireGuard preshared key in Base64 format.
func GeneratePresharedKey() (string, error) {
	key := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(key), nil
}

// GenerateRandomToken generates a cryptographically secure random token of specified byte length in hex format.
func GenerateRandomToken(byteLength int) (string, error) {
	b := make([]byte, byteLength)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// allocateNextIPv4 searches for the next available IP in the AWG subnet (e.g. 10.8.0.2 - 10.8.0.254).
func (d *DB) allocateNextIPv4(ctx context.Context) (string, error) {
	var subnetStr string
	err := d.db.QueryRowContext(ctx, "SELECT awg_subnet FROM server_config WHERE id = 1").Scan(&subnetStr)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return "", err
	}
	if subnetStr == "" {
		subnetStr = "10.8.0.0/24"
	}

	_, ipNet, err := net.ParseCIDR(subnetStr)
	if err != nil {
		return "", fmt.Errorf("invalid subnet cidr %s: %w", subnetStr, err)
	}

	// Fetch all used IPs
	rows, err := d.db.QueryContext(ctx, "SELECT awg_ipv4 FROM users")
	if err != nil {
		return "", err
	}
	defer rows.Close()

	usedIPs := make(map[string]bool)
	for rows.Next() {
		var ip string
		if err := rows.Scan(&ip); err == nil {
			usedIPs[ip] = true
		}
	}

	// Iterate over subnet IP range (starting at .2 to leave .1 for server)
	ip := ipNet.IP.To4()
	if ip == nil {
		return "", errors.New("only IPv4 subnets are currently supported")
	}

	// For a standard /24 (like 10.8.0.0/24), iterate from host 2 to 254
	for host := 2; host < 255; host++ {
		candidate := fmt.Sprintf("%d.%d.%d.%d", ip[0], ip[1], ip[2], host)
		candIP := net.ParseIP(candidate)
		if candIP != nil && ipNet.Contains(candIP) && !usedIPs[candidate] {
			return candidate, nil
		}
	}

	return "", errors.New("no available IP addresses left in subnet")
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
