package web

import (
	"embed"
	"io/fs"
)

//go:embed all:dist
var distFS embed.FS

// GetFS returns the fs.FS for the web/dist folder.
func GetFS() (fs.FS, error) {
	return fs.Sub(distFS, "dist")
}
