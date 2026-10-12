package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"kiri-panel/internal/api"
	"kiri-panel/internal/config"
	"kiri-panel/internal/db"
	"kiri-panel/internal/service/awg"
	"kiri-panel/internal/service/hy2"
	"kiri-panel/web"
)

func main() {
	log.Println("==================================================")
	log.Println("           KIRI PANEL SERVER v2.0.0               ")
	log.Println("    Obfuscated AmneziaWG + Hysteria 2 Gateway     ")
	log.Println("==================================================")

	// 1. Load runtime configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("[FATAL] Failed to load configuration: %v", err)
	}
	log.Printf("[CONFIG] Data directory: %s", cfg.DataDir)
	log.Printf("[CONFIG] HTTP Port: %d", cfg.Port)

	// 2. Initialize SQLite Database
	dbPath := filepath.Join(cfg.DataDir, "kiri.db")
	database, err := db.Open(dbPath)
	if err != nil {
		log.Fatalf("[FATAL] Failed to initialize database at %s: %v", dbPath, err)
	}
	defer func() {
		if err := database.Close(); err != nil {
			log.Printf("[DB] Error closing database: %v", err)
		}
	}()
	log.Printf("[DB] Connected to SQLite database at %s", dbPath)

	// 3. Initialize AmneziaWG Service
	awgService := awg.NewService(cfg.AWGConfigPath, "awg0")

	// 4. Initialize Hysteria 2 Service with DB authenticator
	hy2ConfigPath := filepath.Join(cfg.DataDir, "hy2", "config.yaml")
	authenticator := hy2.AuthenticatorFunc(func(ctx context.Context, token string) (string, bool, error) {
		u, err := database.GetUserByToken(ctx, token)
		if err != nil {
			return "", false, err
		}
		return u.Username, u.Enabled, nil
	})
	hy2Service := hy2.NewService(authenticator, hy2ConfigPath)

	// 5. Initial configuration synchronization
	initServicesConfig(database, awgService, hy2Service, cfg)

	// 6. Setup Gin HTTP Engine
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.LoggerWithConfig(gin.LoggerConfig{
		SkipPaths: []string{"/api/status"},
	}))
	router.Use(gin.Recovery())

	// 7. Register API routes & webhooks
	apiHandler := api.NewAPI(cfg, database, awgService, hy2Service)
	apiHandler.RegisterRoutes(router)

	// 8. Setup SPA Static Files & Fallback
	setupStaticFS(router)

	// 9. HTTP Server with Graceful Shutdown
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("[HTTP] Kiri Panel listening on http://0.0.0.0:%d", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("[FATAL] HTTP server failed to start: %v", err)
		}
	}()

	// Wait for shutdown signals
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM, os.Interrupt)
	sig := <-quit
	log.Printf("[SYSTEM] Received signal %v. Initiating graceful shutdown...", sig)

	// 10. Graceful shutdown context
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("[SYSTEM] Server forced to shutdown: %v", err)
	} else {
		log.Println("[SYSTEM] HTTP server gracefully terminated.")
	}

	log.Println("[SYSTEM] Kiri Panel stopped successfully.")
}

// initServicesConfig syncs server configuration and active peers on server boot.
func initServicesConfig(d *db.DB, awgService *awg.Service, hy2Service *hy2.Service, cfg *config.Config) {
	ctx := context.Background()
	serverCfg, err := d.GetServerConfig(ctx)
	if err != nil {
		log.Printf("[INIT] Warning: could not load initial server config: %v", err)
		return
	}

	// Auto-detect public IP if server_ip is default 127.0.0.1 or empty
	if serverCfg.ServerIP == "127.0.0.1" || serverCfg.ServerIP == "" {
		go func() {
			client := &http.Client{Timeout: 3 * time.Second}
			for _, endpoint := range []string{"https://api.ipify.org", "https://icanhazip.com", "https://ifconfig.me"} {
				resp, err := client.Get(endpoint)
				if err == nil && resp.StatusCode == http.StatusOK {
					defer resp.Body.Close()
					ipBytes, _ := io.ReadAll(resp.Body)
					detectedIP := strings.TrimSpace(string(ipBytes))
					if detectedIP != "" && !strings.Contains(detectedIP, "<") {
						serverCfg.ServerIP = detectedIP
						_ = d.UpdateServerConfig(context.Background(), serverCfg)
						log.Printf("[INIT] Auto-detected public server IP: %s", detectedIP)
						break
					}
				}
			}
		}()
	}

	// 1. Sync Hysteria 2 configuration file
	hy2Conf := hy2.ServerConfig{
		Listen:        fmt.Sprintf(":%d", serverCfg.Hy2_Port),
		ObfsType:      serverCfg.Hy2_ObfsType,
		ObfsPassword:  serverCfg.Hy2_ObfsPassword,
		AuthURL:       fmt.Sprintf("http://127.0.0.1:%d/api/internal/hy2/auth", cfg.Port),
		TLSCert:       filepath.Join(cfg.DataDir, "certs", "server.crt"),
		TLSKey:        filepath.Join(cfg.DataDir, "certs", "server.key"),
		MasqueradeURL: "https://bing.com",
	}
	if err := hy2Service.SaveConfig(hy2.GenerateServerConfig(hy2Conf)); err != nil {
		log.Printf("[INIT] Warning: writing hy2 config: %v", err)
	} else {
		log.Printf("[INIT] Hysteria 2 configuration synced.")
	}

	// 2. Sync AmneziaWG configuration file
	users, err := d.ListUsers(ctx)
	if err == nil {
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
		awgConf := awg.ServerConfig{
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
		if err := awgService.ApplyConfig(awg.GenerateServerConfig(awgConf)); err != nil {
			log.Printf("[INIT] Warning: applying awg config: %v", err)
		} else {
			log.Printf("[INIT] AmneziaWG configuration synced with %d active peers.", len(peers))
		}
	}
}

// setupStaticFS configures serving built SPA assets and fallback routing for Gin.
func setupStaticFS(r *gin.Engine) {
	embeddedFS, err := web.GetFS()
	var httpFS http.FileSystem
	if err == nil {
		httpFS = http.FS(embeddedFS)
	}

	r.NoRoute(func(c *gin.Context) {
		reqPath := strings.TrimPrefix(c.Request.URL.Path, "/")

		// Don't intercept API or subscription 404s
		if strings.HasPrefix(reqPath, "api/") || strings.HasPrefix(reqPath, "sub/") {
			c.JSON(http.StatusNotFound, gin.H{"error": "route not found"})
			return
		}

		// 1. Check local file on disk first (for development or mounted dist)
		localPath := filepath.Join(".", "web", "dist", filepath.Clean(reqPath))
		if info, err := os.Stat(localPath); err == nil && !info.IsDir() {
			c.File(localPath)
			return
		}

		// 2. Check embedded filesystem for static file
		if httpFS != nil && reqPath != "" {
			if f, err := httpFS.Open(reqPath); err == nil {
				defer f.Close()
				if stat, err := f.Stat(); err == nil && !stat.IsDir() {
					http.FileServer(httpFS).ServeHTTP(c.Writer, c.Request)
					return
				}
			}
		}

		// 3. Fallback to index.html for Single Page Application client-side routing
		localIndex := filepath.Join(".", "web", "dist", "index.html")
		if _, err := os.Stat(localIndex); err == nil {
			c.File(localIndex)
			return
		}

		if httpFS != nil {
			if f, err := httpFS.Open("index.html"); err == nil {
				defer f.Close()
				if rseeker, ok := f.(io.ReadSeeker); ok {
					c.Header("Content-Type", "text/html; charset=utf-8")
					http.ServeContent(c.Writer, c.Request, "index.html", time.Now(), rseeker)
					return
				}
			}
		}

		c.String(http.StatusOK, "Kiri Panel Backend is Running")
	})
}
